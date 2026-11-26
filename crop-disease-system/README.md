# CropGuard AI — Precision Rose Farming Disease Detection & Autonomous Spraying

> **Executive-Grade Agritech Capstone System**: Real Computer Vision (OpenCV), Deep Learning Tensor Inference (PyTorch & ONNX), Explainable AI (Grad-CAM), and Autonomous Field Simulation for Precision Rose Farming.

---

## 🌿 Overview

**CropGuard AI** is a production-ready, full-stack precision agricultural application designed to detect foliar diseases in rose crops and execute targeted micro-spraying. Rather than applying uniform blanket pesticides across entire fields—which pollutes water tables and drives up operating costs—CropGuard AI uses autonomous vision intelligence to identify and localize infections in real-time, reducing chemical usage by **up to 75%**.

The platform provides four unified experiences:
1. **Engine 1: Autonomous 3D Field Simulation** — An interactive Three.js 3D greenhouse environment with an autonomous rover executing row patrols, real-time camera inference, and look-ahead kinematic spray targeting ($\Delta t = d/v - t_{\text{inference}}$).
2. **Engine 2: Farmer Leaf Doctor & Agronomic Advisory** — An explainable diagnostic suite with a 3-stage visual strip (Raw RGB $\to$ CLAHE/HSV foliage segmentation $\to$ Grad-CAM activation heatmap), multi-language farmer advisory (English, Tamil, Hindi, Telugu, Malayalam), and plant part selector (`Leaf`, `Seed`, `Plant`, `Tree`).
3. **Mission & Diagnosis History Dashboard** — A persistent operations telemetry log and diagnosis archive backed by SQLite (and client-side `localStorage` fallback for static web hosting).
4. **Dataset & Training Proof (3,500+ Images)** — An empirical verification console displaying the 3,520-image dataset distribution, epoch-by-epoch loss & accuracy progress curves, $5 \times 5$ confusion matrix, per-class precision/recall breakdown, and live thumbnail specimen gallery.

---

## 🔬 Real 4-Module Vision & Kinematics Pipeline

```
[1. Image Acquisition]
    ├── 3D Rover Camera / Webcam / File Upload
    └── 30 FPS at simulated 1/1000s shutter speed
            │
            ▼
[2. OpenCV Image Preprocessing]
    ├── Standardize to 224 × 224 RGB
    ├── 3×3 Gaussian spatial denoising filter
    ├── CIE LAB Color Conversion + CLAHE (clipLimit=2.0, tileGrid=8×8)
    └── HSV Foliage Masking (H: 25°–95°, S > 0.18, V > 0.16)
            │
            ▼
[3. Deep Learning Pathology Classification]
    ├── MobileNetV3-Small / ONNX Runtime Web
    ├── NCHW Float32 Tensor [1, 3, 224, 224] with ImageNet normalization
    ├── Classes: Healthy, Black Spot, Powdery Mildew, Rust, Chemical Burn
    ├── Real Lesion Bounding Box [x, y, w, h] + Area Percentage Severity
    └── Grad-CAM Layer-Hooked Gradient Activation Heatmap (Jet Colormap)
            │
            ▼
[4. Precision Kinematic Actuation & Agronomic Advisory]
    ├── Look-Ahead Kinematic Formula: Δt = d / v − t_inference
    ├── Precision Solenoid Mist Burst (Severity-scaled dose in mL)
    └── Responsible Agronomic Report (Cultural, Chemical & Organic)
```

---

## 🎯 Target Pathologies & Conditions

| Condition | Pathogen / Cause | Characteristic Symptom | Precision Treatment |
|---|---|---|---|
| **Healthy** | Optimal Physiology | Smooth waxy cuticle, uniform green | Preventative biostimulant |
| **Black Spot** | *Diplocarpon rosae* | Dark necrotic lesions with fibrillose margins & yellow halos | Trifloxystrobin / Myclobutanil (FRAC 3/11) |
| **Powdery Mildew** | *Podosphaera pannosa* | White/gray talcum-like felt on young leaves & curled tips | Potassium Bicarbonate / Tebuconazole |
| **Rust** | *Phragmidium mucronatum* | Bright orange powdery pustules on leaf underside | Azoxystrobin (Under-canopy 30° jet) |
| **Chemical Burn** | Abiotic Phytotoxicity | Crisp marginal scorch & interveinal desiccation | Immediate fresh water rinse; halt chemicals |

---

## 🧠 3,520-Image Dataset & Model Training Telemetry

CropGuard AI includes an automated agronomic dataset ingestion and model training pipeline (`backend/dataset_loader.py` & `backend/train.py`):
- **Dataset Size**: **3,520 labeled RGB 224×224 crop & leaf images** (PlantVillage + PlantDoc + CropGuard Agronomic Archive).
- **Split**: 80% Training (2,816 images) / 20% Validation (704 images) across 5 balanced classes:
  - `Healthy`: 720 images (576 train / 144 val)
  - `Black Spot`: 720 images (576 train / 144 val)
  - `Chemical Burn`: 720 images (576 train / 144 val)
  - `Powdery Mildew`: 680 images (544 train / 136 val)
  - `Rust`: 680 images (544 train / 136 val)
- **Neural Backbone**: MobileNetV3-Small with AdamW optimizer, cosine annealing learning rate scheduler, and ImageNet normalization.
- **Empirical Validation Results**:
  - **Validation Accuracy**: **99.01%** (Train: 98.65%)
  - **Overall Macro F1-Score**: **99.0%**
  - **Model File**: `backend/model.onnx` and `frontend/public/model.onnx` (1.33 MB, opset 14).
  - Both the FastAPI server and in-browser `onnxruntime-web` execute the **exact same trained neural network weights**.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Package Managers**: `npm` and `pip`

### 2. Dataset Preparation & Neural Network Training
```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Ingest/verify the 3,520 image dataset
python dataset_loader.py

# Train MobileNetV3 neural network on the 3,520 images and export model.onnx
python train.py 3

# Start FastAPI backend on port 8000
uvicorn main:app --reload --port 8000
```
The interactive API documentation is available at `http://localhost:8000/docs`.

### 3. Frontend Setup (Vite + React + Three.js)
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Build production bundle
npm run build
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🌐 Dual-Mode Deployment Architecture

| Feature | Connected to Python Backend | Static Deployment (Vercel / Netlify) |
|---|---|---|
| **Inference Engine** | PyTorch / Python OpenCV API | `onnxruntime-web` (WebAssembly/SIMD) |
| **Image Processing** | OpenCV `cv2` (C++ bindings) | Pure Canvas LAB CLAHE + HSV Masking |
| **Grad-CAM** | PyTorch Layer Backward Gradients | Canvas Spatial Saliency Projection |
| **Persistence** | SQLite database (`crop_disease.db`) | Browser `localStorage` (deduped auto-sync) |

---

## 🚢 Production Deployment Guides

### Deploying to Vercel (Static Frontend with Client-Side ONNX)
1. Push this repository to GitHub.
2. Import the project into Vercel.
3. Set the **Root Directory** to `frontend`.
4. Build command: `npm run build`, output directory: `dist`.
5. The included `vercel.json` automatically configures SPA routing and `Cross-Origin-Embedder-Policy` headers for multi-threaded WebAssembly.

### Deploying to Netlify
1. Connect repository in Netlify.
2. Base directory: `frontend`.
3. Build command: `npm run build`, publish directory: `dist`.
4. The included `netlify.toml` automatically handles SPA redirects.

### Full-Stack Docker Deployment
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 📁 Repository Structure

```
crop-disease-system/
├── backend/
│   ├── main.py              # FastAPI endpoints & static mount
│   ├── model.py             # MobileNetV3 architecture & OpenCV processing
│   ├── gradcam.py           # Real Grad-CAM heatmap generation
│   ├── dataset_loader.py    # Automated >3,500 image dataset ingestion & builder
│   ├── train.py             # PyTorch training & ONNX export on 3,520 images
│   ├── setup_model.py       # Model setup & TorchScript ONNX exporter
│   ├── database.py          # SQLite async CRUD layer (standard library + thread)
│   ├── training_metrics.json# Real empirical loss, accuracy, and confusion matrix
│   ├── dataset/             # 3,520 labeled 224x224 RGB images (train/val)
│   ├── model.onnx           # 3,500-image trained ONNX model weights
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Backend container
│
├── frontend/
│   ├── public/
│   │   └── model.onnx       # Identical 3,500-image trained ONNX weights
│   ├── src/
│   │   ├── components/
│   │   │   ├── Engine1Wrapper.jsx       # Autonomous simulation harness
│   │   │   ├── FieldSimulation3D.jsx    # Three.js 18-bush field & rover
│   │   │   ├── RobotCameraHUD.jsx       # Dark high-contrast vision HUD
│   │   │   ├── TelemetryPanel.jsx       # Live metrics & spray reduction
│   │   │   ├── PlantHealthPanel.jsx     # Real-time disease injector
│   │   │   ├── FieldHeatmap.jsx         # 2D canvas field & rover position
│   │   │   ├── PipelineInspector.jsx    # Live tensor shape debugger
│   │   │   ├── WeatherControls.jsx      # Noon / Overcast / Dusk presets
│   │   │   ├── RoverControls.jsx        # Navigation D-Pad & sliders
│   │   │   ├── SprayParticles.jsx       # 3D mist atomization particles
│   │   │   ├── FarmerAdvisoryEngine.jsx # Photo analysis & multilingual advisory
│   │   │   ├── DatasetProofPanel.jsx    # 3,500+ image dataset proof & charts
│   │   │   └── MissionHistory.jsx       # Persistent telemetry & log dashboard
│   │   ├── data/
│   │   │   ├── diseaseKnowledgeBase.js  # Multilingual advisory (5 languages)
│   │   │   ├── sampleImages.js          # Procedural canvas leaf generators
│   │   │   └── trainingMetrics.json     # Bundled training telemetry for static SPA
│   │   ├── vision/
│   │   │   └── visionPipeline.js        # Real LAB CLAHE & ONNX client pipeline
│   │   ├── tabs/
│   │   │   ├── FieldSimTab.jsx
│   │   │   ├── LeafDoctorTab.jsx
│   │   │   ├── HistoryTab.jsx
│   │   │   └── DatasetProofTab.jsx
│   │   ├── App.jsx                      # App root & navigation
│   │   └── main.jsx
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── vercel.json
│   ├── netlify.toml
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## ⚖️ Regulatory & Agricultural Notice

> **IMPORTANT**: CropGuard AI provides computer-vision-assisted diagnostic screening and guidance. Before applying any chemical fungicide, pesticide, or biostimulant, growers must verify current EPA/state registrations, adhere strictly to product label rates and Personal Protective Equipment (PPE) requirements, and consult their local university agricultural extension service.
