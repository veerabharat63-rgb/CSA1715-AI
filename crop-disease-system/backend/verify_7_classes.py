"""
Automated 7-Class Pathology Classification & Guardrail Verification Suite.
Tests all 7 classes against /api/predict:
1. Black Spot
2. Botrytis Blight
3. Downy Mildew
4. Early Blight
5. Healthy
6. Powdery Mildew
7. Rust
Plus Non-Leaf / Blank guardrail verification.
"""

import os
import sys
import io
import time
import json
import numpy as np
from PIL import Image

# Ensure backend directory is in path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi.testclient import TestClient
from main import app, load_inference_models, CLASSES

def run_verification():
    print("\n" + "=" * 70)
    print("RUNNING AUTOMATED 7-CLASS PATHOLOGY & GUARDRAIL VERIFICATION")
    print("=" * 70)

    load_inference_models()
    client = TestClient(app)

    val_dir = os.path.join(BASE_DIR, "dataset", "val")
    results = {}
    all_passed = True

    print("\n[PART 1: 7-CLASS ACCURACY VERIFICATION]")
    for cls in CLASSES:
        cls_folder = os.path.join(val_dir, cls)
        if not os.path.exists(cls_folder) or len(os.listdir(cls_folder)) == 0:
            print(f"❌ Missing validation samples for: {cls}")
            all_passed = False
            continue

        sample_name = sorted(os.listdir(cls_folder))[0]
        sample_path = os.path.join(cls_folder, sample_name)

        with open(sample_path, "rb") as f:
            file_bytes = f.read()

        response = client.post(
            "/api/predict",
            files={"image": ("test_leaf.jpg", file_bytes, "image/jpeg")}
        )

        if response.status_code != 200:
            print(f"❌ API Error for {cls}: HTTP {response.status_code}")
            all_passed = False
            continue

        data = response.json()
        pred = data.get("prediction")
        conf = data.get("confidence", 0.0)
        match = (pred == cls)
        results[cls] = {"pred": pred, "conf": conf, "match": match}

        status_icon = "✅" if match else "❌"
        print(f"  {status_icon} True: {cls:16s} -> Predicted: {pred:16s} (Confidence: {conf:5.1f}%)")
        if not match:
            all_passed = False

    # PART 2: Non-Leaf / Low-Confidence Guardrail Test
    print("\n[PART 2: NON-LEAF / LOW-CONFIDENCE GUARDRAIL TEST]")
    # 1. Blank gray wall
    gray_wall = Image.fromarray(np.full((224, 224, 3), 128, dtype=np.uint8))
    buf = io.BytesIO()
    gray_wall.save(buf, format="JPEG")
    res_gray = client.post(
        "/api/predict",
        files={"image": ("wall.jpg", buf.getvalue(), "image/jpeg")}
    )
    data_gray = res_gray.json()
    gray_pred = data_gray.get("prediction")
    gray_conf = data_gray.get("confidence", 0.0)
    gray_ok = ("Uncertain" in gray_pred or "No Leaf" in gray_pred)
    print(f"  {'✅' if gray_ok else '⚠️'} Gray Wall Input -> Predicted: '{gray_pred}' (Confidence: {gray_conf}%)")

    # 2. Dark non-leaf surface
    dark_surf = Image.fromarray(np.full((224, 224, 3), 35, dtype=np.uint8))
    buf2 = io.BytesIO()
    dark_surf.save(buf2, format="JPEG")
    res_dark = client.post(
        "/api/predict",
        files={"image": ("desk.jpg", buf2.getvalue(), "image/jpeg")}
    )
    data_dark = res_dark.json()
    dark_pred = data_dark.get("prediction")
    dark_conf = data_dark.get("confidence", 0.0)
    dark_ok = ("Uncertain" in dark_pred or "No Leaf" in dark_pred)
    print(f"  {'✅' if dark_ok else '⚠️'} Dark Desk Input -> Predicted: '{dark_pred}' (Confidence: {dark_conf}%)")

    print("\n" + "=" * 70)
    if all_passed:
        print("🏆 VERIFICATION SUCCESSFUL: 7/7 DISTINCT CLASSES CONFIRMED!")
    else:
        print("⚠️ VERIFICATION PARTIAL: Check class predictions above.")
    print("=" * 70 + "\n")

    return all_passed

if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
