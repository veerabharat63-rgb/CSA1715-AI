"""
Real PyTorch Training & ONNX Export Pipeline on 3,500+ Image Agronomic Dataset.
Trains MobileNetV3-Small on the labeled dataset, generates real training telemetry
(loss/accuracy curves, confusion matrix, precision/recall per class), and exports
the trained weights to `model.onnx` for both FastAPI and client-side onnxruntime-web.
"""

from __future__ import annotations

import os
import sys
import time
import json
import shutil
import logging
from pathlib import Path
from typing import Dict, Any, List

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from sklearn.metrics import classification_report, confusion_matrix

from model import MobileNetV3SmallClassifier, NUM_CLASSES, CLASSES
from dataset_loader import build_dataset, DATASET_DIR, TRAIN_DIR, VAL_DIR

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("trainer")

BASE_DIR = Path(__file__).resolve().parent
METRICS_JSON_PATH = BASE_DIR / "training_metrics.json"
ONNX_EXPORT_PATH = BASE_DIR / "model.onnx"
PT_EXPORT_PATH = BASE_DIR / "model.pt"

FRONTEND_PUBLIC_ONNX = BASE_DIR.parent / "frontend" / "public" / "model.onnx"
FRONTEND_METRICS_JSON = BASE_DIR.parent / "frontend" / "src" / "data" / "trainingMetrics.json"


def get_data_transforms():
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.3),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.15),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    return train_transform, val_transform


def train_network(
    epochs: int = 5,
    batch_size: int = 32,
    lr: float = 1e-3,
    device: str = "cuda" if torch.cuda.is_available() else "cpu",
    force_rebuild: bool = False,
) -> Dict[str, Any]:
    # 1. Ensure 3,500+ dataset exists
    logger.info("Verifying dataset status...")
    summary = build_dataset(force_recreate=force_rebuild)
    logger.info(f"Dataset verified: {summary['total_images']} total images ({summary['total_train']} train / {summary['total_val']} val)")

    train_tf, val_tf = get_data_transforms()

    # Load dataset
    train_dataset = datasets.ImageFolder(str(TRAIN_DIR), transform=train_tf)
    val_dataset = datasets.ImageFolder(str(VAL_DIR), transform=val_tf)

    # Verify class ordering matches model CLASSES
    logger.info(f"ImageFolder classes: {train_dataset.classes}")
    assert len(train_dataset.classes) == NUM_CLASSES, f"Expected {NUM_CLASSES} classes, found {len(train_dataset.classes)}"

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=0)

    # 2. Instantiate Neural Network
    logger.info(f"Initializing MobileNetV3-Small classifier on {device}...")
    model = MobileNetV3SmallClassifier(num_classes=NUM_CLASSES).to(device)

    criterion = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

    epoch_history: List[Dict[str, Any]] = []
    best_val_acc = 0.0
    start_time = time.time()

    # 3. Training Loop
    logger.info(f"Starting training on {summary['total_train']} images for {epochs} epochs...")

    for epoch in range(1, epochs + 1):
        t0 = time.time()
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            train_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            train_correct += torch.sum(preds == labels.data).item()
            train_total += images.size(0)

        scheduler.step()
        epoch_train_loss = train_loss / train_total
        epoch_train_acc = (train_correct / train_total) * 100.0

        # Validation phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        all_preds = []
        all_labels = []

        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data).item()
                val_total += images.size(0)
                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())

        epoch_val_loss = val_loss / val_total
        epoch_val_acc = (val_correct / val_total) * 100.0
        epoch_duration = round(time.time() - t0, 1)

        logger.info(
            f"Epoch [{epoch}/{epochs}] ({epoch_duration}s) | "
            f"Train Loss: {epoch_train_loss:.4f} Acc: {epoch_train_acc:.1f}% | "
            f"Val Loss: {epoch_val_loss:.4f} Acc: {epoch_val_acc:.1f}%"
        )

        epoch_history.append({
            "epoch": epoch,
            "train_loss": round(epoch_train_loss, 4),
            "train_acc": round(epoch_train_acc, 2),
            "val_loss": round(epoch_val_loss, 4),
            "val_acc": round(epoch_val_acc, 2),
            "lr": round(scheduler.get_last_lr()[0], 6),
            "duration_s": epoch_duration,
        })

        if epoch_val_acc > best_val_acc:
            best_val_acc = epoch_val_acc
            torch.save(model.state_dict(), str(PT_EXPORT_PATH))

    # 4. Final Evaluation & Detailed Metrics Computation
    logger.info("Computing detailed classification report & confusion matrix...")
    report_dict = classification_report(all_labels, all_preds, target_names=train_dataset.classes, output_dict=True)
    cm = confusion_matrix(all_labels, all_preds).tolist()

    per_class_metrics = {}
    for cls in train_dataset.classes:
        per_class_metrics[cls] = {
            "precision": round(report_dict[cls]["precision"] * 100.0, 1),
            "recall": round(report_dict[cls]["recall"] * 100.0, 1),
            "f1_score": round(report_dict[cls]["f1-score"] * 100.0, 1),
            "support": int(report_dict[cls]["support"]),
        }

    training_duration_s = round(time.time() - start_time, 1)

    # 5. Export to ONNX
    logger.info(f"Exporting trained model to ONNX format at {ONNX_EXPORT_PATH}...")
    model.eval().to("cpu")
    dummy_input = torch.randn(1, 3, 224, 224, dtype=torch.float32)

    torch.onnx.export(
        model,
        dummy_input,
        str(ONNX_EXPORT_PATH),
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={"input": {0: "batch_size"}, "output": {0: "batch_size"}},
        dynamo=False,
    )

    # Copy model.onnx to frontend/public and frontend/dist
    if FRONTEND_PUBLIC_ONNX.parent.exists():
        shutil.copyfile(str(ONNX_EXPORT_PATH), str(FRONTEND_PUBLIC_ONNX))
        logger.info(f"Copied model.onnx to frontend: {FRONTEND_PUBLIC_ONNX}")

    frontend_dist_onnx = BASE_DIR.parent / "frontend" / "dist" / "model.onnx"
    if frontend_dist_onnx.parent.exists():
        shutil.copyfile(str(ONNX_EXPORT_PATH), str(frontend_dist_onnx))
        logger.info(f"Copied model.onnx to frontend dist: {frontend_dist_onnx}")

    # 6. Save Full Telemetry JSON & Class Names Mapping
    class_names_path = BASE_DIR / "class_names.json"
    with open(class_names_path, "w", encoding="utf-8") as f:
        json.dump(train_dataset.classes, f, indent=2)
    logger.info(f"Saved class names to {class_names_path}")

    frontend_class_names = BASE_DIR.parent / "frontend" / "src" / "data" / "class_names.json"
    if frontend_class_names.parent.exists():
        with open(frontend_class_names, "w", encoding="utf-8") as f:
            json.dump(train_dataset.classes, f, indent=2)
        logger.info(f"Copied class names to frontend: {frontend_class_names}")

    metrics_payload = {
        "dataset_name": "PlantVillage + PlantDoc + CropGuard Agronomic Dataset",
        "dataset_specification": ">3,500 Labeled Rose & Crop Foliage Images",
        "total_images": summary["total_images"],
        "num_classes": NUM_CLASSES,
        "classes": train_dataset.classes,
        "class_distribution": summary["total_by_class"],
        "train_count": summary["total_train"],
        "val_count": summary["total_val"],
        "train_val_split": "80% / 20%",
        "model_architecture": "MobileNetV3-Small (Transfer Learned + Lesion Head)",
        "epochs_trained": epochs,
        "training_duration_s": training_duration_s,
        "final_train_acc": epoch_history[-1]["train_acc"],
        "final_val_acc": epoch_history[-1]["val_acc"],
        "best_val_acc": round(best_val_acc, 2),
        "overall_macro_f1": round(report_dict["macro avg"]["f1-score"] * 100.0, 1),
        "epoch_history": epoch_history,
        "per_class_metrics": per_class_metrics,
        "confusion_matrix": cm,
        "trained_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    with open(METRICS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)
    logger.info(f"Saved training metrics to {METRICS_JSON_PATH}")

    # Copy to frontend for static deployment
    if FRONTEND_METRICS_JSON.parent.exists():
        with open(FRONTEND_METRICS_JSON, "w", encoding="utf-8") as f:
            json.dump(metrics_payload, f, indent=2)
        logger.info(f"Copied training metrics to frontend: {FRONTEND_METRICS_JSON}")

    return metrics_payload


if __name__ == "__main__":
    epochs = 5
    force = "--force" in sys.argv
    for arg in sys.argv[1:]:
        if arg.isdigit():
            epochs = int(arg)
    metrics = train_network(epochs=epochs, batch_size=64, force_rebuild=force)
    print("\n" + "=" * 65)
    print("MODEL TRAINING COMPLETE!")
    print(f"Total Dataset Images: {metrics['total_images']}")
    print(f"Final Train Accuracy: {metrics['final_train_acc']}%")
    print(f"Final Validation Accuracy: {metrics['final_val_acc']}%")
    print(f"Overall Macro F1: {metrics['overall_macro_f1']}%")
    print(f"ONNX Model Exported: {ONNX_EXPORT_PATH}")
    print("=" * 65 + "\n")
