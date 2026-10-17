'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { useInView } from 'react-intersection-observer';
import * as THREE from 'three';
import { useTheme } from '@/components/theme/ThemeProvider';

const vertexShader = /* glsl */ `
  uniform float uTime;
  varying float vH;
  void main() {
    vec3 p = position;
    float h = sin(p.x * 0.6 + uTime * 0.6) * 0.5 + cos(p.z * 0.5 + uTime * 0.45) * 0.5;
    p.y += h * 0.9;
    vH = h;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = 2.2 * (14.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vH;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(uColor, 0.35 + 0.4 * (vH * 0.5 + 0.5));
  }
`;

function Field({ running }: { running: boolean }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const geometry = useMemo(() => {
    const n = 90;
    const pos = new Float32Array(n * n * 3);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const k = (i * n + j) * 3;
        pos[k] = (i / (n - 1) - 0.5) * 26;
        pos[k + 2] = (j / (n - 1) - 0.5) * 26;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color('#55761c') } }),
    [],
  );

  const { theme } = useTheme();
  useEffect(() => {
    // lê o --primary do tema atual para a cena acompanhar claro/escuro
    const c = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    if (c) uniforms.uColor.value.set(c);
  }, [theme, uniforms]);

  useFrame(({ camera, pointer }, dt) => {
    if (!running) return;
    if (mat.current) mat.current.uniforms.uTime.value += dt;
    // parallax suave: a câmera segue o ponteiro
    camera.position.x += (pointer.x * 1.2 - camera.position.x) * 0.04;
    camera.position.y += (4 + pointer.y * 0.6 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);
  });

  return (
    <points geometry={geometry} rotation={[0.35, 0, 0]}>
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

/** Campo de pontos ondulante. Pausa fora da tela; frame único com reduced-motion. */
export default function HeroScene() {
  const { ref, inView } = useInView();
  const reduced =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div ref={ref} className="absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 4, 11], fov: 50 }}
        frameloop={inView && !reduced ? 'always' : 'demand'}
        gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
      >
        <Field running={inView && !reduced} />
      </Canvas>
    </div>
  );
}
