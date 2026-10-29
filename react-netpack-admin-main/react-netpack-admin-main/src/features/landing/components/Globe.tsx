import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

interface CityCoord {
  name: string
  code: string
  lat: number
  lon: number
  hub?: boolean
}

const CITIES: CityCoord[] = [
  { name: 'Kathmandu', code: 'KTM', lat: 27.7172, lon: 85.324, hub: true },
  { name: 'Dubai', code: 'DXB', lat: 25.2048, lon: 55.2708 },
  { name: 'Frankfurt', code: 'FRA', lat: 50.1109, lon: 8.6821 },
  { name: 'London', code: 'LHR', lat: 51.5074, lon: -0.1278 },
  { name: 'New York', code: 'JFK', lat: 40.7128, lon: -74.006 },
  { name: 'Tokyo', code: 'HND', lat: 35.6762, lon: 139.6503 },
  { name: 'Singapore', code: 'SIN', lat: 1.3521, lon: 103.8198 },
  { name: 'Sydney', code: 'SYD', lat: -33.8688, lon: 151.2093 },
]

const ROUTES = [
  { from: 'KTM', to: 'DXB' },
  { from: 'DXB', to: 'FRA' },
  { from: 'FRA', to: 'LHR' },
  { from: 'LHR', to: 'JFK' },
  { from: 'KTM', to: 'SIN' },
  { from: 'SIN', to: 'HND' },
  { from: 'SIN', to: 'SYD' },
]

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  const x = -(radius * Math.sin(phi) * Math.cos(theta))
  const z = radius * Math.sin(phi) * Math.sin(theta)
  const y = radius * Math.cos(phi)
  return new THREE.Vector3(x, y, z)
}

export const HeroGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth || 500
    const height = container.clientHeight || 500

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.z = 240

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const globeRadius = 75
    const globeGroup = new THREE.Group()
    scene.add(globeGroup)

    // 2. Base Dark Sphere
    const sphereGeo = new THREE.SphereGeometry(globeRadius, 64, 64)
    const sphereMat = new THREE.MeshPhongMaterial({
      color: 0x091422,
      emissive: 0x030810,
      specular: 0x2f6bff,
      shininess: 40,
      transparent: true,
      opacity: 0.94,
    })
    const baseSphere = new THREE.Mesh(sphereGeo, sphereMat)
    globeGroup.add(baseSphere)

    // 3. 3D Wireframe Grid Overlay
    const wireGeo = new THREE.SphereGeometry(globeRadius + 0.3, 36, 18)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x2f6bff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    })
    const wireMesh = new THREE.Mesh(wireGeo, wireMat)
    globeGroup.add(wireMesh)

    // 4. Dot Matrix Points on Globe Surface
    const dotCount = 1400
    const dotGeo = new THREE.BufferGeometry()
    const dotPositions: number[] = []

    for (let i = 0; i < dotCount; i++) {
      const lat = (Math.random() - 0.5) * 160
      const lon = (Math.random() - 0.5) * 360
      const pt = latLonToVector3(lat, lon, globeRadius + 0.6)
      dotPositions.push(pt.x, pt.y, pt.z)
    }

    dotGeo.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3))
    const dotMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 1.2,
      transparent: true,
      opacity: 0.6,
    })
    const pointCloud = new THREE.Points(dotGeo, dotMat)
    globeGroup.add(pointCloud)

    // 5. City Markers in 3D Space
    const cityCoordsMap = new Map<string, THREE.Vector3>()

    CITIES.forEach((city) => {
      const pos = latLonToVector3(city.lat, city.lon, globeRadius + 1.2)
      cityCoordsMap.set(city.code, pos)

      // Marker sphere
      const markerGeo = new THREE.SphereGeometry(city.hub ? 2.2 : 1.4, 16, 16)
      const markerMat = new THREE.MeshBasicMaterial({
        color: city.hub ? 0xff7a1a : 0x2f6bff,
      })
      const marker = new THREE.Mesh(markerGeo, markerMat)
      marker.position.copy(pos)
      globeGroup.add(marker)

      // Outer pulsing ring
      const ringGeo = new THREE.RingGeometry(2, 3.2, 24)
      const ringMat = new THREE.MeshBasicMaterial({
        color: city.hub ? 0xff7a1a : 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.copy(pos)
      ring.lookAt(new THREE.Vector3(0, 0, 0))
      globeGroup.add(ring)
    })

    // 6. 3D Flight Arcs between Cities
    const curveList: THREE.CatmullRomCurve3[] = []
    const particleList: { mesh: THREE.Mesh; curveIndex: number; progress: number; speed: number }[] = []

    ROUTES.forEach((route) => {
      const p1 = cityCoordsMap.get(route.from)
      const p2 = cityCoordsMap.get(route.to)
      if (!p1 || !p2) return

      // Midpoint arching outward into 3D space
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5)
      const distance = p1.distanceTo(p2)
      const altitude = distance * 0.28
      mid.setLength(globeRadius + altitude)

      const curve = new THREE.CatmullRomCurve3([p1, mid, p2])
      curveList.push(curve)

      // Tube/Line for the route
      const points = curve.getPoints(50)
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points)
      const lineMat = new THREE.LineDashedMaterial({
        color: 0x2f6bff,
        dashSize: 3,
        gapSize: 2,
        transparent: true,
        opacity: 0.6,
      })
      const line = new THREE.Line(lineGeo, lineMat)
      line.computeLineDistances()
      globeGroup.add(line)

      // Moving photon particle along curve
      const photonGeo = new THREE.SphereGeometry(1.2, 12, 12)
      const photonMat = new THREE.MeshBasicMaterial({ color: 0xff7a1a })
      const photon = new THREE.Mesh(photonGeo, photonMat)
      globeGroup.add(photon)

      particleList.push({
        mesh: photon,
        curveIndex: curveList.length - 1,
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.003,
      })
    })

    // 7. Outer Atmospheric Halo Glow
    const haloGeo = new THREE.SphereGeometry(globeRadius * 1.18, 48, 48)
    const haloMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          gl_FragColor = vec4(0.18, 0.42, 1.0, 1.0) * intensity * 0.55;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
    })
    const halo = new THREE.Mesh(haloGeo, haloMat)
    globeGroup.add(halo)

    // 8. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0x2f6bff, 1.8)
    dirLight.position.set(150, 100, 150)
    scene.add(dirLight)

    const pointLight = new THREE.PointLight(0xff7a1a, 1.2, 250)
    pointLight.position.set(-80, 60, 100)
    scene.add(pointLight)

    // 9. Initial orientation: center Kathmandu near front
    globeGroup.rotation.y = -Math.PI * 0.52
    globeGroup.rotation.x = 0.28

    // 10. Animation Loop
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)

      // Continuous 3D rotation
      globeGroup.rotation.y += 0.0022

      // Move transit photons along 3D curves
      particleList.forEach((item) => {
        item.progress = (item.progress + item.speed) % 1
        const curve = curveList[item.curveIndex]
        if (curve) {
          const pt = curve.getPointAt(item.progress)
          item.mesh.position.copy(pt)
        }
      })

      renderer.render(scene, camera)
    }

    animate()

    // 11. Responsive Resize
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth || 500
      const h = container.clientHeight || 500
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div className='relative w-full max-w-[560px] aspect-square mx-auto flex items-center justify-center select-none'>
      {/* Background ambient radial glow */}
      <div className='absolute inset-0 rounded-full bg-blue-600/15 blur-3xl pointer-events-none' />

      {/* Three.js Canvas Container */}
      <div ref={containerRef} className='w-full h-full relative z-10' />

      {/* Telemetry Badge */}
      <div className='absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0D1B2A]/90 border border-white/10 backdrop-blur-md text-[11px] font-mono tracking-wider text-slate-300'>
        <span className='w-2 h-2 rounded-full bg-[#FF7A1A] animate-ping' />
        <span>KTM GLOBAL 3D NETWORK ACTIVE</span>
      </div>
    </div>
  )
}
