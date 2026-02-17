import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import type { DieType } from '../../game/dice';
import { DIE_MAX } from '../../game/dice';
import './Dice.css';

interface DiceSceneProps {
  dieType: DieType;
  onResult: (value: number) => void;
  rolling: boolean;
  onRollStart: () => void;
}

export function DiceScene({ dieType, onResult, rolling, onRollStart }: DiceSceneProps) {
  const [result, setResult] = useState<number | null>(null);
  const [displayValue, setDisplayValue] = useState<number>(1);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!rolling) return;
    setAnimating(true);
    setResult(null);
    const max = DIE_MAX[dieType];
    const finalValue = Math.floor(Math.random() * max) + 1;

    let frame = 0;
    const totalFrames = 20;
    const interval = setInterval(() => {
      frame++;
      setDisplayValue(Math.floor(Math.random() * max) + 1);
      if (frame >= totalFrames) {
        clearInterval(interval);
        setDisplayValue(finalValue);
        setResult(finalValue);
        setAnimating(false);
        onResult(finalValue);
      }
    }, 60);
    return () => clearInterval(interval);
  }, [rolling, dieType, onResult]);

  const isNat20 = dieType === 'd20' && result === 20;
  const isNat1 = dieType === 'd20' && result === 1;
  const value = animating ? displayValue : (result ?? null);
  const label = value !== null ? String(value) : '';

  return (
    <div className="dice-scene-container">
      <div className={`dice-canvas-wrapper ${isNat20 ? 'crit-success' : ''} ${isNat1 ? 'crit-fail' : ''}`}>
        <Canvas
          camera={{ position: [0, 2.5, 4], fov: 45 }}
          shadows
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
          <directionalLight position={[-3, 4, -2]} intensity={0.4} color="#a78bfa" />
          <pointLight position={[0, 3, 0]} intensity={0.6} color="#d4a74a" />

          <Die3D dieType={dieType} animating={animating} label={label} isNat20={isNat20} isNat1={isNat1} />

          <ContactShadows position={[0, -1.2, 0]} opacity={0.5} scale={8} blur={2} far={4} />
          <Environment preset="night" />
        </Canvas>
      </div>

      <div className="dice-controls">
        {!rolling && result === null && (
          <button className="roll-button" onClick={onRollStart}>
            Roll {dieType.toUpperCase()}!
          </button>
        )}
        {result !== null && !animating && (
          <div className={`result-badge ${isNat20 ? 'crit' : ''} ${isNat1 ? 'fumble' : ''}`}>
            {isNat20 && <span className="crit-text">NATURAL 20! </span>}
            {isNat1 && <span className="fumble-text">NATURAL 1! </span>}
            <span className="result-number">{result}</span>
            <span className="result-max"> / {DIE_MAX[dieType]}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   3D Die Component — renders the correct polyhedron geometry
   with face numbers as textures
   ============================================================ */

const DIE_COLORS: Record<DieType, string> = {
  d4:  '#c0392b',
  d6:  '#2471a3',
  d8:  '#1e8449',
  d10: '#7d3c98',
  d12: '#b9770e',
  d20: '#6c3483',
};

const DIE_EMISSIVE: Record<DieType, string> = {
  d4:  '#3b0f0f',
  d6:  '#0e2a40',
  d8:  '#0d2e18',
  d10: '#2a1040',
  d12: '#3b2508',
  d20: '#240e38',
};

function Die3D({ dieType, animating, label, isNat20, isNat1 }: {
  dieType: DieType; animating: boolean; label: string; isNat20: boolean; isNat1: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const targetRotation = useRef(new THREE.Euler(0, 0, 0));
  const spinSpeed = useRef(new THREE.Vector3(0, 0, 0));
  const animTime = useRef(0);

  // Create geometry based on die type
  const geometry = useMemo(() => {
    switch (dieType) {
      case 'd4':  return new THREE.TetrahedronGeometry(1.1, 0);
      case 'd6':  return new THREE.BoxGeometry(1.3, 1.3, 1.3);
      case 'd8':  return new THREE.OctahedronGeometry(1.1, 0);
      case 'd10': return new THREE.DodecahedronGeometry(1.0, 0); // approximation
      case 'd12': return new THREE.DodecahedronGeometry(1.0, 0);
      case 'd20': return new THREE.IcosahedronGeometry(1.15, 0);
    }
  }, [dieType]);

  // Create texture with the current number
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Transparent background
    ctx.clearRect(0, 0, 256, 256);

    if (label) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 120px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText(label, 128, 128);

      // Underline 6 and 9 to distinguish them
      if (label === '6' || label === '9') {
        ctx.fillRect(88, 200, 80, 6);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [label]);

  // Start spin when animating
  useEffect(() => {
    if (animating) {
      animTime.current = 0;
      spinSpeed.current.set(
        8 + Math.random() * 10,
        8 + Math.random() * 10,
        4 + Math.random() * 6,
      );
      // Pick a random end rotation
      targetRotation.current.set(
        Math.random() * Math.PI * 4,
        Math.random() * Math.PI * 4,
        Math.random() * Math.PI * 2,
      );
    }
  }, [animating]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const mesh = meshRef.current;

    if (animating) {
      animTime.current += delta;
      const t = Math.min(animTime.current / 1.2, 1); // 1.2 second animation
      const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic

      // Spin fast at start, slow down
      const speed = 1 - ease;
      mesh.rotation.x += spinSpeed.current.x * delta * speed;
      mesh.rotation.y += spinSpeed.current.y * delta * speed;
      mesh.rotation.z += spinSpeed.current.z * delta * speed;

      // Bounce: up then settle
      const bounce = Math.sin(t * Math.PI) * (1 - t) * 1.5;
      mesh.position.y = bounce;
      mesh.scale.setScalar(0.5 + ease * 0.5);
    } else {
      // Gentle idle rotation
      mesh.rotation.y += delta * 0.3;
      mesh.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
      mesh.position.y = Math.sin(Date.now() * 0.002) * 0.05;
    }
  });

  const color = DIE_COLORS[dieType];
  const emissiveColor = isNat20 ? '#ffd700' : isNat1 ? '#ff2222' : DIE_EMISSIVE[dieType];
  const emissiveIntensity = isNat20 ? 0.6 : isNat1 ? 0.5 : 0.15;

  return (
    <mesh ref={meshRef} geometry={geometry} castShadow>
      <meshPhysicalMaterial
        color={color}
        emissive={emissiveColor}
        emissiveIntensity={emissiveIntensity}
        metalness={0.1}
        roughness={0.2}
        clearcoat={1}
        clearcoatRoughness={0.1}
        transmission={0.15}
        thickness={0.5}
        ior={1.5}
        envMapIntensity={1.5}
        map={texture}
      />
    </mesh>
  );
}
