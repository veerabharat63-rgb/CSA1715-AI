"""
Model Setup & ONNX Export Script for CropGuard AI.

Initializes the MobileNetV3-Small classifier for the 5 rose pathology classes:
1. Healthy
2. Black Spot (Diplocarpon rosae)
3. Powdery Mildew (Podosphaera pannosa)
4. Rust (Phragmidium mucronatum)
5. Chemical Burn (Abiotic Phytotoxicity)

Exports the neural network to:
- backend/model.onnx
- frontend/public/model.onnx (for direct client-side onnxruntime-web execution)

NOTE ON WEIGHTS:
The baseline exported model uses a structured MobileNetV3-Small backbone with
kaiming-initialized classification head for immediate testing and deployment.
For production agricultural accuracy, use `train.py` to fine-tune on labeled
PlantVillage / rose leaf disease datasets.
"""

from __future__ import annotations

import os
import sys
import shutil
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

try:
    import torch
    import torch.nn as nn
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

from model import MobileNetV3SmallClassifier, NUM_CLASSES, CLASSES


def export_model():
    if not HAS_TORCH:
        logger.error("PyTorch is required to export the model. Please install torch.")
        sys.exit(1)

    logger.info("Initializing MobileNetV3-Small 5-class crop disease classifier...")
    model = MobileNetV3SmallClassifier(num_classes=NUM_CLASSES)
    model.eval()

    # Save PyTorch weights
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    pt_path = os.path.join(backend_dir, "model.pt")
    torch.save(model.state_dict(), pt_path)
    logger.info("Saved PyTorch state dictionary to %s", pt_path)

    # Export to ONNX
    onnx_path = os.path.join(backend_dir, "model.onnx")
    dummy_input = torch.randn(1, 3, 224, 224, dtype=torch.float32)

    logger.info("Exporting model to ONNX format at %s...", onnx_path)
    try:
        torch.onnx.export(
            model,
            dummy_input,
            onnx_path,
            export_params=True,
            opset_version=14,
            do_constant_folding=True,
            input_names=["input"],
            output_names=["output"],
            dynamic_axes={
                "input": {0: "batch_size"},
                "output": {0: "batch_size"},
            },
            dynamo=False,
        )
        logger.info("Successfully exported %s (size: %.2f MB)", onnx_path, os.path.getsize(onnx_path) / (1024 * 1024))
    except Exception as e:
        logger.warning("Export with opset 14 note: %s. Retrying with opset 12...", e)
        # Try fallback opset version 12
        try:
            torch.onnx.export(
                model,
                dummy_input,
                onnx_path,
                export_params=True,
                opset_version=12,
                do_constant_folding=True,
                input_names=["input"],
                output_names=["output"],
                dynamo=False,
            )
            logger.info("Successfully exported with opset 12: %s", onnx_path)
        except Exception as e2:
            logger.error("Fallback export also failed: %s", e2)
            sys.exit(1)

    # Copy to frontend/public for static client-side onnxruntime-web execution
    frontend_public = os.path.join(os.path.dirname(backend_dir), "frontend", "public")
    os.makedirs(frontend_public, exist_ok=True)
    frontend_onnx = os.path.join(frontend_public, "model.onnx")
    shutil.copyfile(onnx_path, frontend_onnx)
    logger.info("Copied model.onnx to frontend public directory: %s", frontend_onnx)

    # Also copy to frontend/dist if built
    frontend_dist = os.path.join(os.path.dirname(backend_dir), "frontend", "dist")
    if os.path.exists(frontend_dist):
        dist_onnx = os.path.join(frontend_dist, "model.onnx")
        shutil.copyfile(onnx_path, dist_onnx)
        logger.info("Copied model.onnx to frontend dist directory: %s", dist_onnx)

    print("\n" + "=" * 65)
    print("CropGuard AI - Precision Rose Farming Model Initialized")
    print("=" * 65)
    print(f"• Classes ({NUM_CLASSES}): {', '.join(CLASSES)}")
    print(f"• Input Shape: [1, 3, 224, 224] (NCHW RGB, ImageNet Normalized)")
    print(f"• Output Shape: [1, {NUM_CLASSES}] (Logits for Softmax)")
    print(f"• Backend Model: {onnx_path}")
    print(f"• Frontend Model: {frontend_onnx}")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    export_model()
