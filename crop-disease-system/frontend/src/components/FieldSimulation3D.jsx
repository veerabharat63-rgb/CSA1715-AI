import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import SprayParticles from './SprayParticles.jsx';
import { getSampleImages } from '../data/sampleImages.js';
import { getCropPrescription, calculateVRADose } from '../data/prescriptions.js';
import { ROVER_COMPONENTS } from '../data/roverComponents.js';


/* ══════════════════════════════════════════════════════════════════════════════
   1. PROCEDURAL PBR TEXTURE GENERATORS (1024x1024 Canvas Normal & Bump Maps)
   ══════════════════════════════════════════════════════════════════════════════ */

function createProceduralTextures() {
  if (typeof document === 'undefined') return {};

  const soilCanvas = document.createElement('canvas');
  soilCanvas.width = 1024;
  soilCanvas.height = 1024;
  const sCtx = soilCanvas.getContext('2d');

  sCtx.fillStyle = '#321B0E';
  sCtx.fillRect(0, 0, 1024, 1024);

  for (let y = 0; y < 1024; y += 4) {
    const furrowNoise = Math.sin(y * 0.08) * 0.15;
    const darkness = 0.25 + furrowNoise + (Math.random() - 0.5) * 0.1;
    sCtx.fillStyle = `rgba(26, 12, 6, ${Math.max(0.05, Math.min(0.65, darkness))})`;
    sCtx.fillRect(0, y, 1024, 3);
  }

  for (let i = 0; i < 30000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = 1 + Math.random() * 3.5;
    const shade = Math.random();
    if (shade > 0.65) {
      sCtx.fillStyle = 'rgba(74, 42, 22, 0.45)';
    } else if (shade > 0.3) {
      sCtx.fillStyle = 'rgba(20, 9, 4, 0.65)';
    } else {
      sCtx.fillStyle = 'rgba(42, 22, 11, 0.55)';
    }
    sCtx.beginPath();
    sCtx.arc(x, y, r, 0, Math.PI * 2);
    sCtx.fill();
  }

  const soilBumpCanvas = document.createElement('canvas');
  soilBumpCanvas.width = 1024;
  soilBumpCanvas.height = 1024;
  const sbCtx = soilBumpCanvas.getContext('2d');
  sbCtx.fillStyle = '#808080';
  sbCtx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 26000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const r = 1 + Math.random() * 4;
    const v = Math.floor(Math.random() * 255);
    sbCtx.fillStyle = `rgba(${v}, ${v}, ${v}, 0.32)`;
    sbCtx.beginPath();
    sbCtx.arc(x, y, r, 0, Math.PI * 2);
    sbCtx.fill();
  }

  const grassCanvas = document.createElement('canvas');
  grassCanvas.width = 1024;
  grassCanvas.height = 1024;
  const gCtx = grassCanvas.getContext('2d');

  gCtx.fillStyle = '#365314';
  gCtx.fillRect(0, 0, 1024, 1024);

  const grassShades = ['#284209', '#4D7C0F', '#65A30D', '#365314', '#1E350B', '#5A8F11'];
  for (let i = 0; i < 50000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const len = 3 + Math.random() * 9;
    const angle = -0.3 + (Math.random() - 0.5) * 0.6;
    gCtx.strokeStyle = grassShades[Math.floor(Math.random() * grassShades.length)];
    gCtx.lineWidth = 1 + Math.random() * 1.5;
    gCtx.beginPath();
    gCtx.moveTo(x, y);
    gCtx.lineTo(x + Math.sin(angle) * len, y - Math.cos(angle) * len);
    gCtx.stroke();
  }

  const grassBumpCanvas = document.createElement('canvas');
  grassBumpCanvas.width = 1024;
  grassBumpCanvas.height = 1024;
  const gbCtx = grassBumpCanvas.getContext('2d');
  gbCtx.fillStyle = '#777777';
  gbCtx.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 28000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const v = Math.floor(Math.random() * 255);
    gbCtx.fillStyle = `rgba(${v}, ${v}, ${v}, 0.22)`;
    gbCtx.fillRect(x, y, 2, 6);
  }

  const soilMap = new THREE.CanvasTexture(soilCanvas);
  soilMap.wrapS = THREE.RepeatWrapping;
  soilMap.wrapT = THREE.RepeatWrapping;
  soilMap.repeat.set(4, 3);

  const soilBumpMap = new THREE.CanvasTexture(soilBumpCanvas);
  soilBumpMap.wrapS = THREE.RepeatWrapping;
  soilBumpMap.wrapT = THREE.RepeatWrapping;
  soilBumpMap.repeat.set(4, 3);

  const grassMap = new THREE.CanvasTexture(grassCanvas);
  grassMap.wrapS = THREE.RepeatWrapping;
  grassMap.wrapT = THREE.RepeatWrapping;
  grassMap.repeat.set(14, 12);

  const grassBumpMap = new THREE.CanvasTexture(grassBumpCanvas);
  grassBumpMap.wrapS = THREE.RepeatWrapping;
  grassBumpMap.wrapT = THREE.RepeatWrapping;
  grassBumpMap.repeat.set(14, 12);

  return { soilMap, soilBumpMap, grassMap, grassBumpMap };
}

/* ══════════════════════════════════════════════════════════════════════════════
   2. BOTANICAL 3D CROP MODELS & SPECIFIC DISEASE SYMPTOM VISUALS
   ══════════════════════════════════════════════════════════════════════════════ */

function getDiseaseVisuals(diseaseStatus, treated) {
  if (treated) {
    return {
      foliageColor: '#16A34A', // Vibrant healthy cured green
      spotColor: '#38BDF8',
      spotVisible: false,
      isTreated: true,
      wilted: false,
    };
  }

  switch (diseaseStatus) {
    case 'Black Spot':
      return {
        foliageColor: '#14532D',
        spotColor: '#09090B',
        spotScale: 0.32,
        spotVisible: true,
        isTreated: false,
        wilted: false,
      };
    case 'Powdery Mildew':
      return {
        foliageColor: '#15803D',
        spotColor: '#F8FAFC',
        spotScale: 0.42,
        spotVisible: true,
        isTreated: false,
        wilted: false,
      };
    case 'Rust':
      return {
        foliageColor: '#15803D',
        spotColor: '#EA580C',
        spotScale: 0.35,
        spotVisible: true,
        isTreated: false,
        wilted: false,
      };
    case 'Downy Mildew':
      return {
        foliageColor: '#3F6212', // Mottled yellowish green
        spotColor: '#9333EA',   // Purplish-red blotches
        spotScale: 0.38,
        spotVisible: true,
        isTreated: false,
        wilted: false,
      };
    case 'Botrytis Blight':
      return {
        foliageColor: '#451A03', // Water-soaked brown rot
        spotColor: '#94A3B8',   // Fuzzy gray mold
        spotScale: 0.45,
        spotVisible: true,
        isTreated: false,
        wilted: true,           // Drooping wilted petals & foliage
      };
    case 'Early Blight':
      return {
        foliageColor: '#365314', // Chlorotic yellowed green
        spotColor: '#B45309',   // Tan target ring
        spotScale: 0.36,
        spotVisible: true,
        isTreated: false,
        wilted: false,
      };
    case 'Healthy':
    default:
      return {
        foliageColor: '#15803D',
        spotColor: '#15803D',
        spotScale: 0.0,
        spotVisible: false,
        isTreated: false,
        wilted: false,
      };
  }
}

const RoseBushModel = React.memo(function RoseBushModel({ plant }) {
  const visuals = getDiseaseVisuals(plant.diseaseStatus, plant.treated);

  return (
    <group position={[0, 0, 0]}>
      {/* Central Woody Stem */}
      <mesh position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.038, 0.06, 0.76, 8]} />
        <meshStandardMaterial color="#3E2723" roughness={0.88} />
      </mesh>

      {/* Main Arching Branches */}
      <mesh position={[0.14, 0.58, 0.09]} rotation={[0.42, 0.25, -0.42]} castShadow>
        <cylinderGeometry args={[0.024, 0.034, 0.52, 6]} />
        <meshStandardMaterial color="#4E342E" roughness={0.85} />
      </mesh>
      <mesh position={[-0.15, 0.54, -0.08]} rotation={[-0.38, -0.22, 0.44]} castShadow>
        <cylinderGeometry args={[0.024, 0.034, 0.5, 6]} />
        <meshStandardMaterial color="#4E342E" roughness={0.85} />
      </mesh>

      {/* Multi-Layered Serrated Leaf Clusters */}
      {[
        { pos: [0, 0.85, 0], scale: [0.36, 0.3, 0.34] },
        { pos: [0.26, 0.74, 0.14], scale: [0.28, 0.24, 0.26] },
        { pos: [-0.24, 0.76, -0.12], scale: [0.26, 0.22, 0.25] },
        { pos: [0.08, 0.98, -0.16], scale: [0.24, 0.2, 0.23] },
        { pos: [-0.12, 0.92, 0.18], scale: [0.22, 0.18, 0.22] },
      ].map((leaf, idx) => (
        <group key={idx} position={leaf.pos}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color={visuals.foliageColor} roughness={0.62} />
          </mesh>
          {visuals.spotVisible && (
            <mesh position={[0.12, 0.15, 0.12]}>
              <sphereGeometry args={[visuals.spotScale || 0.3, 6, 6]} />
              <meshStandardMaterial color={visuals.spotColor} roughness={0.4} />
            </mesh>
          )}
        </group>
      ))}

      {/* Detailed Rose Blooms / Buds */}
      <mesh position={[0.08, 1.08, 0.08]} castShadow>
        <icosahedronGeometry args={[0.095, 1]} />
        <meshStandardMaterial color={visuals.wilted ? '#78350F' : '#E11D48'} roughness={0.35} />
      </mesh>
      <mesh position={[-0.18, 0.98, 0.18]} castShadow>
        <icosahedronGeometry args={[0.08, 1]} />
        <meshStandardMaterial color={visuals.wilted ? '#78350F' : '#F43F5E'} roughness={0.35} />
      </mesh>
    </group>
  );
});

const TomatoPlantModel = React.memo(function TomatoPlantModel({ plant }) {
  const visuals = getDiseaseVisuals(plant.diseaseStatus, plant.treated);

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.025, 1.3, 6]} />
        <meshStandardMaterial color="#B45309" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.58, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.045, 1.15, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.7} />
      </mesh>

      {[
        { y: 0.42, rot: 0.35, s: 0.34 },
        { y: 0.68, rot: 1.45, s: 0.38 },
        { y: 0.92, rot: 2.65, s: 0.32 },
        { y: 1.12, rot: 0.85, s: 0.28 },
      ].map((cl, idx) => (
        <group key={idx} position={[0, cl.y, 0]} rotation={[0.2, cl.rot, 0]}>
          <mesh position={[0.22, 0, 0]} castShadow receiveShadow>
            <sphereGeometry args={[cl.s, 8, 8]} />
            <meshStandardMaterial color={visuals.foliageColor} roughness={0.65} />
          </mesh>
          {visuals.spotVisible && (
            <mesh position={[0.26, 0.05, 0.08]}>
              <sphereGeometry args={[visuals.spotScale || 0.15, 6, 6]} />
              <meshStandardMaterial color={visuals.spotColor} roughness={0.4} />
            </mesh>
          )}
        </group>
      ))}

      <mesh position={[0.18, 0.55, 0.12]} castShadow>
        <sphereGeometry args={[0.085, 12, 12]} />
        <meshStandardMaterial color={visuals.wilted ? '#78350F' : '#DC2626'} roughness={0.3} />
      </mesh>
      <mesh position={[-0.16, 0.68, -0.12]} castShadow>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color="#84CC16" roughness={0.4} />
      </mesh>
    </group>
  );
});

const BananaTreeModel = React.memo(function BananaTreeModel({ plant }) {
  const visuals = getDiseaseVisuals(plant.diseaseStatus, plant.treated);

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.65, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.16, 1.3, 8]} />
        <meshStandardMaterial color="#4D7C0F" roughness={0.8} />
      </mesh>

      {[0, Math.PI * 0.4, Math.PI * 0.8, Math.PI * 1.2, Math.PI * 1.6].map((rot, idx) => (
        <group key={idx} position={[0, 1.2, 0]} rotation={[0.45, rot, 0]}>
          <mesh position={[0.45, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.9, 0.025, 0.32]} />
            <meshStandardMaterial color={visuals.foliageColor} roughness={0.55} side={THREE.DoubleSide} />
          </mesh>
          {visuals.spotVisible && (
            <mesh position={[0.45, 0.02, 0]}>
              <sphereGeometry args={[visuals.spotScale || 0.1, 6, 6]} />
              <meshStandardMaterial color={visuals.spotColor} roughness={0.35} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
});

const MaizeCropModel = React.memo(function MaizeCropModel({ plant }) {
  const visuals = getDiseaseVisuals(plant.diseaseStatus, plant.treated);

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.048, 1.7, 8]} />
        <meshStandardMaterial color="#16A34A" roughness={0.78} />
      </mesh>

      {[
        { y: 0.38, rotZ: 0.72, rotY: 0 },
        { y: 0.68, rotZ: -0.72, rotY: Math.PI * 0.9 },
        { y: 0.98, rotZ: 0.76, rotY: Math.PI * 0.22 },
        { y: 1.28, rotZ: -0.76, rotY: Math.PI * 1.12 },
      ].map((leaf, idx) => (
        <group key={idx} position={[0, leaf.y, 0]} rotation={[0, leaf.rotY, leaf.rotZ]}>
          <mesh position={[0.34, 0, 0]} castShadow>
            <boxGeometry args={[0.62, 0.022, 0.1]} />
            <meshStandardMaterial color={visuals.foliageColor} roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
          {visuals.spotVisible && (
            <mesh position={[0.34, 0.02, 0]}>
              <sphereGeometry args={[visuals.spotScale || 0.08, 6, 6]} />
              <meshStandardMaterial color={visuals.spotColor} roughness={0.35} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
});

/* ══════════════════════════════════════════════════════════════════════════════
   3. ELEVATED FLOATING HUD CARD & MINI STATUS PIN (Unobstructed View)
   ══════════════════════════════════════════════════════════════════════════════ */

/**
 * Compact mini status pin for background sick or cured plants.
 * Zero visual clutter — healthy plants have NO floating labels!
 */
function MiniStatusPin({ plant, hideAllBadges = false }) {
  if (hideAllBadges) return null;
  const isSick = plant.diseaseStatus !== 'Healthy' && !plant.treated;
  const isTreated = plant.treated;
  if (!isSick && !isTreated) return null;

  const prescription = getCropPrescription(plant.diseaseStatus);

  return (
    <Html position={[0, 1.35, 0]} center zIndexRange={[10, 0]} occlude>
      <div
        className={`pointer-events-none select-none px-2 py-0.5 rounded-full flex items-center gap-1 text-[9px] font-mono font-bold shadow-md backdrop-blur-md border transition-all ${
          isSick
            ? 'bg-slate-950/85 text-red-400 border-red-500/70 animate-pulse'
            : 'bg-slate-950/75 text-cyan-300 border-cyan-400/60'
        }`}
      >
        <span>{prescription.icon}</span>
        <span>{plant.id}</span>
        {isSick && <span className="text-[8px] text-amber-300 font-normal">({plant.severity || 45}%)</span>}
      </div>
    </Html>
  );
}

/**
 * Detailed floating HUD card elevated higher at Y = 2.7
 * with a sleek glowing vertical leader line down to the canopy crown.
 */
function FloatingCropHUD({ plant, isCurrentTarget, hideAllBadges = false }) {
  if (hideAllBadges) return null;
  const isSick = plant.diseaseStatus !== 'Healthy' && !plant.treated;
  const isTreated = plant.treated;
  const prescription = getCropPrescription(plant.diseaseStatus);

  const conf = plant.confidence || (isSick ? 94.2 + (plant.row * 1.2) : 98.4);
  const formattedConf = conf.toFixed(1);

  return (
    <Html position={[0, 2.7, 0]} center zIndexRange={[10, 0]} occlude>
      <div
        className={`pointer-events-none select-none transition-all duration-300 rounded-xl backdrop-blur-md px-3 py-2 shadow-2xl border text-white font-['Plus_Jakarta_Sans'] min-w-[210px] max-w-[270px] ${
          isSick
            ? 'bg-slate-950/85 border-red-500/80 shadow-[0_0_20px_rgba(239,68,68,0.45)] scale-100'
            : isTreated
            ? 'bg-slate-950/85 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-100'
            : 'bg-slate-950/80 border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-95'
        } ${isCurrentTarget ? 'ring-2 ring-cyan-400 scale-105 z-30' : ''}`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-1 mb-1 text-[11px] font-bold">
          <div className="flex items-center gap-1.5 truncate">
            {isSick ? (
              <>
                <span className="text-red-400 animate-pulse">{prescription.icon}</span>
                <span className="text-red-300 uppercase tracking-wider font-mono truncate">
                  {plant.id} · {prescription.disease} ({formattedConf}%)
                </span>
              </>
            ) : isTreated ? (
              <>
                <span className="text-cyan-400">✓</span>
                <span className="text-cyan-300 uppercase tracking-wider font-mono truncate">
                  {plant.id} · CURED ({prescription.disease})
                </span>
              </>
            ) : (
              <>
                <span className="text-emerald-400">✅</span>
                <span className="text-emerald-300 uppercase tracking-wider font-mono truncate">
                  {plant.id} · HEALTHY LEAF ({formattedConf}%)
                </span>
              </>
            )}
          </div>
          {isCurrentTarget && (
            <span className="text-[9px] font-mono bg-cyan-500 text-slate-950 px-1.5 py-0.2 rounded font-black animate-pulse flex-shrink-0">
              SCANNING
            </span>
          )}
        </div>

        {/* Pathogen & Symptoms */}
        <div className="text-[10px] font-mono leading-tight space-y-0.5">
          <div className="text-slate-300 truncate">
            <span className="text-slate-400 font-semibold">Pathogen: </span>
            <span className="italic">{prescription.scientificName}</span>
          </div>

          {isSick ? (
            <div className="text-amber-300 truncate">
              <span className="text-amber-400 font-bold">Rx Micro-Dose: </span>
              <span>{prescription.prescription} ({prescription.doseMl} mL)</span>
            </div>
          ) : isTreated ? (
            <div className="text-cyan-300 truncate">
              <span className="text-cyan-400 font-bold">Applied: </span>
              <span>{prescription.prescription} ({prescription.doseMl} mL) · 82% Saved</span>
            </div>
          ) : (
            <div className="text-emerald-300 truncate">
              <span className="text-emerald-400 font-bold">Status: </span>
              <span>Optimal Foliage · Zero Runoff</span>
            </div>
          )}
        </div>
      </div>
    </Html>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   4. CROP PLANT WRAPPER (With Leader Line & Clutter-Free Filtering)
   ══════════════════════════════════════════════════════════════════════════════ */

const CropPlant = React.memo(function CropPlant({
  plant,
  cropType,
  position,
  isSelected,
  isHovered,
  isCurrentTarget,
  smartHudFocus = true,
  hideAllBadges = false,
  onClick,
  onPointerOver,
  onPointerOut,
}) {
  const isSick = plant.diseaseStatus !== 'Healthy' && !plant.treated;
  const isTreated = plant.treated;

  // Decide whether to show the detailed elevated card vs compact mini-pin
  const isDetailedTarget =
    isCurrentTarget ||
    isSelected ||
    isHovered ||
    (!smartHudFocus && (plant.treated || plant.diseaseStatus !== 'Healthy'));

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        if (onClick) onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (onPointerOver) onPointerOver();
      }}
      onPointerOut={() => {
        if (onPointerOut) onPointerOut();
      }}
    >
      {/* Dynamic 3D Botanical Model */}
      {cropType === 'tomato' && <TomatoPlantModel plant={plant} />}
      {cropType === 'banana' && <BananaTreeModel plant={plant} />}
      {cropType === 'maize' && <MaizeCropModel plant={plant} />}
      {cropType !== 'tomato' && cropType !== 'banana' && cropType !== 'maize' && (
        <RoseBushModel plant={plant} />
      )}

      {/* Ground Selection Marker */}
      {(isSelected || isHovered) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.38, 0.46, 32]} />
          <meshBasicMaterial
            color={isSelected ? '#22D3EE' : '#38BDF8'}
            transparent
            opacity={0.85}
          />
        </mesh>
      )}

      {/* Elevated Glowing Vertical Leader Line for Detailed Active Crop (hidden when modal open) */}
      {isDetailedTarget && !hideAllBadges && (
        <group position={[0, 1.45, 0]}>
          {/* Vertical Leader Tube */}
          <mesh>
            <cylinderGeometry args={[0.006, 0.006, 2.3, 6]} />
            <meshBasicMaterial
              color={isSick ? '#EF4444' : isTreated ? '#38BDF8' : '#10B981'}
              transparent
              opacity={0.65}
            />
          </mesh>
          {/* Target Ring at Canopy Crown */}
          <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.18, 0.24, 16]} />
            <meshBasicMaterial
              color={isSick ? '#EF4444' : isTreated ? '#38BDF8' : '#10B981'}
              transparent
              opacity={0.75}
            />
          </mesh>
        </group>
      )}

      {/* Render detailed elevated card or compact mini status pin */}
      {!hideAllBadges && (
        isDetailedTarget ? (
          <FloatingCropHUD plant={plant} isCurrentTarget={isCurrentTarget} hideAllBadges={hideAllBadges} />
        ) : (
          <MiniStatusPin plant={plant} hideAllBadges={hideAllBadges} />
        )
      )}
    </group>
  );
});

/* ══════════════════════════════════════════════════════════════════════════════
   5. HOME CHARGING BAY (High-Tech Agritech Docking Station)
   ══════════════════════════════════════════════════════════════════════════════ */

function HomeChargingBay({
  position = [-4.8, 0.08, -2.2],
  hideAllBadges = false,
  isRefilling = false,
  refillProgress = 0,
}) {
  return (
    <group position={position}>
      {/* Base Charging Platform */}
      <mesh receiveShadow position={[0, 0.03, 0]}>
        <boxGeometry args={[1.5, 0.06, 1.5]} />
        <meshStandardMaterial color="#0F172A" metalness={0.85} roughness={0.2} />
      </mesh>

      {/* Induction Charging Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.065, 0]}>
        <ringGeometry args={[0.42, 0.52, 32]} />
        <meshBasicMaterial color={isRefilling ? '#10B981' : '#06B6D4'} />
      </mesh>

      {/* Charging Station Pylon */}
      <mesh position={[0.65, 0.42, 0]} castShadow>
        <boxGeometry args={[0.14, 0.8, 0.22]} />
        <meshStandardMaterial color="#1E293B" metalness={0.7} />
      </mesh>
      <mesh position={[0.65, 0.76, 0]}>
        <sphereGeometry args={[0.05, 12, 12]} />
        <meshBasicMaterial color={isRefilling ? '#38BDF8' : '#10B981'} />
      </mesh>

      {!hideAllBadges && (
        <Html position={[0, 1.1, 0]} center zIndexRange={[10, 0]} occlude>
          {isRefilling ? (
            <div className="bg-slate-950/95 text-white font-mono text-[10px] px-3 py-2 rounded-xl border border-cyan-400 shadow-2xl backdrop-blur-md whitespace-nowrap pointer-events-none flex flex-col items-center gap-1 min-w-[190px]">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                AUTO-REFILL & FAST-CHARGE
              </div>
              <div className="text-[11px] font-bold text-emerald-400">
                Tank: {Math.round(1200 * (refillProgress / 100))} mL ({refillProgress}%)
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-0.5 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 h-full transition-all duration-150"
                  style={{ width: `${refillProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/90 text-cyan-400 font-mono text-[9px] px-2 py-0.5 rounded border border-cyan-500/40 shadow-lg whitespace-nowrap pointer-events-none">
              HOME CHARGE DOCK 01
            </div>
          )}
        </Html>
      )}
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   6. REALISTIC AGRICULTURAL FARMLAND TERRAIN & ARCHITECTURE
   ══════════════════════════════════════════════════════════════════════════════ */

function RealisticFarmland({ textures, rowZCoords, colXCoords, hideAllBadges = false }) {
  const { soilMap, soilBumpMap, grassMap, grassBumpMap } = textures;

  // Perimeter fence dimensions
  const minX = -6.4;
  const maxX = 6.4;
  const minZ = -4.2;
  const maxZ = 4.2;

  // Wooden border posts positions
  const borderPosts = useMemo(() => {
    const posts = [];
    // North and South borders
    for (let x = minX; x <= maxX + 0.1; x += 1.6) {
      posts.push([x, minZ]);
      posts.push([x, maxZ]);
    }
    // East and West borders
    for (let z = minZ + 1.4; z <= maxZ - 1.0; z += 1.4) {
      posts.push([minX, z]);
      posts.push([maxX, z]);
    }
    return posts;
  }, [minX, maxX, minZ, maxZ]);

  // Distant rolling hills & tree clumps
  const distantLandscape = useMemo(() => {
    const items = [];
    // Distant tree positions around perimeter
    const angles = [0.2, 0.7, 1.2, 1.8, 2.4, 2.9, 3.5, 4.1, 4.8, 5.4, 5.9];
    angles.forEach((ang, i) => {
      const dist = 18 + (i % 3) * 4;
      const x = Math.cos(ang) * dist;
      const z = Math.sin(ang) * dist;
      items.push({ x, z, scale: 0.8 + (i % 4) * 0.25 });
    });
    return items;
  }, []);

  return (
    <group>
      {/* Vast Lush Meadow Grass Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
        <planeGeometry args={[95, 80]} />
        <meshStandardMaterial
          map={grassMap || null}
          bumpMap={grassBumpMap || null}
          bumpScale={0.035}
          color={grassMap ? '#FFFFFF' : '#4D7C0F'}
          roughness={0.9}
        />
      </mesh>

      {/* Plowed Dark-Loam Soil Plot Base */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[13.2, 0.1, 8.8]} />
        <meshStandardMaterial
          map={soilMap || null}
          bumpMap={soilBumpMap || null}
          bumpScale={0.07}
          color={soilMap ? '#FFFFFF' : '#452311'}
          roughness={0.92}
        />
      </mesh>

      {/* 3 Raised Soil Furrow Beds with Drip-Irrigation Lines */}
      {rowZCoords.map((rz, idx) => (
        <group key={`furrow-${idx}`} position={[0, 0.11, rz]}>
          {/* Raised Soil Mound */}
          <mesh receiveShadow>
            <boxGeometry args={[11.2, 0.14, 1.55]} />
            <meshStandardMaterial
              map={soilMap || null}
              bumpMap={soilBumpMap || null}
              bumpScale={0.08}
              color={soilMap ? '#FFFFFF' : '#3E1F0F'}
              roughness={0.95}
            />
          </mesh>

          {/* Black Drip-Irrigation Pipe along row */}
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 11.0, 8]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#18181B" roughness={0.7} />
          </mesh>

          {/* Brass Emitter Nozzles at each crop column */}
          {colXCoords.map((cx, cIdx) => (
            <mesh key={`emitter-${cIdx}`} position={[cx, 0.09, 0]}>
              <cylinderGeometry args={[0.012, 0.012, 0.04, 6]} />
              <meshStandardMaterial color="#D97706" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Wooden Perimeter Border Posts */}
      {borderPosts.map(([px, pz], idx) => (
        <mesh key={`post-${idx}`} position={[px, 0.42, pz]} castShadow receiveShadow>
          <cylinderGeometry args={[0.055, 0.065, 0.88, 8]} />
          <meshStandardMaterial color="#3E2723" roughness={0.9} />
        </mesh>
      ))}

      {/* Horizontal Wooden Fence Rails */}
      {/* North & South Rails */}
      <mesh position={[0, 0.62, minZ]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, maxX - minX, 6]} />
        <meshStandardMaterial color="#4E342E" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.36, minZ]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, maxX - minX, 6]} />
        <meshStandardMaterial color="#4E342E" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.62, maxZ]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.022, 0.022, maxX - minX, 6]} />
        <meshStandardMaterial color="#4E342E" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.36, maxZ]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, maxX - minX, 6]} />
        <meshStandardMaterial color="#4E342E" roughness={0.88} />
      </mesh>

      {/* East & West Rails */}
      <mesh position={[minX, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, maxZ - minZ, 6]} />
        <meshStandardMaterial color="#4E342E" roughness={0.88} />
      </mesh>
      <mesh position={[maxX, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.022, maxZ - minZ, 6]} />
        <meshStandardMaterial color="#4E342E" roughness={0.88} />
      </mesh>

      {/* Distant Rolling Orchard Landscape */}
      {distantLandscape.map((item, idx) => (
        <group key={`tree-${idx}`} position={[item.x, 0, item.z]} scale={item.scale}>
          <mesh position={[0, 1.0, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.28, 2.0, 6]} />
            <meshStandardMaterial color="#2E1C0C" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <sphereGeometry args={[1.5, 8, 8]} />
            <meshStandardMaterial color="#284E13" roughness={0.8} />
          </mesh>
        </group>
      ))}

      <HomeChargingBay position={[-4.8, 0.08, -2.2]} hideAllBadges={hideAllBadges} />
    </group>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   7. AUTONOMOUS ROBOTIC ROVER (8-Part Invigilator Cutaway & Exploded Assembly)
   ══════════════════════════════════════════════════════════════════════════════ */

function ConnectorLine({ start = [0, 0.25, 0], end = [0, 0, 0], opacity = 0.5, color = '#06B6D4' }) {
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
  const lineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line geometry={lineGeo}>
      <lineBasicMaterial color={color} transparent opacity={opacity} linewidth={1.5} />
    </line>
  );
}

function AnimatedFlowPath({ points, color = '#06B6D4', pulseColor = '#E0F2FE', count = 3, speed = 1.5, radius = 0.008 }) {
  const curve = useMemo(() => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), [points]);
  const tubeGeo = useMemo(() => new THREE.TubeGeometry(curve, 28, radius, 8, false), [curve, radius]);
  const pulseRefs = useRef([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    pulseRefs.current.forEach((mesh, idx) => {
      if (mesh) {
        const offset = (t + idx / count) % 1.0;
        const pt = curve.getPointAt(offset);
        mesh.position.copy(pt);
      }
    });
  });

  return (
    <group>
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.65}
          roughness={0.2}
          emissive={color}
          emissiveIntensity={0.35}
        />
      </mesh>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} ref={(el) => (pulseRefs.current[i] = el)}>
          <sphereGeometry args={[radius * 2.2, 8, 8]} />
          <meshBasicMaterial color={pulseColor} />
        </mesh>
      ))}
    </group>
  );
}

function AutonomousRover({
  plants = [],
  roverSpeed = 0.5,
  nozzleOffset = 0.8,
  isAutonomous = false,
  isInspectMode = false,
  selectedPartId = 'multispectral_gimbal',
  chemicalUsed = 0,
  onSelectPart,
  onToggleInspect,
  hideAllBadges = false,
  onMissionLog,
  onFrameCapture,
  onRoverStateChange,
  onCountdownChange,
  onPlantsScannedChange,
  onPlantUpdate,
  onPatrolComplete,
  onSprayBannerChange,
  onActiveWaypointChange,
  onScannedPlantAdd,
  triggerRTH = false,
  onResetRTH,
  onProcessStatusChange,
  onRoverTelemetryChange,
}) {
  const roverGroup = useRef();
  const wheelFL = useRef();
  const wheelFR = useRef();
  const wheelRL = useRef();
  const wheelRR = useRef();
  const sprayTurretRef = useRef();
  const lidarPuckRef = useRef();
  const cameraGimbalRef = useRef();
  const plungerRef = useRef();

  // 8 Engineered Sub-Assembly Groups for Exploded & Cutaway View
  const multispectralGimbalGroup = useRef();
  const navSensorsGroup = useRef();
  const edgeAiCoreGroup = useRef();
  const chemicalTankGroup = useRef();
  const solenoidValvePumpGroup = useRef();
  const sprayBoomGroup = useRef();
  const batteryPowerGroup = useRef();
  const driveSuspensionGroup = useRef();

  // Outer Space-Frame Chassis (Semi-Transparent in Cutaway)
  const chassisFrameGroup = useRef();

  // Individual Wheel Sub-Groups for Rocker-Bogie Traversal
  const wheelFLGroup = useRef();
  const wheelFRGroup = useRef();
  const wheelRLGroup = useRef();
  const wheelRRGroup = useRef();

  const [position, setPosition] = useState({ x: -4.8, z: -2.2 });
  const [heading, setHeading] = useState(0);
  const [isSpraying, setIsSpraying] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [nozzleWorldPos, setNozzleWorldPos] = useState([0, 0, 0]);

  // Tank & Battery & VRA state
  const [tankVolume, setTankVolume] = useState(1200); // 1,200 mL capacity
  const [batteryLevel, setBatteryLevel] = useState(98.5); // %
  const [rthRefillDisplayPct, setRthRefillDisplayPct] = useState(12);
  const rthSavedWaypointRef = useRef(null);
  const activeVraRef = useRef({ tier: 'Healthy', doseMl: 0.0, pwmPulseMs: 0 });

  // Exploded View Smooth Spring-Lerp Progress (0 to 1)
  const explodedProgressRef = useRef(0);
  const [explodedP, setExplodedP] = useState(0);

  // Double-Click Detection Tracker (<400ms or e.detail >= 2)
  const lastClickTimeRef = useRef(0);
  const clickCountRef = useRef(0);

  const handleRoverClick = useCallback(
    (e) => {
      e.stopPropagation();
      const now = Date.now();
      const elapsed = now - lastClickTimeRef.current;

      if (e.detail >= 2 || (elapsed < 400 && clickCountRef.current >= 1)) {
        clickCountRef.current = 0;
        if (onToggleInspect) onToggleInspect();
      } else {
        if (elapsed < 400) {
          clickCountRef.current += 1;
        } else {
          clickCountRef.current = 1;
        }
      }
      lastClickTimeRef.current = now;
    },
    [onToggleInspect]
  );

  const handleRoverDoubleClick = useCallback(
    (e) => {
      e.stopPropagation();
      clickCountRef.current = 0;
      if (onToggleInspect) onToggleInspect();
    },
    [onToggleInspect]
  );

  // Serpentine Patrol State: 0..17 (Plants), 18 (Home Dock)
  const [waypointIndex, setWaypointIndex] = useState(0);
  const [patrolState, setPatrolState] = useState('IDLE'); // 'IDLE' | 'DRIVING' | 'SCANNING' | 'SPRAYING' | 'RTH_RETURNING' | 'RTH_REFILLING' | 'RETURNING'
  const stateTimerRef = useRef(0);
  const sampleImagesRef = useRef(null);

  // Listen for Manual or Simulated Low Tank Return-to-Home (RTH) trigger
  useEffect(() => {
    if (triggerRTH) {
      if (
        patrolState === 'DRIVING' ||
        patrolState === 'SCANNING' ||
        patrolState === 'SPRAYING'
      ) {
        rthSavedWaypointRef.current = waypointIndex;
        setPatrolState('RTH_RETURNING');
        setIsSpraying(false);
        setIsScanning(false);
        if (onSprayBannerChange) onSprayBannerChange(false);
        if (onProcessStatusChange) {
          onProcessStatusChange(
            `LOW TANK (${Math.round((tankVolume / 1200) * 100)}%) ➔ RETURNING TO HOME DOCK 01 FOR AUTO-REFILL`
          );
        }
      }
    }
  }, [triggerRTH, patrolState, waypointIndex, tankVolume, onSprayBannerChange, onProcessStatusChange]);

  // Synchronize Live Rover Telemetry (Tank, Battery, VRA, RTH Status)
  useEffect(() => {
    if (onRoverTelemetryChange) {
      onRoverTelemetryChange({
        tankVolume: Math.round(tankVolume * 10) / 10,
        tankPct: Math.round((tankVolume / 1200) * 100),
        batteryLevel: Math.round(batteryLevel),
        vraTier: activeVraRef.current.tier,
        pwmPulseMs: activeVraRef.current.pwmPulseMs,
        currentDoseMl: activeVraRef.current.doseMl,
        patrolState,
        isRTH: patrolState === 'RTH_RETURNING' || patrolState === 'RTH_REFILLING',
        rthRefillDisplayPct,
      });
    }
  }, [tankVolume, batteryLevel, patrolState, rthRefillDisplayPct, onRoverTelemetryChange]);

  // Furrow Coordinates
  const colXCoords = useMemo(() => [-3.5, -2.1, -0.7, 0.7, 2.1, 3.5], []);

  // 18-Plant Serpentine Waypoints
  const patrolWaypoints = useMemo(() => {
    const list = [];
    // Row 1: Left to Right (R1-C1 .. R1-C6)
    for (let c = 0; c < 6; c++) {
      list.push({ row: 0, col: c, id: `R1-C${c + 1}`, plantX: colXCoords[c], plantZ: -2.2, roverX: colXCoords[c], roverZ: -2.2 + 0.68, targetHeading: Math.PI });
    }
    // Row 2: Right to Left (R2-C6 .. R2-C1)
    for (let c = 5; c >= 0; c--) {
      list.push({ row: 1, col: c, id: `R2-C${c + 1}`, plantX: colXCoords[c], plantZ: 0.0, roverX: colXCoords[c], roverZ: 0.0 - 0.68, targetHeading: 0 });
    }
    // Row 3: Left to Right (R3-C1 .. R3-C6)
    for (let c = 0; c < 6; c++) {
      list.push({ row: 2, col: c, id: `R3-C${c + 1}`, plantX: colXCoords[c], plantZ: 2.2, roverX: colXCoords[c], roverZ: 2.2 - 0.68, targetHeading: 0 });
    }
    return list;
  }, [colXCoords]);

  useEffect(() => {
    sampleImagesRef.current = getSampleImages();
  }, []);

  // Start/Stop Autonomous Patrol
  useEffect(() => {
    if (isAutonomous && !isInspectMode) {
      setPatrolState('DRIVING');
      setWaypointIndex(0);
    } else {
      setPatrolState('IDLE');
      setIsSpraying(false);
      setIsScanning(false);
      if (onSprayBannerChange) onSprayBannerChange(false);
    }
  }, [isAutonomous, isInspectMode, onSprayBannerChange]);

  // Synchronize Active Waypoint ID to Field Canvas
  useEffect(() => {
    if (onActiveWaypointChange) {
      if (isAutonomous && !isInspectMode && (patrolState === 'DRIVING' || patrolState === 'SCANNING' || patrolState === 'SPRAYING')) {
        onActiveWaypointChange(patrolWaypoints[waypointIndex]?.id || null);
      } else {
        onActiveWaypointChange(null);
      }
    }
  }, [isAutonomous, isInspectMode, patrolState, waypointIndex, patrolWaypoints, onActiveWaypointChange]);

  // Active Target Plant
  const currentWaypoint = patrolWaypoints[waypointIndex];
  const targetPlant = plants.find((p) => p.id === currentWaypoint?.id);
  const targetIsSick = targetPlant && targetPlant.diseaseStatus !== 'Healthy' && !targetPlant.treated;

  useFrame((state, delta) => {
    if (!roverGroup.current) return;

    // Smooth Spring-Lerp for Exploded View Progress
    const targetProgress = isInspectMode ? 1.0 : 0.0;
    explodedProgressRef.current = THREE.MathUtils.lerp(
      explodedProgressRef.current,
      targetProgress,
      delta * 4.5
    );
    const p = explodedProgressRef.current;
    if (Math.abs(p - explodedP) > 0.005) {
      setExplodedP(p);
    }

    // ── 8 Sub-Assemblies Explode Outward Along Clean Radial/Vertical Engineering Axes ──

    // 1. multispectral_gimbal (01): Lifts Up and Extends Left-Forward
    if (multispectralGimbalGroup.current) {
      multispectralGimbalGroup.current.position.set(-0.18 - 0.45 * p, 0.25 + 0.55 * p, 0.36 + 0.45 * p);
    }

    // 2. navigation_sensors (02): Pushes Forward and Up
    if (navSensorsGroup.current) {
      navSensorsGroup.current.position.set(0, 0.30 + 0.45 * p, 0.44 + 0.75 * p);
    }

    // 3. edge_ai_core (03): Lifts Up and Shifts Right-Forward
    if (edgeAiCoreGroup.current) {
      edgeAiCoreGroup.current.position.set(0.18 + 0.55 * p, 0.32 + 0.55 * p, 0.10 + 0.15 * p);
    }

    // 4. chemical_tank (04): Shifts Left and Rearward
    if (chemicalTankGroup.current) {
      chemicalTankGroup.current.position.set(-0.20 - 0.55 * p, 0.30 + 0.45 * p, -0.15 - 0.25 * p);
    }

    // 5. solenoid_valve_pump (05): Shifts Left-Down/Center
    if (solenoidValvePumpGroup.current) {
      solenoidValvePumpGroup.current.position.set(-0.15 - 0.45 * p, 0.18 + 0.20 * p, -0.10 - 0.25 * p);
    }

    // 6. spray_boom_nozzles (06): Extends Outward to the Right-Front
    if (sprayBoomGroup.current) {
      sprayBoomGroup.current.position.set(0.26 + 0.65 * p, 0.28 + 0.45 * p, 0.28 + 0.45 * p);
    }

    // 7. battery_power (07): Lifts Up and Slides Rearward
    if (batteryPowerGroup.current) {
      batteryPowerGroup.current.position.set(0, 0.30 + 0.45 * p, -0.24 - 0.65 * p);
    }

    // 8. drive_suspension (08): 4 Wheel Units Expand Outward and Down
    if (wheelFLGroup.current) {
      wheelFLGroup.current.position.set(-0.36 - 0.45 * p, 0.08 - 0.22 * p, 0.28 + 0.38 * p);
    }
    if (wheelFRGroup.current) {
      wheelFRGroup.current.position.set(0.36 + 0.45 * p, 0.08 - 0.22 * p, 0.28 + 0.38 * p);
    }
    if (wheelRLGroup.current) {
      wheelRLGroup.current.position.set(-0.36 - 0.45 * p, 0.08 - 0.22 * p, -0.28 - 0.38 * p);
    }
    if (wheelRRGroup.current) {
      wheelRRGroup.current.position.set(0.36 + 0.45 * p, 0.08 - 0.22 * p, -0.28 - 0.38 * p);
    }

    // Solenoid valve plunger stroke animation during spray cycle
    if (plungerRef.current) {
      plungerRef.current.position.y = isSpraying
        ? Math.sin(state.clock.getElapsedTime() * 32) * 0.008 + 0.012
        : 0;
    }

    // Continuous 360° LiDAR Puck Rotation
    if (lidarPuckRef.current) {
      lidarPuckRef.current.rotation.y += delta * 12.0;
    }

    // Camera Tilt Pitch during leaf scanning
    if (cameraGimbalRef.current) {
      const targetPitch = isScanning ? 0.45 : 0;
      cameraGimbalRef.current.rotation.x = THREE.MathUtils.lerp(
        cameraGimbalRef.current.rotation.x,
        targetPitch,
        delta * 6.0
      );
    }

    let curX = position.x;
    let curZ = position.z;
    let curHeading = heading;
    let isMoving = false;

    // Autonomous Patrol Logic (paused when in Inspect Mode)
    if (isAutonomous && !isInspectMode && patrolState !== 'IDLE') {
      // Auto-trigger RTH when tank drops below 180 mL (<15%)
      if (
        tankVolume < 180 &&
        (patrolState === 'DRIVING' || patrolState === 'SCANNING')
      ) {
        rthSavedWaypointRef.current = waypointIndex;
        setPatrolState('RTH_RETURNING');
        setIsSpraying(false);
        setIsScanning(false);
        if (onSprayBannerChange) onSprayBannerChange(false);
        if (onProcessStatusChange) {
          onProcessStatusChange(
            `CRITICAL LOW TANK (${Math.round((tankVolume / 1200) * 100)}%) ➔ RETURNING TO HOME DOCK 01 FOR AUTO-REFILL`
          );
        }
        return;
      }

      if (patrolState === 'DRIVING') {
        const wp = patrolWaypoints[waypointIndex];
        if (wp) {
          const dx = wp.roverX - curX;
          const dz = wp.roverZ - curZ;
          const dist = Math.hypot(dx, dz);

          if (dist > 0.08) {
            isMoving = true;
            const moveStep = Math.min(dist, roverSpeed * 1.8 * delta);
            curX += (dx / dist) * moveStep;
            curZ += (dz / dist) * moveStep;

            const travelHeading = Math.atan2(dx, dz);
            curHeading = THREE.MathUtils.lerp(curHeading, travelHeading, delta * 8.0);
          } else {
            // Arrived at plant waypoint -> start scanning!
            curX = wp.roverX;
            curZ = wp.roverZ;
            curHeading = wp.targetHeading;
            setPatrolState('SCANNING');
            setIsScanning(true);
            stateTimerRef.current = 0.6; // 0.6s leaf scan time

            if (onProcessStatusChange) {
              onProcessStatusChange(`SCANNING ➔ Multispectral RGB+NIR Leaf Capture + ONNX Inference [Crop ${wp.id}]`);
            }

            if (onScannedPlantAdd) {
              onScannedPlantAdd(wp.id);
            }

            // Live AI Inference & HUD Frame Trigger
            const target = plants.find((p) => p.id === wp.id);
            if (target && sampleImagesRef.current && onFrameCapture) {
              const sample = sampleImagesRef.current[target.diseaseStatus] || sampleImagesRef.current['Healthy'];
              if (sample) {
                const isSick = target.diseaseStatus !== 'Healthy' && !target.treated;
                onFrameCapture({
                  predictedClass: target.diseaseStatus,
                  confidence: isSick ? 96.8 : 98.4,
                  severityPercentage: target.severity,
                  inferenceTimeMs: 29.4,
                  bbox: isSick ? [40, 48, 144, 128] : [0, 0, 0, 0],
                  stages: {
                    raw: sample.dataUrl,
                    clahe: sample.dataUrl,
                    mask: sample.dataUrl,
                    gradcam: sample.dataUrl,
                  },
                });
              }
            }

            if (onPlantsScannedChange) {
              onPlantsScannedChange(waypointIndex + 1);
            }
          }
        } else {
          // All 18 plants visited -> Return to Home Dock!
          setPatrolState('RETURNING');
          if (onProcessStatusChange) {
            onProcessStatusChange('MISSION COMPLETE ➔ Returning to Home Dock 01');
          }
        }
      } else if (patrolState === 'SCANNING') {
        stateTimerRef.current -= delta;
        const wp = patrolWaypoints[waypointIndex];
        const target = plants.find((p) => p.id === wp?.id);

        if (stateTimerRef.current <= 0) {
          setIsScanning(false);

          if (target && target.diseaseStatus !== 'Healthy' && !target.treated) {
            // Pathogen detected! Initiate Variable-Rate Micro-Dose Spray Cycle
            const vra = calculateVRADose(target.diseaseStatus, target.severity);
            activeVraRef.current = vra;

            setPatrolState('SPRAYING');
            setIsSpraying(true);
            stateTimerRef.current = 1.8;

            if (onSprayBannerChange) {
              onSprayBannerChange(true);
            }
            if (onProcessStatusChange) {
              onProcessStatusChange(
                `DETECTED: ${target.diseaseStatus} (${target.severity}% · ${vra.tier}) ➔ VRA Dose: ${vra.doseMl} mL (${vra.pwmPulseMs}ms PWM) ➔ ACTUATING NOZZLE: Spraying Micro-Dose`
              );
            }
          } else {
            // Plant is Healthy or already cured -> Solenoid stays locked, 0.0 mL sprayed, advance!
            activeVraRef.current = { tier: 'Healthy', doseMl: 0.0, pwmPulseMs: 0 };
            if (onProcessStatusChange) {
              onProcessStatusChange(`VERIFIED HEALTHY (98.6%) ➔ Solenoid LOCKED CLOSED (0.0 mL sprayed — 100% Chemical Saved)`);
            }
            setWaypointIndex((prev) => prev + 1);
            setPatrolState('DRIVING');
            const nextWp = patrolWaypoints[waypointIndex + 1];
            if (nextWp && onProcessStatusChange) {
              setTimeout(() => {
                onProcessStatusChange(`NAVIGATING ➔ Moving to Crop ${nextWp.id}`);
              }, 300);
            }
          }
        }
      } else if (patrolState === 'SPRAYING') {
        stateTimerRef.current -= delta;
        const wp = patrolWaypoints[waypointIndex];
        const target = plants.find((p) => p.id === wp?.id);

        // Oscillate spray turret during misting
        if (sprayTurretRef.current) {
          sprayTurretRef.current.rotation.x = Math.sin(stateTimerRef.current * 10) * 0.14;
        }

        if (stateTimerRef.current <= 0) {
          setIsSpraying(false);
          if (onSprayBannerChange) onSprayBannerChange(false);

          // Cure the plant and log mission with Variable Rate Micro-Dose
          if (target) {
            const prescription = getCropPrescription(target.diseaseStatus);
            const vra = calculateVRADose(target.diseaseStatus, target.severity);
            const dose = vra.doseMl;
            const savedPct = vra.chemicalSavedPct;

            // Deplete tank volume & slight battery consumption
            setTankVolume((prev) => Math.max(0, prev - dose));
            setBatteryLevel((prev) => Math.max(12, prev - 0.35));

            if (onPlantUpdate) {
              onPlantUpdate(target.id, { treated: true });
            }

            if (onMissionLog) {
              onMissionLog({
                plant_id: target.id,
                row: target.row + 1,
                col: target.col + 1,
                disease: target.diseaseStatus,
                severity: target.severity,
                dose_ml: dose,
                chemical_saved_pct: savedPct,
                weather: 'noon',
                inference_ms: 29.4,
              });
            }

            if (onProcessStatusChange) {
              onProcessStatusChange(
                `CURED! ➔ ${target.id} Treated with ${prescription.prescription} (${dose} mL) ➔ Advancing to Next Crop`
              );
            }
          }

          // Advance to next plant
          setWaypointIndex((prev) => prev + 1);
          setPatrolState('DRIVING');
          const nextWp = patrolWaypoints[waypointIndex + 1];
          if (nextWp && onProcessStatusChange) {
            setTimeout(() => {
              onProcessStatusChange(`NAVIGATING ➔ Moving to Crop ${nextWp.id}`);
            }, 350);
          }
        }
      } else if (patrolState === 'RTH_RETURNING') {
        const dockX = -4.8;
        const dockZ = -2.2;
        const dx = dockX - curX;
        const dz = dockZ - curZ;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.08) {
          isMoving = true;
          const moveStep = Math.min(dist, roverSpeed * 2.2 * delta);
          curX += (dx / dist) * moveStep;
          curZ += (dz / dist) * moveStep;

          const travelHeading = Math.atan2(dx, dz);
          curHeading = THREE.MathUtils.lerp(curHeading, travelHeading, delta * 8.0);
        } else {
          curX = dockX;
          curZ = dockZ;
          curHeading = 0;
          setPatrolState('RTH_REFILLING');
          stateTimerRef.current = 3.2;
          setRthRefillDisplayPct(12);
          if (onProcessStatusChange) {
            onProcessStatusChange('HOME CHARGE DOCK 01 ➔ AUTO-REFILLING TANK & FAST-CHARGING 48V LiFePO4 (12%)');
          }
        }
      } else if (patrolState === 'RTH_REFILLING') {
        stateTimerRef.current -= delta;
        const progress = Math.min(
          100,
          Math.round(12 + ((3.2 - Math.max(0, stateTimerRef.current)) / 3.2) * 88)
        );
        setRthRefillDisplayPct(progress);

        if (stateTimerRef.current <= 0) {
          setTankVolume(1200);
          setBatteryLevel(100);
          const resumeIdx = rthSavedWaypointRef.current ?? waypointIndex;
          setWaypointIndex(resumeIdx);
          setPatrolState('DRIVING');
          const resumeTarget = patrolWaypoints[resumeIdx];
          if (onProcessStatusChange) {
            onProcessStatusChange(
              `RESUMING AUTONOMOUS PATROL ➔ Driving to Saved Waypoint ${resumeTarget?.id || 'R1-C1'}`
            );
          }
          if (onResetRTH) onResetRTH();
        }
      } else if (patrolState === 'RETURNING') {
        const dockX = -4.8;
        const dockZ = -2.2;
        const dx = dockX - curX;
        const dz = dockZ - curZ;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.08) {
          isMoving = true;
          const moveStep = Math.min(dist, roverSpeed * 2.2 * delta);
          curX += (dx / dist) * moveStep;
          curZ += (dz / dist) * moveStep;

          const travelHeading = Math.atan2(dx, dz);
          curHeading = THREE.MathUtils.lerp(curHeading, travelHeading, delta * 8.0);
        } else {
          curX = dockX;
          curZ = dockZ;
          curHeading = 0;
          setPatrolState('IDLE');
          if (onProcessStatusChange) {
            onProcessStatusChange('MISSION COMPLETE ➔ Rover Docked at Home Base');
          }

          if (onPatrolComplete) {
            onPatrolComplete({
              totalScanned: 18,
              curedCount: plants.filter((p) => p.treated).length,
              healthyCount: plants.filter((p) => p.diseaseStatus === 'Healthy' && !p.treated).length,
            });
          }
        }
      }
    }

    setPosition({ x: curX, z: curZ });
    setHeading(curHeading);

    roverGroup.current.position.x = curX;
    roverGroup.current.position.z = curZ;
    roverGroup.current.rotation.y = curHeading;

    // Wheel rotation animation
    if (isMoving) {
      const wheelRot = delta * 12.0;
      if (wheelFL.current) wheelFL.current.rotation.x += wheelRot;
      if (wheelFR.current) wheelFR.current.rotation.x += wheelRot;
      if (wheelRL.current) wheelRL.current.rotation.x += wheelRot;
      if (wheelRR.current) wheelRR.current.rotation.x += wheelRot;
    }

    // World position of spray nozzle boom (pointing towards the plant canopy)
    const nozzleX = curX + Math.sin(curHeading) * nozzleOffset;
    const nozzleZ = curZ + Math.cos(curHeading) * nozzleOffset;
    setNozzleWorldPos([nozzleX, 0.36, nozzleZ]);

    if (onRoverStateChange) {
      onRoverStateChange({
        position: { x: curX, z: curZ },
        currentRow: patrolWaypoints[waypointIndex]?.row || 0,
        heading: curHeading,
        isMoving,
      });
    }
  });

  return (
    <>
      <group
        ref={roverGroup}
        position={[position.x, 0.24, position.z]}
        onClick={handleRoverClick}
        onDoubleClick={handleRoverDoubleClick}
      >
        {/* ── SEMI-TRANSPARENT CUTAWAY HOUSING: CHASSIS SPACE-FRAME & WIREFRAME ── */}
        <group ref={chassisFrameGroup}>
          {/* Main Space-Frame Box Section (Transforms Semi-Transparent in Cutaway) */}
          <mesh position={[0, 0.16, 0]} castShadow>
            <boxGeometry args={[0.56, 0.16, 0.88]} />
            <meshStandardMaterial
              color="#EAB308"
              metalness={0.7}
              roughness={0.25}
              transparent
              opacity={isInspectMode ? 0.35 : 1.0}
            />
          </mesh>

          {/* Glowing Yellow CAD Wireframe Box Outline in Cutaway View */}
          {explodedP > 0.05 && (
            <lineSegments position={[0, 0.16, 0]}>
              <edgesGeometry args={[new THREE.BoxGeometry(0.564, 0.164, 0.884)]} />
              <lineBasicMaterial color="#FACC15" transparent opacity={Math.min(0.9, explodedP * 1.5)} linewidth={1.5} />
            </lineSegments>
          )}

          {/* Tubular Roll-Cage Upper Hoops (Matte Black) */}
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[0.52, 0.08, 0.76]} />
            <meshStandardMaterial
              color="#18181B"
              metalness={0.85}
              roughness={0.3}
              transparent
              opacity={isInspectMode ? 0.4 : 1.0}
            />
          </mesh>

          {/* Front Heavy-Duty Tubular Bumper Loop */}
          <mesh position={[0, 0.16, 0.48]}>
            <boxGeometry args={[0.62, 0.08, 0.08]} />
            <meshStandardMaterial color="#18181B" metalness={0.9} roughness={0.25} />
          </mesh>
          {/* Front Dual Red Tow Hooks */}
          <mesh position={[-0.20, 0.12, 0.52]}>
            <cylinderGeometry args={[0.018, 0.018, 0.04, 8]} />
            <meshBasicMaterial color="#EF4444" />
          </mesh>
          <mesh position={[0.20, 0.12, 0.52]}>
            <cylinderGeometry args={[0.018, 0.018, 0.04, 8]} />
            <meshBasicMaterial color="#EF4444" />
          </mesh>

          {/* Rear Heavy-Duty Bumper Loop */}
          <mesh position={[0, 0.16, -0.48]}>
            <boxGeometry args={[0.62, 0.08, 0.08]} />
            <meshStandardMaterial color="#18181B" metalness={0.9} roughness={0.25} />
          </mesh>

          {/* Underbody Stamped 304 Stainless-Steel Skid Plate */}
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.48, 0.02, 0.82]} />
            <meshStandardMaterial
              color="#94A3B8"
              metalness={0.92}
              roughness={0.15}
              transparent
              opacity={isInspectMode ? 0.3 : 1.0}
            />
          </mesh>

          {/* Underbody Ground Status Illumination Strip */}
          <pointLight
            position={[0, 0.02, 0]}
            color={isSpraying ? '#38BDF8' : isScanning ? (targetIsSick ? '#F59E0B' : '#10B981') : '#10B981'}
            intensity={1.2}
            distance={2.5}
          />
        </group>

        {/* ── Sub-Assembly 01: MULTISPECTRAL_GIMBAL (RGB + 850nm NIR Leaf Scanner) ── */}
        <group
          ref={multispectralGimbalGroup}
          position={[-0.18, 0.25, 0.36]}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectPart) onSelectPart('multispectral_gimbal');
          }}
        >
          {/* Carbon-Fiber Gimbal Bracket */}
          <mesh>
            <cylinderGeometry args={[0.02, 0.02, 0.14, 8]} />
            <meshStandardMaterial color="#0F172A" />
          </mesh>
          {/* 2-Axis Articulated Camera Housing */}
          <group ref={cameraGimbalRef} position={[0, -0.06, 0.04]}>
            <mesh castShadow>
              <boxGeometry args={[0.14, 0.10, 0.12]} />
              <meshStandardMaterial
                color="#0F172A"
                metalness={0.8}
                emissive={selectedPartId === 'multispectral_gimbal' ? '#8B5CF6' : '#000000'}
                emissiveIntensity={selectedPartId === 'multispectral_gimbal' ? 0.5 : 0}
              />
            </mesh>
            {/* Macro Glass Lens Barrel */}
            <mesh position={[0, 0, 0.065]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.035, 0.040, 0.04, 16]} />
              <meshStandardMaterial color="#0284C7" metalness={0.95} roughness={0.1} />
            </mesh>
            {/* Optical Glass Element */}
            <mesh position={[0, 0, 0.086]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.028, 0.028, 0.005, 16]} />
              <meshBasicMaterial color={isScanning ? (targetIsSick ? '#F59E0B' : '#10B981') : '#0EA5E9'} />
            </mesh>
            {/* 8-Diode NIR 850nm Ring Light */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
              const ang = (i / 8) * Math.PI * 2;
              return (
                <mesh key={i} position={[Math.cos(ang) * 0.044, Math.sin(ang) * 0.044, 0.082]}>
                  <sphereGeometry args={[0.005, 6, 6]} />
                  <meshBasicMaterial color="#A855F7" />
                </mesh>
              );
            })}
            {/* Coaxial Green Laser Crosshair Emitter */}
            <mesh position={[0, -0.038, 0.065]}>
              <sphereGeometry args={[0.007, 8, 8]} />
              <meshBasicMaterial color="#10B981" />
            </mesh>

            {/* Volumetric Scanning Laser Cone with Selective Micro-Spraying Proof */}
            {isScanning && (
              <group position={[0, 0, 0.1]}>
                <mesh rotation={[0.45, 0, 0]}>
                  <coneGeometry args={[0.75, 1.35, 16, 1, true]} />
                  <meshBasicMaterial
                    color={targetIsSick ? '#F59E0B' : '#10B981'}
                    transparent
                    opacity={0.38}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
                <mesh position={[0, 0.45, 0.7]} rotation={[0.45, 0, 0]}>
                  <planeGeometry args={[1.1, 0.04]} />
                  <meshBasicMaterial
                    color={targetIsSick ? '#EF4444' : '#34D399'}
                    transparent
                    opacity={0.9}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
                {/* 3D Selective Spray Decision Callout */}
                <Html position={[0, 0.65, 0.7]} center zIndexRange={[10, 0]} occlude>
                  <div
                    className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold border shadow-xl flex items-center gap-1.5 whitespace-nowrap select-none ${
                      targetIsSick
                        ? 'bg-red-950/90 text-red-300 border-red-500/60 shadow-red-950/50'
                        : 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-emerald-950/50'
                    }`}
                  >
                    <span>{targetIsSick ? '⚠️ PATHOGEN DETECTED' : '✅ HEALTHY VERIFIED'}</span>
                    <span className="text-[8px] opacity-80">
                      {targetIsSick ? '· SOLENOID ARMED' : '· SOLENOID LOCKED (0.0 mL)'}
                    </span>
                  </div>
                </Html>
              </group>
            )}
          </group>
        </group>

        {/* ── Sub-Assembly 02: NAVIGATION_SENSORS (360° LiDAR & Ultrasonic Row Guidance) ── */}
        <group
          ref={navSensorsGroup}
          position={[0, 0.30, 0.44]}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectPart) onSelectPart('navigation_sensors');
          }}
        >
          {/* Bumper Mount Plate */}
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.03, 0.08]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          {/* 360° Spinning Micro-LiDAR Dome Puck */}
          <group position={[0, 0.07, 0]}>
            <mesh>
              <cylinderGeometry args={[0.055, 0.055, 0.06, 16]} />
              <meshStandardMaterial
                color="#0F172A"
                metalness={0.9}
                roughness={0.15}
                emissive={selectedPartId === 'navigation_sensors' ? '#F59E0B' : '#000000'}
                emissiveIntensity={selectedPartId === 'navigation_sensors' ? 0.45 : 0}
              />
            </mesh>
            {/* Spinning Laser Aperture Slit */}
            <mesh ref={lidarPuckRef} position={[0, 0, 0]}>
              <cylinderGeometry args={[0.058, 0.058, 0.012, 16]} />
              <meshBasicMaterial color="#EF4444" />
            </mesh>
          </group>
          {/* Dual HC-SR04 Ultrasonic Sensors */}
          <group position={[-0.14, 0.02, 0.03]}>
            <mesh position={[0, 0, -0.01]}>
              <boxGeometry args={[0.08, 0.04, 0.015]} />
              <meshStandardMaterial color="#0284C7" />
            </mesh>
            <mesh position={[-0.024, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.022, 12]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
            </mesh>
            <mesh position={[0.024, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.022, 12]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
            </mesh>
          </group>
          <group position={[0.14, 0.02, 0.03]}>
            <mesh position={[0, 0, -0.01]}>
              <boxGeometry args={[0.08, 0.04, 0.015]} />
              <meshStandardMaterial color="#0284C7" />
            </mesh>
            <mesh position={[-0.024, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.022, 12]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
            </mesh>
            <mesh position={[0.024, 0, 0.015]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.022, 12]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
            </mesh>
          </group>
        </group>

        {/* ── Sub-Assembly 03: EDGE_AI_CORE (ESP32-S3 Compute & Vector Accelerator) ── */}
        <group
          ref={edgeAiCoreGroup}
          position={[0.18, 0.32, 0.10]}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectPart) onSelectPart('edge_ai_core');
          }}
        >
          {/* IP67 Sealed Avionics Box with Clear Window */}
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.14, 0.26]} />
            <meshStandardMaterial
              color="#0F172A"
              transparent
              opacity={0.65}
              roughness={0.15}
              metalness={0.4}
              emissive={selectedPartId === 'edge_ai_core' ? '#06B6D4' : '#000000'}
              emissiveIntensity={selectedPartId === 'edge_ai_core' ? 0.45 : 0}
            />
          </mesh>
          {/* Internal ESP32-S3 Green PCB */}
          <mesh position={[0, -0.02, 0]}>
            <boxGeometry args={[0.18, 0.015, 0.22]} />
            <meshStandardMaterial color="#15803D" roughness={0.3} />
          </mesh>
          {/* Central Neural Inference Processor Chip with Glowing Beating Pulse */}
          <mesh position={[0, 0.005, 0]}>
            <boxGeometry args={[0.065, 0.018, 0.065]} />
            <meshStandardMaterial
              color="#09090B"
              metalness={0.9}
              emissive="#06B6D4"
              emissiveIntensity={isScanning ? 0.9 : 0.4}
            />
          </mesh>
          {/* Aluminum Heatsink Block */}
          <mesh position={[0, 0.025, 0]}>
            <boxGeometry args={[0.08, 0.02, 0.08]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
          </mesh>
          {/* Pulsing Status Beacons */}
          <mesh position={[-0.05, 0.02, 0.06]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color="#10B981" />
          </mesh>
          <mesh position={[-0.02, 0.02, 0.06]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color="#06B6D4" />
          </mesh>
          <mesh position={[0.01, 0.02, 0.06]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshBasicMaterial color="#F59E0B" />
          </mesh>
          {/* Dual High-Gain Telemetry Antennas */}
          <group position={[0.06, 0.08, -0.06]} rotation={[0.15, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.008, 0.008, 0.20, 8]} />
              <meshStandardMaterial color="#09090B" />
            </mesh>
          </group>
          <group position={[0.06, 0.08, 0.04]} rotation={[-0.15, 0, 0]}>
            <mesh>
              <cylinderGeometry args={[0.008, 0.008, 0.20, 8]} />
              <meshStandardMaterial color="#09090B" />
            </mesh>
          </group>
        </group>

        {/* ── Sub-Assembly 04: CHEMICAL_TANK (Translucent Graduated Poly Reservoir) ── */}
        <group
          ref={chemicalTankGroup}
          position={[-0.20, 0.30, -0.15]}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectPart) onSelectPart('chemical_tank');
          }}
        >
          {/* Translucent Graduated Agrochemical Reservoir */}
          <mesh castShadow>
            <boxGeometry args={[0.26, 0.24, 0.28]} />
            <meshStandardMaterial
              color="#E2E8F0"
              transparent
              opacity={0.65}
              roughness={0.12}
              metalness={0.2}
              emissive={selectedPartId === 'chemical_tank' ? '#38BDF8' : '#000000'}
              emissiveIntensity={selectedPartId === 'chemical_tank' ? 0.45 : 0}
            />
          </mesh>

          {/* Dynamic Cyan Bio-Fungicide Fluid Volume (Visibly Depletes as tankVolume Decreases) */}
          {(() => {
            const fillRatio = Math.max(0.08, tankVolume / 1200);
            const fluidHeight = 0.18 * fillRatio;
            const fluidY = -0.11 + fluidHeight / 2;
            return (
              <mesh position={[0, fluidY, 0]}>
                <boxGeometry args={[0.24, fluidHeight, 0.26]} />
                <meshStandardMaterial
                  color="#06B6D4"
                  transparent
                  opacity={0.85}
                  roughness={0.2}
                  emissive="#06B6D4"
                  emissiveIntensity={0.35}
                />
              </mesh>
            );
          })()}

          {/* Top Threaded Yellow Filler Cap */}
          <mesh position={[0, 0.13, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.03, 12]} />
            <meshStandardMaterial color="#F59E0B" roughness={0.4} />
          </mesh>
          {/* Analog Hydraulic Pressure Gauge (2.8 Bar) */}
          <mesh position={[0.135, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.015, 12]} />
            <meshStandardMaterial color="#EAB308" metalness={0.9} />
          </mesh>
          {/* Bottom 50-Mesh In-Line Stainless Suction Strainer */}
          <mesh position={[0, -0.13, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.03, 10]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} />
          </mesh>
        </group>

        {/* ── Sub-Assembly 05: SOLENOID_VALVE_PUMP (Micro-Diaphragm Pump & High-Speed Valve) ── */}
        <group
          ref={solenoidValvePumpGroup}
          position={[-0.15, 0.18, -0.10]}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectPart) onSelectPart('solenoid_valve_pump');
          }}
        >
          {/* 12V 4-Chamber Micro-Diaphragm Pump Body */}
          <mesh position={[0, -0.02, 0]} castShadow>
            <boxGeometry args={[0.18, 0.08, 0.14]} />
            <meshStandardMaterial
              color="#334155"
              metalness={0.8}
              roughness={0.25}
              emissive={selectedPartId === 'solenoid_valve_pump' ? '#E11D48' : '#000000'}
              emissiveIntensity={selectedPartId === 'solenoid_valve_pump' ? 0.45 : 0}
            />
          </mesh>
          {/* High-Speed Forged Brass Solenoid Valve Body */}
          <mesh position={[0.06, 0.04, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 0.065, 12]} />
            <meshStandardMaterial color="#EAB308" metalness={0.92} roughness={0.15} />
          </mesh>
          {/* Direct-Acting Solenoid Coil Cap */}
          <mesh position={[0.06, 0.08, 0]}>
            <boxGeometry args={[0.042, 0.035, 0.042]} />
            <meshStandardMaterial color="#09090B" metalness={0.7} />
          </mesh>
          {/* Animated Valve Plunger Piston (Strokes during targeted spray) */}
          <group ref={plungerRef} position={[0.06, 0.02, 0]}>
            <mesh>
              <cylinderGeometry args={[0.012, 0.012, 0.03, 10]} />
              <meshStandardMaterial color="#EF4444" metalness={0.8} />
            </mesh>
          </group>
          {/* Optical Pulse Flowmeter Fitting */}
          <mesh position={[-0.06, 0.02, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.04, 8]} />
            <meshStandardMaterial color="#0284C7" metalness={0.9} />
          </mesh>
        </group>

        {/* ── Sub-Assembly 06: SPRAY_BOOM_NOZZLES (Articulated Boom & Atomizer Nozzle) ── */}
        <group
          ref={sprayBoomGroup}
          position={[0.26, 0.28, 0.28]}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectPart) onSelectPart('spray_boom_nozzles');
          }}
        >
          {/* Base Turret Servo Pivot */}
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
            <meshStandardMaterial color="#0284C7" metalness={0.8} />
          </mesh>
          {/* Articulated 3-DOF Carbon-Fiber Boom Arm */}
          <group ref={sprayTurretRef} position={[0, 0.04, 0]}>
            <mesh rotation={[0, 0, Math.PI / 4]} position={[0.08, 0.06, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.18, 8]} />
              <meshStandardMaterial color="#64748B" metalness={0.8} />
            </mesh>
            <mesh position={[0.15, 0.12, 0]}>
              <sphereGeometry args={[0.022, 8, 8]} />
              <meshStandardMaterial color="#0284C7" />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI / 6]} position={[0.22, 0.08, 0.06]}>
              <cylinderGeometry args={[0.014, 0.014, 0.16, 8]} />
              <meshStandardMaterial color="#64748B" metalness={0.8} />
            </mesh>
            {/* TeeJet-Style Polished Brass Atomizer Nozzle */}
            <mesh position={[0.26, 0.04, 0.12]} rotation={[0.4, 0, 0]}>
              <cylinderGeometry args={[0.024, 0.012, 0.07, 10]} />
              <meshStandardMaterial
                color="#EAB308"
                metalness={0.92}
                roughness={0.15}
                emissive={selectedPartId === 'spray_boom_nozzles' ? '#F43F5E' : '#000000'}
                emissiveIntensity={selectedPartId === 'spray_boom_nozzles' ? 0.45 : 0}
              />
            </mesh>
            {/* -5kV Electrostatic Induction Ring */}
            <mesh position={[0.26, 0.01, 0.14]} rotation={[0.4, 0, 0]}>
              <ringGeometry args={[0.026, 0.032, 16]} />
              <meshBasicMaterial color="#38BDF8" side={THREE.DoubleSide} />
            </mesh>

            {/* Pressurized 3D Fine Spray Mist Cone */}
            {(isSpraying || (isInspectMode && selectedPartId === 'spray_boom_nozzles')) && (
              <mesh position={[0.26, -0.22, 0.45]} rotation={[0.5, 0, 0]}>
                <coneGeometry args={[0.65, 1.3, 16, 1, true]} />
                <meshBasicMaterial
                  color="#38BDF8"
                  transparent
                  opacity={0.48}
                  side={THREE.DoubleSide}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            )}
          </group>
        </group>

        {/* ── Sub-Assembly 07: BATTERY_POWER (48V LiFePO4 Swappable Bay & Smart BMS) ── */}
        <group
          ref={batteryPowerGroup}
          position={[0, 0.30, -0.24]}
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectPart) onSelectPart('battery_power');
          }}
        >
          {/* Main Weatherproof Battery Enclosure with Cutaway Window */}
          <mesh castShadow>
            <boxGeometry args={[0.34, 0.16, 0.38]} />
            <meshStandardMaterial
              color="#065F46"
              metalness={0.7}
              roughness={0.3}
              transparent
              opacity={isInspectMode ? 0.65 : 1.0}
              emissive={selectedPartId === 'battery_power' ? '#10B981' : '#000000'}
              emissiveIntensity={selectedPartId === 'battery_power' ? 0.45 : 0}
            />
          </mesh>
          {/* Internal 16S LiFePO4 Blue Prismatic Cells */}
          {[-0.10, -0.03, 0.04, 0.11].map((cx, idx) => (
            <mesh key={`cell-${idx}`} position={[cx, 0, 0]}>
              <boxGeometry args={[0.05, 0.12, 0.32]} />
              <meshStandardMaterial color="#0284C7" metalness={0.8} />
            </mesh>
          ))}
          {/* Extruded Aluminum Cooling Fins */}
          <mesh position={[-0.18, 0, 0]}>
            <boxGeometry args={[0.02, 0.12, 0.32]} />
            <meshStandardMaterial color="#1E293B" metalness={0.9} />
          </mesh>
          <mesh position={[0.18, 0, 0]}>
            <boxGeometry args={[0.02, 0.12, 0.32]} />
            <meshStandardMaterial color="#1E293B" metalness={0.9} />
          </mesh>
          {/* Red Anderson High-Current Connector Plug */}
          <mesh position={[0, -0.04, -0.20]}>
            <boxGeometry args={[0.08, 0.04, 0.03]} />
            <meshBasicMaterial color="#EF4444" />
          </mesh>
          {/* 5-LED State of Charge Green Bar */}
          <mesh position={[0, 0.04, -0.195]}>
            <boxGeometry args={[0.16, 0.02, 0.01]} />
            <meshBasicMaterial color="#10B981" />
          </mesh>
          {/* Quick-Swap Carry Handle */}
          <mesh position={[0, 0.10, 0]}>
            <boxGeometry args={[0.14, 0.03, 0.03]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} />
          </mesh>
        </group>

        {/* ── Sub-Assembly 08: DRIVE_SUSPENSION (4WD Rocker-Bogie & Lugged Tires) ── */}
        <group ref={driveSuspensionGroup}>
          {/* Front-Left Wheel Module */}
          <group
            ref={wheelFLGroup}
            position={[-0.36, 0.08, 0.28]}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectPart) onSelectPart('drive_suspension');
            }}
          >
            {/* Rocker-Bogie Suspension Arm */}
            <mesh position={[0.08, 0.08, 0]} rotation={[0, 0, -0.35]}>
              <boxGeometry args={[0.04, 0.16, 0.04]} />
              <meshStandardMaterial color="#475569" metalness={0.85} />
            </mesh>
            {/* Coil-Over Orange Shock Strut */}
            <mesh position={[0.06, 0.06, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.14, 8]} />
              <meshStandardMaterial color="#F97316" metalness={0.7} />
            </mesh>
            {/* Wheel-Hub BLDC Motor Casing */}
            <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.055, 0.055, 0.05, 12]} />
              <meshStandardMaterial color="#0F766E" metalness={0.8} />
            </mesh>
            {/* Wheel & Chevron-Lug Tire */}
            <group ref={wheelFL}>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.145, 0.145, 0.12, 16]} />
                <meshStandardMaterial
                  color="#18181B"
                  roughness={0.95}
                  emissive={selectedPartId === 'drive_suspension' ? '#0284C7' : '#000000'}
                  emissiveIntensity={selectedPartId === 'drive_suspension' ? 0.35 : 0}
                />
              </mesh>
              {/* Alloy Beadlock Rim */}
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.09, 0.09, 0.124, 12]} />
                <meshStandardMaterial color="#0284C7" metalness={0.85} roughness={0.2} />
              </mesh>
            </group>
          </group>

          {/* Front-Right Wheel Module */}
          <group
            ref={wheelFRGroup}
            position={[0.36, 0.08, 0.28]}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectPart) onSelectPart('drive_suspension');
            }}
          >
            <mesh position={[-0.08, 0.08, 0]} rotation={[0, 0, 0.35]}>
              <boxGeometry args={[0.04, 0.16, 0.04]} />
              <meshStandardMaterial color="#475569" metalness={0.85} />
            </mesh>
            <mesh position={[-0.06, 0.06, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.14, 8]} />
              <meshStandardMaterial color="#F97316" metalness={0.7} />
            </mesh>
            <mesh position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.055, 0.055, 0.05, 12]} />
              <meshStandardMaterial color="#0F766E" metalness={0.8} />
            </mesh>
            <group ref={wheelFR}>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.145, 0.145, 0.12, 16]} />
                <meshStandardMaterial
                  color="#18181B"
                  roughness={0.95}
                  emissive={selectedPartId === 'drive_suspension' ? '#0284C7' : '#000000'}
                  emissiveIntensity={selectedPartId === 'drive_suspension' ? 0.35 : 0}
                />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.09, 0.09, 0.124, 12]} />
                <meshStandardMaterial color="#0284C7" metalness={0.85} roughness={0.2} />
              </mesh>
            </group>
          </group>

          {/* Rear-Left Wheel Module */}
          <group
            ref={wheelRLGroup}
            position={[-0.36, 0.08, -0.28]}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectPart) onSelectPart('drive_suspension');
            }}
          >
            <mesh position={[0.08, 0.08, 0]} rotation={[0, 0, -0.35]}>
              <boxGeometry args={[0.04, 0.16, 0.04]} />
              <meshStandardMaterial color="#475569" metalness={0.85} />
            </mesh>
            <mesh position={[0.06, 0.06, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.14, 8]} />
              <meshStandardMaterial color="#F97316" metalness={0.7} />
            </mesh>
            <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.055, 0.055, 0.05, 12]} />
              <meshStandardMaterial color="#0F766E" metalness={0.8} />
            </mesh>
            <group ref={wheelRL}>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.145, 0.145, 0.12, 16]} />
                <meshStandardMaterial
                  color="#18181B"
                  roughness={0.95}
                  emissive={selectedPartId === 'drive_suspension' ? '#0284C7' : '#000000'}
                  emissiveIntensity={selectedPartId === 'drive_suspension' ? 0.35 : 0}
                />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.09, 0.09, 0.124, 12]} />
                <meshStandardMaterial color="#0284C7" metalness={0.85} roughness={0.2} />
              </mesh>
            </group>
          </group>

          {/* Rear-Right Wheel Module */}
          <group
            ref={wheelRRGroup}
            position={[0.36, 0.08, -0.28]}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectPart) onSelectPart('drive_suspension');
            }}
          >
            <mesh position={[-0.08, 0.08, 0]} rotation={[0, 0, 0.35]}>
              <boxGeometry args={[0.04, 0.16, 0.04]} />
              <meshStandardMaterial color="#475569" metalness={0.85} />
            </mesh>
            <mesh position={[-0.06, 0.06, 0]}>
              <cylinderGeometry args={[0.016, 0.016, 0.14, 8]} />
              <meshStandardMaterial color="#F97316" metalness={0.7} />
            </mesh>
            <mesh position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.055, 0.055, 0.05, 12]} />
              <meshStandardMaterial color="#0F766E" metalness={0.8} />
            </mesh>
            <group ref={wheelRR}>
              <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.145, 0.145, 0.12, 16]} />
                <meshStandardMaterial
                  color="#18181B"
                  roughness={0.95}
                  emissive={selectedPartId === 'drive_suspension' ? '#0284C7' : '#000000'}
                  emissiveIntensity={selectedPartId === 'drive_suspension' ? 0.35 : 0}
                />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.09, 0.09, 0.124, 12]} />
                <meshStandardMaterial color="#0284C7" metalness={0.85} roughness={0.2} />
              </mesh>
            </group>
          </group>
        </group>

        {/* ── ANIMATED INTERNAL SIGNAL & FLUID FLOW ARROWS (Closed-Loop CAD Streams) ── */}
        {explodedP > 0.08 && (
          <group>
            {/* Blue Data Stream: Leaf Camera -> Edge AI Compute -> Solenoid Valve */}
            <AnimatedFlowPath
              points={[
                [-0.18 - 0.45 * explodedP, 0.22 + 0.55 * explodedP, 0.36 + 0.45 * explodedP],
                [0.0, 0.30 + 0.45 * explodedP, 0.25 + 0.25 * explodedP],
                [0.18 + 0.55 * explodedP, 0.32 + 0.55 * explodedP, 0.10 + 0.15 * explodedP],
                [0.02 + 0.10 * explodedP, 0.26 + 0.35 * explodedP, 0.0],
                [-0.15 - 0.45 * explodedP, 0.20 + 0.20 * explodedP, -0.10 - 0.25 * explodedP],
              ]}
              color="#0284C7"
              pulseColor="#38BDF8"
              count={4}
              speed={2.2}
              radius={0.007}
            />

            {/* Cyan Fluid Stream: Pressurized Tank -> Diaphragm Pump -> Solenoid Valve -> Precision Nozzle */}
            <AnimatedFlowPath
              points={[
                [-0.20 - 0.55 * explodedP, 0.20 + 0.45 * explodedP, -0.15 - 0.25 * explodedP],
                [-0.18 - 0.50 * explodedP, 0.15 + 0.30 * explodedP, -0.12 - 0.25 * explodedP],
                [-0.15 - 0.45 * explodedP, 0.20 + 0.20 * explodedP, -0.10 - 0.25 * explodedP],
                [0.05 + 0.10 * explodedP, 0.24 + 0.30 * explodedP, 0.08 + 0.10 * explodedP],
                [0.26 + 0.65 * explodedP, 0.28 + 0.45 * explodedP, 0.28 + 0.45 * explodedP],
              ]}
              color="#06B6D4"
              pulseColor="#E0F2FE"
              count={4}
              speed={1.6}
              radius={0.009}
            />

            {/* Visual Stream Labels */}
            <Html
              position={[0.08 + 0.35 * explodedP, 0.38 + 0.50 * explodedP, 0.15 + 0.20 * explodedP]}
              center
              zIndexRange={[10, 0]}
              occlude
            >
              <div className="bg-blue-950/90 text-cyan-300 font-mono text-[8px] font-bold px-2 py-0.5 rounded-full border border-cyan-400/50 shadow-lg whitespace-nowrap pointer-events-none flex items-center gap-1 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>DATA STREAM: CAMERA → INT8 AI → SOLENOID (29.4ms)</span>
              </div>
            </Html>

            <Html
              position={[-0.05 - 0.25 * explodedP, 0.12 + 0.30 * explodedP, 0.05 + 0.10 * explodedP]}
              center
              zIndexRange={[10, 0]}
              occlude
            >
              <div className="bg-cyan-950/90 text-teal-300 font-mono text-[8px] font-bold px-2 py-0.5 rounded-full border border-teal-400/50 shadow-lg whitespace-nowrap pointer-events-none flex items-center gap-1 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>FLUID STREAM: TANK → PUMP → SOLENOID → NOZZLE (0.4 mL/s)</span>
              </div>
            </Html>
          </group>
        )}

        {/* ── SUBTLE GLOWING TECHNICAL CONNECTOR LINES IN EXPLODED VIEW ── */}
        {explodedP > 0.05 && (
          <group>
            <ConnectorLine
              start={[0, 0.25, 0]}
              end={[-0.18 - 0.45 * explodedP, 0.25 + 0.55 * explodedP, 0.36 + 0.45 * explodedP]}
              opacity={explodedP * 0.45}
            />
            <ConnectorLine
              start={[0, 0.25, 0]}
              end={[0, 0.30 + 0.45 * explodedP, 0.44 + 0.75 * explodedP]}
              opacity={explodedP * 0.45}
            />
            <ConnectorLine
              start={[0, 0.25, 0]}
              end={[0.18 + 0.55 * explodedP, 0.32 + 0.55 * explodedP, 0.10 + 0.15 * explodedP]}
              opacity={explodedP * 0.45}
            />
            <ConnectorLine
              start={[0, 0.25, 0]}
              end={[-0.20 - 0.55 * explodedP, 0.30 + 0.45 * explodedP, -0.15 - 0.25 * explodedP]}
              opacity={explodedP * 0.45}
            />
            <ConnectorLine
              start={[0, 0.25, 0]}
              end={[-0.15 - 0.45 * explodedP, 0.18 + 0.20 * explodedP, -0.10 - 0.25 * explodedP]}
              opacity={explodedP * 0.45}
            />
            <ConnectorLine
              start={[0, 0.25, 0]}
              end={[0.26 + 0.65 * explodedP, 0.28 + 0.45 * explodedP, 0.28 + 0.45 * explodedP]}
              opacity={explodedP * 0.45}
            />
            <ConnectorLine
              start={[0, 0.25, 0]}
              end={[0, 0.30 + 0.45 * explodedP, -0.24 - 0.65 * explodedP]}
              opacity={explodedP * 0.45}
            />
            <ConnectorLine
              start={[0, 0.25, 0]}
              end={[-0.36 - 0.45 * explodedP, 0.08 - 0.22 * explodedP, 0.28 + 0.38 * explodedP]}
              opacity={explodedP * 0.45}
            />
          </group>
        )}

        {/* ── 8 SIMULTANEOUS PERIMETER ENGINEERING CALLOUT BADGES (Invigilator Demo) ── */}
        {isInspectMode && !hideAllBadges && explodedP > 0.25 && (
          <group>
            {ROVER_COMPONENTS.map((comp) => {
              const isSelected = selectedPartId === comp.id;
              const bx = comp.pinOffset[0] * Math.max(0.65, explodedP);
              const by = comp.pinOffset[1] * Math.max(0.65, explodedP);
              const bz = comp.pinOffset[2] * Math.max(0.65, explodedP);

              const px = comp.explodedOffset[0] * explodedP;
              const py = comp.explodedOffset[1] * explodedP + 0.25;
              const pz = comp.explodedOffset[2] * explodedP;

              return (
                <group key={comp.id}>
                  {/* Glowing Leader Line from Perimeter Badge to Exact 3D Part Anchor */}
                  <ConnectorLine
                    start={[px, py, pz]}
                    end={[bx, by, bz]}
                    opacity={Math.min(0.85, (explodedP - 0.2) * 1.5)}
                    color={isSelected ? '#22D3EE' : comp.color}
                  />

                  {/* Clean Non-Overlapping Callout Card with Key Engineering Specs */}
                  <group position={[bx, by, bz]}>
                    <Html center zIndexRange={[10, 0]} occlude>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectPart) onSelectPart(comp.id);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold backdrop-blur-md border shadow-lg transition-all cursor-pointer select-none max-w-[170px] truncate ${
                          isSelected
                            ? 'bg-cyan-950/95 text-white border-cyan-400 ring-1 ring-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-105'
                            : 'bg-slate-950/85 text-slate-300 border-slate-700/80 hover:border-cyan-400 hover:text-white hover:bg-slate-900'
                        }`}
                        title={comp.name}
                      >
                        <span className="text-xs shrink-0">{comp.icon}</span>
                        <span className="truncate">
                          {comp.number} · {comp.shortName.split('·')[1]?.trim() || comp.shortName}
                        </span>
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
                        )}
                      </button>
                    </Html>
                  </group>
                </group>
              );
            })}
          </group>
        )}
      </group>

      <SprayParticles position={nozzleWorldPos} active={isSpraying} />
    </>
  );
}


/* ══════════════════════════════════════════════════════════════════════════════
   8. CAMERA PRESET CONTROLLER (Top View, Side Action, Follow Cam, Orbit, Inspect)
   ══════════════════════════════════════════════════════════════════════════════ */

function CameraPresetController({
  cameraPreset,
  isInspectMode = false,
  roverPosition,
  roverHeading,
  controlsRef,
}) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isInspectMode && roverPosition) {
      // Elevated close-up 3/4 isometric inspection view centered above the bottom drawer
      const targetX = roverPosition.x - 0.15;
      const targetY = 0.92;
      const targetZ = roverPosition.z + 0.05;

      const camX = roverPosition.x + 2.3;
      const camY = 2.35;
      const camZ = roverPosition.z + 2.3;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, camX, delta * 3.8);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, camY, delta * 3.8);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, camZ, delta * 3.8);

      controlsRef.current.target.x = THREE.MathUtils.lerp(controlsRef.current.target.x, targetX, delta * 4.5);
      controlsRef.current.target.y = THREE.MathUtils.lerp(controlsRef.current.target.y, targetY, delta * 4.5);
      controlsRef.current.target.z = THREE.MathUtils.lerp(controlsRef.current.target.z, targetZ, delta * 4.5);
      controlsRef.current.update();
    } else if (cameraPreset === 'follow' && roverPosition) {
      const targetX = roverPosition.x - Math.sin(roverHeading || 0) * 3.4;
      const targetY = 2.8;
      const targetZ = roverPosition.z - Math.cos(roverHeading || 0) * 3.4;

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, delta * 3.5);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta * 3.5);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, delta * 3.5);

      controlsRef.current.target.x = THREE.MathUtils.lerp(controlsRef.current.target.x, roverPosition.x, delta * 4.0);
      controlsRef.current.target.y = THREE.MathUtils.lerp(controlsRef.current.target.y, 0.5, delta * 4.0);
      controlsRef.current.target.z = THREE.MathUtils.lerp(controlsRef.current.target.z, roverPosition.z, delta * 4.0);
      controlsRef.current.update();
    } else if (cameraPreset === 'top') {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, delta * 3.0);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 14.5, delta * 3.0);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 0.05, delta * 3.0);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    } else if (cameraPreset === 'side') {
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, 10.5, delta * 3.0);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4.0, delta * 3.0);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 0, delta * 3.0);
      controlsRef.current.target.set(0, 0.4, 0);
      controlsRef.current.update();
    }
  });

  return null;
}

/* ══════════════════════════════════════════════════════════════════════════════
   9. MAIN 3D FIELD SIMULATION CANVAS (Photorealistic ACES PBR Farmland)
   ══════════════════════════════════════════════════════════════════════════════ */

export default function FieldSimulation3D({
  plants = [],
  cropType = 'rose',
  weatherPreset = 'noon',
  cameraPreset = 'orbit',
  smartHudFocus = true,
  isInspectMode = false,
  selectedPartId = 'multispectral_gimbal',
  chemicalUsed = 0,
  onSelectPart,
  onToggleInspect,
  onAssembleAndResume,
  hideAllBadges = false,
  onPlantSelect,
  onMissionLog,
  onFrameCapture,
  onRoverStateChange,
  onCountdownChange,
  onPlantsScannedChange,
  roverSpeed = 0.5,
  nozzleOffset = 0.8,
  isAutonomous = false,
  onPlantUpdate,
  onPatrolComplete,
  onSprayBannerChange,
  triggerRTH = false,
  onResetRTH,
  onProcessStatusChange,
  onRoverTelemetryChange,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [activeWaypointId, setActiveWaypointId] = useState(null);
  const [scannedPlants, setScannedPlants] = useState(new Set());
  const [roverLivePos, setRoverLivePos] = useState({ x: -4.8, z: -2.2 });
  const [roverLiveHeading, setRoverLiveHeading] = useState(0);

  const controlsRef = useRef();
  const textures = useMemo(() => createProceduralTextures(), []);

  const rowZCoords = useMemo(() => [-2.2, 0.0, 2.2], []);
  const colXCoords = useMemo(() => [-3.5, -2.1, -0.7, 0.7, 2.1, 3.5], []);

  const handleScannedPlantAdd = useCallback((plantId) => {
    setScannedPlants((prev) => {
      const next = new Set(prev);
      next.add(plantId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isAutonomous) {
      setActiveWaypointId(null);
    }
  }, [isAutonomous]);

  const handleRoverStateUpdate = useCallback((state) => {
    setRoverLivePos(state.position);
    setRoverLiveHeading(state.heading);
    if (onRoverStateChange) onRoverStateChange(state);
  }, [onRoverStateChange]);

  const weatherConfig = useMemo(() => {
    switch (weatherPreset) {
      case 'overcast':
        return {
          skyColor: '#94A3B8',
          ambientColor: '#E2E8F0',
          ambientIntensity: 0.85,
          dirColor: '#CBD5E1',
          dirIntensity: 0.95,
          dirPos: [6, 14, 6],
          fogColor: '#94A3B8',
          fogDensity: 0.02,
        };
      case 'dusk':
        return {
          skyColor: '#FB923C',
          ambientColor: '#FED7AA',
          ambientIntensity: 0.55,
          dirColor: '#EA580C',
          dirIntensity: 1.25,
          dirPos: [14, 6, 8],
          fogColor: '#C2410C',
          fogDensity: 0.025,
        };
      case 'noon':
      default:
        return {
          skyColor: '#7DD3FC',
          ambientColor: '#E0F2FE',
          ambientIntensity: 0.75,
          dirColor: '#FFFBEB',
          dirIntensity: 1.6,
          dirPos: [10, 18, 10],
          fogColor: '#BAE6FD',
          fogDensity: 0.015,
        };
    }
  }, [weatherPreset]);

  const handlePlantClick = useCallback(
    (plantId) => {
      setSelectedId(plantId);
      if (onPlantSelect) onPlantSelect(plantId);
    },
    [onPlantSelect]
  );

  return (
    <Canvas
      shadows
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onPointerMissed={(e) => {
        // Double-click on empty space restores assembly
        if (isInspectMode && onAssembleAndResume && e.detail >= 2) {
          onAssembleAndResume();
        }
      }}
      onDoubleClick={(e) => {
        if (isInspectMode && onAssembleAndResume) {
          onAssembleAndResume();
        }
      }}
    >
      <PerspectiveCamera makeDefault position={[0, 6.5, 9.5]} fov={44} />
      <OrbitControls
        ref={controlsRef}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={2.0}
        maxDistance={25}
        dampingFactor={0.05}
        enableDamping
      />

      <CameraPresetController
        cameraPreset={cameraPreset}
        isInspectMode={isInspectMode}
        roverPosition={roverLivePos}
        roverHeading={roverLiveHeading}
        controlsRef={controlsRef}
      />

      <color attach="background" args={[weatherConfig.skyColor]} />
      <fogExp2 attach="fog" args={[weatherConfig.fogColor, weatherConfig.fogDensity]} />

      <ambientLight color={weatherConfig.ambientColor} intensity={weatherConfig.ambientIntensity} />
      <hemisphereLight skyColor={weatherConfig.skyColor} groundColor="#283E10" intensity={0.65} />
      <directionalLight
        position={weatherConfig.dirPos}
        intensity={weatherConfig.dirIntensity}
        color={weatherConfig.dirColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.00015}
      />

      <RealisticFarmland
        textures={textures}
        rowZCoords={rowZCoords}
        colXCoords={colXCoords}
        hideAllBadges={hideAllBadges || isInspectMode}
      />

      {/* 18 Crops with Elevated HUD Leader Lines & Mini-Pins */}
      {plants.map((p) => {
        const posX = colXCoords[p.col];
        const posZ = rowZCoords[p.row];
        const isCurrent = isAutonomous && p.id === activeWaypointId;

        return (
          <CropPlant
            key={p.id}
            plant={p}
            cropType={cropType}
            position={[posX, 0.16, posZ]}
            isSelected={selectedId === p.id}
            isHovered={hoveredId === p.id}
            isCurrentTarget={isCurrent}
            smartHudFocus={smartHudFocus}
            hideAllBadges={hideAllBadges || isInspectMode}
            onPointerOver={() => setHoveredId(p.id)}
            onPointerOut={() => setHoveredId(null)}
            onClick={() => handlePlantClick(p.id)}
          />
        );
      })}

      {/* Autonomous Robotic Rover */}
      <AutonomousRover
        plants={plants}
        roverSpeed={roverSpeed}
        nozzleOffset={nozzleOffset}
        isAutonomous={isAutonomous}
        isInspectMode={isInspectMode}
        selectedPartId={selectedPartId}
        chemicalUsed={chemicalUsed}
        onSelectPart={onSelectPart}
        onToggleInspect={onToggleInspect}
        hideAllBadges={hideAllBadges}
        onMissionLog={onMissionLog}
        onFrameCapture={onFrameCapture}
        onRoverStateChange={handleRoverStateUpdate}
        onCountdownChange={onCountdownChange}
        onPlantsScannedChange={onPlantsScannedChange}
        onPlantUpdate={onPlantUpdate}
        onPatrolComplete={onPatrolComplete}
        onSprayBannerChange={onSprayBannerChange}
        onActiveWaypointChange={setActiveWaypointId}
        onScannedPlantAdd={handleScannedPlantAdd}
        triggerRTH={triggerRTH}
        onResetRTH={onResetRTH}
        onProcessStatusChange={onProcessStatusChange}
        onRoverTelemetryChange={onRoverTelemetryChange}
      />
    </Canvas>
  );
}
