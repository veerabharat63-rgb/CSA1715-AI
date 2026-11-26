import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Procedural 3D Mist Burst Particle System
 * Simulates high-pressure agricultural nozzle atomization (droplets 100-200 microns)
 */
export default function SprayParticles({ position = [0, 0, 0], active = true }) {
  const pointsRef = useRef();
  const count = 120;

  const [positions, velocities, opacities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const op = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Start near nozzle
      pos[i * 3] = position[0] + (Math.random() - 0.5) * 0.15;
      pos[i * 3 + 1] = position[1] + (Math.random() - 0.5) * 0.1;
      pos[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 0.15;

      // Downward conical spray vector
      const spread = 0.25;
      vel[i * 3] = (Math.random() - 0.5) * spread;
      vel[i * 3 + 1] = -0.8 - Math.random() * 0.8; // Downward velocity
      vel[i * 3 + 2] = (Math.random() - 0.5) * spread;

      op[i] = Math.random();
    }
    return [pos, vel, op];
  }, [position]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !active) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const posArr = posAttr.array;

    for (let i = 0; i < count; i++) {
      posArr[i * 3] += velocities[i * 3] * delta * 2.5;
      posArr[i * 3 + 1] += velocities[i * 3 + 1] * delta * 2.5;
      posArr[i * 3 + 2] += velocities[i * 3 + 2] * delta * 2.5;

      // Reset when below ground plane
      if (posArr[i * 3 + 1] < 0.05) {
        posArr[i * 3] = position[0] + (Math.random() - 0.5) * 0.15;
        posArr[i * 3 + 1] = position[1];
        posArr[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 0.15;
      }
    }
    posAttr.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#38BDF8"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
