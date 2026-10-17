'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const CARDS = 16;

// Branco: o painel é colorido (primary no claro, roxo escuro no escuro), então o branco serve aos dois.
const color = new THREE.Color('#ffffff');

const twinkleVert = /* glsl */ `
  attribute float aPhase;
  uniform float uTime;
  varying float vA;
  void main() {
    vA = 0.25 + 0.75 * (0.5 + 0.5 * sin(uTime * 1.5 + aPhase * 6.2831));
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = (1.5 + 3.0 * fract(aPhase * 7.0)) * (9.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const twinkleFrag = /* glsl */ `
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(1.0, 1.0, 1.0, vA * (1.0 - d * 2.0));
  }
`;
const twinkleUniforms = { uTime: { value: 0 } };

function Scene({ running }: { running: boolean }) {
  const root = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const inner = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Group>(null);
  const cards = useRef<THREE.InstancedMesh>(null);
  const dust = useRef<THREE.Points>(null);
  const rings = useRef<THREE.Group>(null);
  const twinkle = useRef<THREE.ShaderMaterial>(null);
  const nodeGeo = useMemo(() => new THREE.IcosahedronGeometry(1.6, 1), []);

  const dustGeo = useMemo(() => {
    const n = 700;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // casca esférica entre raio 5 e 11
      const r = 5 + Math.random() * 6;
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(2 * Math.random() - 1);
      pos.set([r * Math.sin(b) * Math.cos(a), r * Math.cos(b), r * Math.sin(b) * Math.sin(a)], i * 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aPhase', new THREE.BufferAttribute(Float32Array.from({ length: n }, Math.random), 1));
    return g;
  }, []);

  // cartões ("inscrições") em órbita, todos virados para o centro
  useEffect(() => {
    const o = new THREE.Object3D();
    for (let i = 0; i < CARDS; i++) {
      const a = (i / CARDS) * Math.PI * 2;
      o.position.set(Math.cos(a) * 3.6, Math.sin(a * 3) * 0.6, Math.sin(a) * 3.6);
      o.lookAt(0, 0, 0);
      o.updateMatrix();
      cards.current?.setMatrixAt(i, o.matrix);
    }
    if (cards.current) cards.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ pointer, clock, camera }, dt) => {
    if (!running) return;
    const t = clock.elapsedTime;
    // entrada: câmera se aproxima e assenta em z=9
    camera.position.z += (9 - camera.position.z) * 0.03;
    if (rings.current) {
      rings.current.rotation.x = t * 0.25;
      rings.current.rotation.y = t * 0.15;
    }
    if (twinkle.current) twinkle.current.uniforms.uTime.value = t;
    if (root.current) {
      // inclina para o ponteiro com amortecimento
      root.current.rotation.x += (-pointer.y * 0.5 - root.current.rotation.x) * 0.05;
      root.current.rotation.y += (pointer.x * 0.7 - root.current.rotation.y) * 0.05;
    }
    if (core.current) {
      core.current.rotation.x += dt * 0.25;
      core.current.rotation.y += dt * 0.35;
      core.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.04);
    }
    if (inner.current) {
      inner.current.rotation.x -= dt * 0.4;
      inner.current.rotation.z += dt * 0.3;
    }
    if (ring.current) {
      ring.current.rotation.y += dt * 0.18;
      ring.current.rotation.z = Math.sin(t * 0.3) * 0.12;
    }
    if (dust.current) dust.current.rotation.y -= dt * 0.03;
  });

  return (
    <group ref={root}>
      <mesh ref={core}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.85} />
      </mesh>
      <mesh ref={inner}>
        <octahedronGeometry args={[0.9, 0]} />
        <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
      </mesh>
      <group ref={ring}>
        <instancedMesh ref={cards} args={[undefined, undefined, CARDS]}>
          <planeGeometry args={[0.55, 0.72]} />
          <meshBasicMaterial color={color} transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
        </instancedMesh>
      </group>
      {/* nós brilhantes nos vértices do núcleo */}
      <points geometry={nodeGeo}>
        <pointsMaterial color={color} size={0.09} transparent opacity={0.95} depthWrite={false} />
      </points>
      {/* anéis finos em órbita inclinada */}
      <group ref={rings}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.3, 0.008, 8, 128]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
        <mesh rotation={[Math.PI / 2.6, 0.5, 0]}>
          <torusGeometry args={[2.9, 0.006, 8, 128]} />
          <meshBasicMaterial color={color} transparent opacity={0.35} />
        </mesh>
      </group>
      {/* poeira que cintila: tamanho e fase variam por partícula */}
      <points ref={dust} geometry={dustGeo}>
        <shaderMaterial
          ref={twinkle}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={twinkleUniforms}
          vertexShader={twinkleVert}
          fragmentShader={twinkleFrag}
        />
      </points>
    </group>
  );
}

/** Cena 3D do login: núcleo de wireframe, cartões em órbita e poeira. Frame único com reduced-motion. */
export default function LoginScene() {
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <div className="absolute inset-0 animate-[fadeIn_1.6s_ease-out_both] opacity-60" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.5, 16], fov: 50 }}
        frameloop={reduced ? 'demand' : 'always'}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      >
        <Scene running={!reduced} />
      </Canvas>
    </div>
  );
}
