"use client"

import { useRef, useMemo, useState } from "react"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { OrbitControls, Stars, Html } from "@react-three/drei"
import * as THREE from "three"
import type { IptvCountry } from "@/lib/types"

const RADIUS = 2

function latLngToVec3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

function Atmosphere() {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { c: { value: 0.4 }, p: { value: 4.5 } },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec3 vNormal;
        uniform float c;
        uniform float p;
        void main() {
          float intensity = pow(c - dot(vNormal, vec3(0.0, 0.0, 1.0)), p);
          gl_FragColor = vec4(0.35, 0.55, 1.0, 1.0) * intensity;
        }`,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
    })
  }, [])
  return (
    <mesh scale={1.18} material={material}>
      <sphereGeometry args={[RADIUS, 64, 64]} />
    </mesh>
  )
}

function Earth({
  autoRotate,
  countries,
  onSelect,
  onHover,
  selectedSlug,
}: {
  autoRotate: boolean
  countries: IptvCountry[]
  onSelect?: (c: IptvCountry) => void
  onHover?: (c: IptvCountry | null) => void
  selectedSlug?: string
}) {
  const group = useRef<THREE.Group>(null)
  const texture = useLoader(THREE.TextureLoader, "/textures/earth-night.png")
  const [hovered, setHovered] = useState<string | null>(null)

  useFrame((_, delta) => {
    if (group.current && autoRotate) {
      group.current.rotation.y += delta * 0.06
    }
  })

  const markers = useMemo(
    () => countries.map((c) => ({ c, pos: latLngToVec3(c.lat, c.lng, RADIUS + 0.02) })),
    [countries],
  )

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={texture}
          emissiveMap={texture}
          emissive={new THREE.Color(0xffffff)}
          emissiveIntensity={0.55}
          metalness={0.1}
          roughness={0.9}
        />
      </mesh>

      {markers.map(({ c, pos }) => {
        const active = hovered === c.slug || selectedSlug === c.slug
        return (
          <group key={c.slug} position={pos}>
            <mesh
              onPointerOver={(e) => {
                e.stopPropagation()
                setHovered(c.slug)
                onHover?.(c)
                document.body.style.cursor = "pointer"
              }}
              onPointerOut={() => {
                setHovered(null)
                onHover?.(null)
                document.body.style.cursor = "auto"
              }}
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.(c)
              }}
            >
              <sphereGeometry args={[active ? 0.05 : 0.03, 16, 16]} />
              <meshBasicMaterial color={active ? "#a78bfa" : "#60a5fa"} />
            </mesh>
            <mesh>
              <ringGeometry args={[0.06, 0.09, 24]} />
              <meshBasicMaterial
                color={active ? "#a78bfa" : "#60a5fa"}
                transparent
                opacity={active ? 0.9 : 0.4}
                side={THREE.DoubleSide}
              />
            </mesh>
            {active && (
              <Html center distanceFactor={8} zIndexRange={[10, 0]} style={{ pointerEvents: "none" }}>
                <div className="whitespace-nowrap rounded-lg border border-white/15 bg-black/80 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                  {c.flag} {c.name}
                </div>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}

export default function GlobeScene({
  interactive = true,
  autoRotate = true,
  countries,
  onSelect,
  onHover,
  selectedSlug,
}: {
  interactive?: boolean
  autoRotate?: boolean
  countries: IptvCountry[]
  onSelect?: (c: IptvCountry) => void
  onHover?: (c: IptvCountry | null) => void
  selectedSlug?: string
}) {
  return (
    <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} dpr={[1, 2]} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1.2} />
      <Stars radius={80} depth={40} count={2500} factor={4} saturation={0} fade speed={1} />
      <Earth autoRotate={autoRotate} countries={countries} onSelect={onSelect} onHover={onHover} selectedSlug={selectedSlug} />
      <Atmosphere />
      {interactive && (
        <OrbitControls
          enablePan={false}
          enableZoom={interactive}
          minDistance={4}
          maxDistance={9}
          rotateSpeed={0.5}
          autoRotate={false}
        />
      )}
    </Canvas>
  )
}
