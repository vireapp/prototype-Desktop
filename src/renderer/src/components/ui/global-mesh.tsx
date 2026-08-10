'use client'
import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useTheme } from 'next-themes'

function GlobePoints() {
  const ref = useRef<THREE.Points>(null!)
  const { theme } = useTheme()

  const particleCount = 2000
  const positions = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      // Uniform distribution on sphere surface
      const phi = Math.acos(-1 + (2 * i) / particleCount)
      const theta = Math.sqrt(particleCount * Math.PI) * phi

      const r = 1.2
      positions[i * 3] = r * Math.cos(theta) * Math.sin(phi)
      positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    return positions
  }, [])

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.1
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2
    }
  })

  const color = theme === 'dark' ? '#ffffff' : '#000000'
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={color}
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
          opacity={0.6}
        />
      </Points>
    </group>
  )
}

function ConnectionLines() {
  const ref = useRef<THREE.LineSegments>(null!)
  const { theme } = useTheme()
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.1
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2
    }
  })

  const geometry = useMemo(() => {
    const lineCount = 100
    const points: THREE.Vector3[] = []
    for (let i = 0; i < lineCount; i++) {
      const p1 = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize()
        .multiplyScalar(1.2)
      const p2 = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
        .normalize()
        .multiplyScalar(1.2)
      points.push(p1)
      points.push(p2)
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [])

  const color = theme === 'dark' ? '#8b5cf6' : '#6d28d9' // Purple accent
  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      {geometry && (
        <lineSegments ref={ref} geometry={geometry}>
          <lineBasicMaterial color={color} transparent opacity={0.3} />
        </lineSegments>
      )}
    </group>
  )
}

export function GlobalMesh() {
  return (
    <div className="w-full h-full min-h-[600px] absolute inset-0 -z-10 opacity-40 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 2.5] }} gl={{ alpha: true }}>
        <GlobePoints />
        <ConnectionLines />
      </Canvas>
    </div>
  )
}
