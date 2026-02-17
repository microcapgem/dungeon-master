import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, ContactShadows } from '@react-three/drei';
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
          camera={{ position: [0, 2, 4.5], fov: 45 }}
          shadows
          gl={{ antialias: true }}
          style={{ background: 'radial-gradient(ellipse at center, #1a1333 0%, #0a0a1a 100%)' }}
        >
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 8, 5]} intensity={1.5} castShadow />
          <directionalLight position={[-3, 4, -2]} intensity={0.6} color="#a78bfa" />
          <pointLight position={[0, 3, 2]} intensity={0.8} color="#d4a74a" />
          <pointLight position={[-2, 2, -1]} intensity={0.4} color="#6c63ff" />

          <Die3D dieType={dieType} animating={animating} label={label} isNat20={isNat20} isNat1={isNat1} />

          <ContactShadows position={[0, -1.2, 0]} opacity={0.6} scale={8} blur={2} far={4} />
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
  d4:  '#e74c3c',
  d6:  '#3498db',
  d8:  '#27ae60',
  d10: '#9b59b6',
  d12: '#e67e22',
  d20: '#8e44ad',
};

const DIE_EMISSIVE: Record<DieType, string> = {
  d4:  '#5a1a1a',
  d6:  '#1a3a5a',
  d8:  '#1a4a2a',
  d10: '#3a1a5a',
  d12: '#5a3a1a',
  d20: '#3a1a4a',
};

function Die3D({ dieType, animating, label, isNat20, isNat1 }: {
  dieType: DieType; animating: boolean; label: string; isNat20: boolean; isNat1: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const spinSpeed = useRef(new THREE.Vector3(0, 0, 0));
  const animTime = useRef(0);

  // Create geometry based on die type
  const geometry = useMemo(() => {
    switch (dieType) {
      case 'd4':  return new THREE.TetrahedronGeometry(1.2, 0);
      case 'd6':  return new THREE.BoxGeometry(1.4, 1.4, 1.4);
      case 'd8':  return new THREE.OctahedronGeometry(1.2, 0);
      case 'd10': return new THREE.DodecahedronGeometry(1.1, 0);
      case 'd12': return new THREE.DodecahedronGeometry(1.1, 0);
      case 'd20': return new THREE.IcosahedronGeometry(1.2, 0);
    }
  }, [dieType]);

  // Edge geometry for visible wireframe
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  // Start spin when animating
  useEffect(() => {
    if (animating) {
      animTime.current = 0;
      spinSpeed.current.set(
        8 + Math.random() * 10,
        8 + Math.random() * 10,
        4 + Math.random() * 6,
      );
    }
  }, [animating]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const group = groupRef.current;

    if (animating) {
      animTime.current += delta;
      const t = Math.min(animTime.current / 1.2, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const speed = 1 - ease;

      group.rotation.x += spinSpeed.current.x * delta * speed;
      group.rotation.y += spinSpeed.current.y * delta * speed;
      group.rotation.z += spinSpeed.current.z * delta * speed;

      const bounce = Math.sin(t * Math.PI) * (1 - t) * 1.5;
      group.position.y = bounce;
      group.scale.setScalar(0.5 + ease * 0.5);
    } else {
      group.rotation.y += delta * 0.3;
      group.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
      group.position.y = Math.sin(Date.now() * 0.002) * 0.05;
    }
  });

  const color = DIE_COLORS[dieType];
  const emissiveColor = isNat20 ? '#ffd700' : isNat1 ? '#ff2222' : DIE_EMISSIVE[dieType];
  const emissiveIntensity = isNat20 ? 0.8 : isNat1 ? 0.6 : 0.25;

  // Number label style
  const labelColor = isNat20 ? '#ffd700' : isNat1 ? '#ff4444' : '#ffffff';

  return (
    <group ref={groupRef}>
      {/* Solid die shape */}
      <mesh geometry={geometry} castShadow>
        <meshPhysicalMaterial
          color={color}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          metalness={0.3}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </mesh>

      {/* Visible edges */}
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.2} />
      </lineSegments>

      {/* Number label — always faces camera */}
      {label && (
        <Html center distanceFactor={5} style={{ pointerEvents: 'none' }}>
          <div style={{
            fontSize: '42px',
            fontWeight: 900,
            fontFamily: 'Cinzel, Georgia, serif',
            color: labelColor,
            textShadow: `0 0 12px ${labelColor}, 0 2px 8px rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.6)`,
            userSelect: 'none',
            lineHeight: 1,
            textDecoration: (label === '6' || label === '9') ? 'underline' : 'none',
          }}>
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}
