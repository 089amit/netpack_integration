import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { LANDING_CONFIG } from '../config'
import { Clock, CheckCircle2 } from 'lucide-react'

export const ShipmentJourney: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  const stages = LANDING_CONFIG.stages
  const currentStage = stages[activeStageIndex]
  const isDarkScene = currentStage.theme === 'dark'

  // Ref to hold mutable progress for Three.js render loop without re-triggering effects
  const progressRef = useRef(0)

  // Scroll listener that updates progress through the pinned journey
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const totalHeight = sectionRef.current.offsetHeight
      const viewportHeight = window.innerHeight

      // Calculate progress 0.0 to 1.0 through the journey section
      const startOffset = viewportHeight * 0.4
      const scrolled = -rect.top + startOffset
      const maxScroll = totalHeight - viewportHeight * 0.4

      const p = Math.min(1, Math.max(0, scrolled / maxScroll))
      progressRef.current = p
      setScrollProgress(p)

      const stageIdx = Math.min(stages.length - 1, Math.floor(p * stages.length))
      setActiveStageIndex(stageIdx)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [stages.length])

  // Scroll directly to a specific stage on dot click
  const scrollToStage = (stageIdx: number) => {
    if (!sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const sectionTop = rect.top + scrollTop
    const totalHeight = sectionRef.current.offsetHeight
    const viewportHeight = window.innerHeight

    const targetRatio = (stageIdx + 0.1) / stages.length
    const targetScrollY = sectionTop + targetRatio * (totalHeight - viewportHeight * 0.4) - viewportHeight * 0.3
    window.scrollTo({ top: targetScrollY, behavior: 'smooth' })
  }

  // =========================================================================
  // Three.js 3D WebGL Realistic Animation Engine
  // =========================================================================
  useEffect(() => {
    const container = canvasContainerRef.current
    if (!container) return

    const width = container.clientWidth || 600
    const height = container.clientHeight || 450

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(0, 5, 28)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.0)
    mainKeyLight.position.set(20, 30, 25)
    mainKeyLight.castShadow = true
    mainKeyLight.shadow.mapSize.width = 1024
    mainKeyLight.shadow.mapSize.height = 1024
    mainKeyLight.shadow.bias = -0.001
    scene.add(mainKeyLight)

    const blueRimLight = new THREE.PointLight(0x2f6bff, 3.5, 60)
    blueRimLight.position.set(-20, 15, -10)
    scene.add(blueRimLight)

    const orangeAccentLight = new THREE.PointLight(0xff7a1a, 2.5, 50)
    orangeAccentLight.position.set(15, -5, 15)
    scene.add(orangeAccentLight)

    // 3. Realistic 3D Cardboard Parcel Box
    // Create high-res canvas textures for realistic cardboard, tape, and shipping label
    const labelCanvas = document.createElement('canvas')
    labelCanvas.width = 512
    labelCanvas.height = 340
    const ctx = labelCanvas.getContext('2d')
    if (ctx) {
      // Kraft paper background
      ctx.fillStyle = '#D49B6A'
      ctx.fillRect(0, 0, 512, 340)

      // Packaging tape running down the middle
      ctx.fillStyle = 'rgba(246, 216, 96, 0.85)'
      ctx.fillRect(216, 0, 80, 340)

      // White thermal shipping label
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.roundRect(40, 50, 220, 240, 10)
      ctx.fill()

      // NetPack Wordmark on label
      ctx.fillStyle = '#0D1B2A'
      ctx.font = 'bold 26px "Space Grotesk", sans-serif'
      ctx.fillText('NETPACK', 55, 90)

      ctx.fillStyle = '#FF7A1A'
      ctx.font = 'bold 16px "Space Grotesk", sans-serif'
      ctx.fillText('PRIORITY AIR', 180, 90)

      // Divider line
      ctx.strokeStyle = '#CBD5E1'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(55, 105)
      ctx.lineTo(240, 105)
      ctx.stroke()

      // Destination code
      ctx.fillStyle = '#0D1B2A'
      ctx.font = 'bold 36px monospace'
      ctx.fillText('LHR - EXP', 55, 150)

      // Barcode lines
      const barX = 55
      const barY = 175
      const barH = 50
      const barWidths = [4, 2, 6, 2, 8, 3, 5, 2, 7, 3, 5, 2, 8, 4, 3, 6, 2, 7, 4, 2]
      let curX = barX
      ctx.fillStyle = '#0D1B2A'
      barWidths.forEach((bw) => {
        ctx.fillRect(curX, barY, bw, barH)
        curX += bw + 3
      })

      ctx.font = '12px monospace'
      ctx.fillText('* NP-7482-9012-KTM *', 60, 245)
    }

    const boxTexture = new THREE.CanvasTexture(labelCanvas)
    boxTexture.anisotropy = 8

    // Box Geometry with dimensions: 10 x 7.5 x 8
    const boxGeo = new THREE.BoxGeometry(10, 7.5, 8)
    const boxMat = new THREE.MeshStandardMaterial({
      map: boxTexture,
      roughness: 0.72,
      metalness: 0.05,
    })

    const parcelGroup = new THREE.Group()
    const parcelMesh = new THREE.Mesh(boxGeo, boxMat)
    parcelMesh.castShadow = true
    parcelMesh.receiveShadow = true
    parcelGroup.add(parcelMesh)
    scene.add(parcelGroup)

    // Contact Shadow / Floor Pedestal
    const shadowGeo = new THREE.PlaneGeometry(24, 24)
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 })
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat)
    shadowPlane.rotation.x = -Math.PI / 2
    shadowPlane.position.y = -5.5
    shadowPlane.receiveShadow = true
    scene.add(shadowPlane)

    // 4. Stage 1 Visual: 3D Holographic Blue Laser Scanner Plane
    const laserGeo = new THREE.PlaneGeometry(14, 0.25)
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    })
    const laserPlane = new THREE.Mesh(laserGeo, laserMat)
    laserPlane.rotation.x = Math.PI / 2
    laserPlane.position.y = 5
    scene.add(laserPlane)

    // 5. Stage 2 Visual: 3D Customs Clearance Arch & Green Shield Ring
    const archGeo = new THREE.TorusGeometry(8, 0.4, 16, 48, Math.PI)
    const archMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2,
    })
    const customsArch = new THREE.Mesh(archGeo, archMat)
    customsArch.position.set(0, 0, -2)
    customsArch.visible = false
    scene.add(customsArch)

    const greenStampGeo = new THREE.RingGeometry(3.5, 4.8, 32)
    const greenStampMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    })
    const greenStamp = new THREE.Mesh(greenStampGeo, greenStampMat)
    greenStamp.position.set(0, 6, 2)
    scene.add(greenStamp)

    // 6. Stage 3 Visual: 3D Starfield & Jetstream Trails
    const starCount = 350
    const starGeo = new THREE.BufferGeometry()
    const starPositions: number[] = []
    for (let i = 0; i < starCount; i++) {
      starPositions.push((Math.random() - 0.5) * 120, (Math.random() - 0.5) * 80, (Math.random() - 0.5) * 80)
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      transparent: true,
      opacity: 0,
    })
    const starField = new THREE.Points(starGeo, starMat)
    scene.add(starField)

    // 3D Airplane Silhouette / Wing Winglet
    const wingGeo = new THREE.ConeGeometry(5, 14, 3)
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.5,
      roughness: 0.3,
    })
    const airplaneWing = new THREE.Mesh(wingGeo, wingMat)
    airplaneWing.rotation.z = Math.PI / 2.3
    airplaneWing.position.set(16, 8, -12)
    airplaneWing.visible = false
    scene.add(airplaneWing)

    // 7. Stage 5 Visual: 3D Delivery Van / Asphalt Road
    const roadGeo = new THREE.PlaneGeometry(50, 16)
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
    const roadMesh = new THREE.Mesh(roadGeo, roadMat)
    roadMesh.rotation.x = -Math.PI / 2
    roadMesh.position.set(0, -5.6, 0)
    roadMesh.visible = false
    scene.add(roadMesh)

    // 3D GPS Map Pin floating above parcel in Stage 5
    const pinGroup = new THREE.Group()
    const pinHeadGeo = new THREE.SphereGeometry(1.5, 24, 24)
    const pinHeadMat = new THREE.MeshStandardMaterial({
      color: 0xff7a1a,
      emissive: 0xff7a1a,
      emissiveIntensity: 0.4,
    })
    const pinHead = new THREE.Mesh(pinHeadGeo, pinHeadMat)
    const pinConeGeo = new THREE.ConeGeometry(1.2, 2.2, 16)
    const pinCone = new THREE.Mesh(pinConeGeo, pinHeadMat)
    pinCone.rotation.x = Math.PI
    pinCone.position.y = -1.3
    pinGroup.add(pinHead)
    pinGroup.add(pinCone)
    pinGroup.position.set(0, 8, 0)
    pinGroup.visible = false
    scene.add(pinGroup)

    // 8. Stage 6 Visual: 3D Confetti Burst Particles
    const confettiCount = 180
    const confettiGeo = new THREE.BufferGeometry()
    const confettiPos: number[] = []
    const confettiColors: number[] = []
    const colorChoices = [
      new THREE.Color(0xff7a1a),
      new THREE.Color(0x2f6bff),
      new THREE.Color(0x10b981),
      new THREE.Color(0xfbbf24),
    ]

    for (let i = 0; i < confettiCount; i++) {
      confettiPos.push((Math.random() - 0.5) * 25, (Math.random() - 0.5) * 20 + 2, (Math.random() - 0.5) * 25)
      const c = colorChoices[i % colorChoices.length]
      confettiColors.push(c.r, c.g, c.b)
    }

    confettiGeo.setAttribute('position', new THREE.Float32BufferAttribute(confettiPos, 3))
    confettiGeo.setAttribute('color', new THREE.Float32BufferAttribute(confettiColors, 3))
    const confettiMat = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0,
    })
    const confetti = new THREE.Points(confettiGeo, confettiMat)
    scene.add(confetti)

    // 9. Continuous Animation Loop Tied to Scroll Progress
    let animId: number
    let clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()
      const p = progressRef.current // 0.0 -> 1.0

      // Map progress p (0 to 1) into smooth 6-stage interpolation:
      // Stage 0: 0.00 - 0.16 (Packing)
      // Stage 1: 0.16 - 0.33 (Customs Export)
      // Stage 2: 0.33 - 0.50 (Departure / Flight)
      // Stage 3: 0.50 - 0.66 (Destination Customs)
      // Stage 4: 0.66 - 0.83 (Out for Delivery)
      // Stage 5: 0.83 - 1.00 (Delivered)

      if (p < 0.17) {
        // --- STAGE 1: PACKING ---
        const localT = p / 0.17
        parcelGroup.position.lerp(new THREE.Vector3(0, -1 + Math.sin(elapsedTime * 2) * 0.2, 0), 0.1)
        parcelGroup.rotation.x = THREE.MathUtils.lerp(0.4, 0.2, localT)
        parcelGroup.rotation.y = THREE.MathUtils.lerp(-0.5, 0.5, localT)
        parcelGroup.rotation.z = 0

        // Laser scan line sweeps vertically across the box
        laserPlane.visible = true
        laserPlane.position.y = Math.sin(elapsedTime * 4) * 3 + 0.5
        laserPlane.position.z = 4.2

        customsArch.visible = false
        greenStampMat.opacity = 0
        starMat.opacity = 0
        airplaneWing.visible = false
        roadMesh.visible = false
        pinGroup.visible = false
        confettiMat.opacity = 0
      } else if (p < 0.34) {
        // --- STAGE 2: CUSTOMS CLEARANCE ---
        const localT = (p - 0.17) / 0.17
        laserPlane.visible = false

        // Box slides on conveyor through the customs arch
        parcelGroup.position.lerp(new THREE.Vector3(THREE.MathUtils.lerp(-5, 5, localT), -1, 0), 0.1)
        parcelGroup.rotation.x = 0.2
        parcelGroup.rotation.y = -0.3
        parcelGroup.rotation.z = 0

        customsArch.visible = true
        customsArch.position.x = 0

        // Green stamp slams down over box
        greenStamp.visible = true
        greenStamp.position.set(0, 3, 3)
        greenStampMat.opacity = THREE.MathUtils.lerp(0, 0.95, Math.min(1, localT * 2))

        starMat.opacity = 0
        airplaneWing.visible = false
        roadMesh.visible = false
        pinGroup.visible = false
        confettiMat.opacity = 0
      } else if (p < 0.51) {
        // --- STAGE 3: SHIPMENT DEPARTURE (NIGHT FLIGHT) ---
        const localT = (p - 0.34) / 0.17
        customsArch.visible = false
        greenStampMat.opacity = 0

        // Parcel climbs and banks like an aircraft in flight
        parcelGroup.position.lerp(new THREE.Vector3(0, 2 + Math.sin(elapsedTime * 3) * 0.4, 2), 0.1)
        parcelGroup.rotation.x = THREE.MathUtils.lerp(0.1, -0.3, localT)
        parcelGroup.rotation.y = THREE.MathUtils.lerp(0.5, 0.9, localT)
        parcelGroup.rotation.z = -0.25 + Math.sin(elapsedTime * 2) * 0.08 // banking

        // Starfield brightens
        starMat.opacity = THREE.MathUtils.lerp(0.2, 0.9, localT)
        airplaneWing.visible = true
        airplaneWing.position.x = 14 + Math.sin(elapsedTime * 2) * 0.5

        roadMesh.visible = false
        pinGroup.visible = false
        confettiMat.opacity = 0
      } else if (p < 0.68) {
        // --- STAGE 4: CLEARANCE AT DESTINATION ---
        const localT = (p - 0.51) / 0.17
        airplaneWing.visible = false
        starMat.opacity = THREE.MathUtils.lerp(0.8, 0.1, localT)

        // Box descends and locks into destination scanner
        parcelGroup.position.lerp(new THREE.Vector3(0, 0, 0), 0.1)
        parcelGroup.rotation.x = 0.25
        parcelGroup.rotation.y = THREE.MathUtils.lerp(0.8, -0.6, localT)
        parcelGroup.rotation.z = 0

        laserPlane.visible = true
        laserPlane.position.y = Math.cos(elapsedTime * 3) * 2.5
        laserPlane.position.z = 4.2

        roadMesh.visible = false
        pinGroup.visible = false
        confettiMat.opacity = 0
      } else if (p < 0.85) {
        // --- STAGE 5: OUT FOR DELIVERY ---
        laserPlane.visible = false
        starMat.opacity = 0

        // Box rides horizontally with vehicle motion
        parcelGroup.position.lerp(new THREE.Vector3(0, -2 + Math.sin(elapsedTime * 8) * 0.1, 0), 0.1)
        parcelGroup.rotation.x = 0.15
        parcelGroup.rotation.y = Math.PI / 4
        parcelGroup.rotation.z = 0

        roadMesh.visible = true
        pinGroup.visible = true
        pinGroup.position.y = 5.5 + Math.sin(elapsedTime * 3) * 0.5

        confettiMat.opacity = 0
      } else {
        // --- STAGE 6: DELIVERED (DOORSTEP BOUNCE) ---
        const localT = (p - 0.85) / 0.15
        roadMesh.visible = false
        pinGroup.visible = false

        // Gentle landing with bounce settling
        const bounce = Math.sin(localT * Math.PI) * 1.5
        parcelGroup.position.lerp(new THREE.Vector3(0, -3.5 + bounce, 2), 0.1)
        parcelGroup.rotation.x = 0.2
        parcelGroup.rotation.y = 0.4
        parcelGroup.rotation.z = 0

        // Confetti burst appears
        confettiMat.opacity = THREE.MathUtils.lerp(0, 0.9, Math.min(1, localT * 3))
        confetti.rotation.y = elapsedTime * 0.2
      }

      renderer.render(scene, camera)
    }

    animate()

    // 10. Responsive Resize
    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth || 600
      const h = container.clientHeight || 450
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
    <section
      id='journey'
      ref={sectionRef}
      className={`relative w-full min-h-[320vh] transition-colors duration-700 ease-in-out ${
        isDarkScene ? 'bg-[#0D1B2A] text-white' : 'bg-[#F5F7FA] text-slate-900'
      }`}
    >
      {/* Pinned Sticky Viewport Container */}
      <div className='sticky top-20 h-[calc(100vh-5rem)] flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden'>
        {/* Top Header */}
        <div className='text-center max-w-3xl mx-auto z-10'>
          <div className='inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-semibold tracking-wider uppercase mb-2 border border-current opacity-70'>
            <span>STAGE 0{currentStage.id} OF 06</span>
            <span>•</span>
            <span>SCROLL-DRIVEN 3D LIFECYCLE</span>
          </div>

          <h2 className='text-2xl sm:text-4xl md:text-5xl font-extrabold uppercase tracking-tight font-display leading-none'>
            THE SHIPMENT JOURNEY
          </h2>
          <p
            className={`mt-2 text-xs sm:text-sm max-w-xl mx-auto font-sans ${
              isDarkScene ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Scroll naturally to scrub the live 3D parcel through all six certified chain-of-custody checkpoints.
          </p>
        </div>

        {/* Center: Split between 3D WebGL Canvas & Stage Card */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 items-center my-auto w-full z-10'>
          {/* LEFT: Active Stage Narrative */}
          <div className='lg:col-span-5 order-2 lg:order-1'>
            <div
              className={`p-6 sm:p-8 rounded-3xl border backdrop-blur-xl transition-all duration-500 shadow-2xl ${
                isDarkScene
                  ? 'bg-[#132238]/95 border-white/10 text-white'
                  : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-200/60'
              }`}
            >
              <div className='flex items-center justify-between gap-4 mb-4'>
                <span className='px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase bg-[#2F6BFF]/15 text-[#2F6BFF] border border-[#2F6BFF]/30'>
                  {currentStage.badge}
                </span>
                <div
                  className={`flex items-center gap-1.5 text-xs font-mono ${
                    isDarkScene ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  <Clock className='w-3.5 h-3.5' />
                  <span>{currentStage.eta}</span>
                </div>
              </div>

              <h3 className='text-2xl sm:text-3xl font-extrabold uppercase tracking-tight font-display mb-3'>
                {currentStage.title}
              </h3>

              <p
                className={`text-sm sm:text-base leading-relaxed ${
                  isDarkScene ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {currentStage.description}
              </p>

              {/* Progress Bar within active stage */}
              <div className='mt-6 pt-4 border-t border-current/10'>
                <div className='flex justify-between text-[11px] font-mono opacity-70 mb-1.5'>
                  <span>SCROLL TELEMETRY</span>
                  <span>{Math.round(scrollProgress * 100)}% DISPATCHED</span>
                </div>
                <div className='w-full h-1.5 rounded-full bg-slate-300/30 overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-[#2F6BFF] to-[#FF7A1A] transition-all duration-200 rounded-full'
                    style={{ width: `${scrollProgress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Real Three.js WebGL 3D Canvas Scene */}
          <div className='lg:col-span-7 order-1 lg:order-2 flex items-center justify-center'>
            <div
              ref={canvasContainerRef}
              className={`relative aspect-[4/3] sm:aspect-[16/10] w-full max-w-2xl rounded-3xl border overflow-hidden shadow-2xl transition-all duration-500 flex items-center justify-center ${
                isDarkScene ? 'bg-[#0B1522] border-white/10' : 'bg-[#EBF1F8] border-slate-200'
              }`}
            >
              {/* 3D WebGL Canvas mounts here */}
              <div className='absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-widest bg-black/50 backdrop-blur-md text-white border border-white/10'>
                REAL-TIME 3D WEBGL
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Clean 6-Dot Stage Progress Navigation */}
        <div className='w-full max-w-3xl mx-auto pt-2 z-10'>
          <div className='flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none'>
            {stages.map((stage, idx) => {
              const isActive = idx === activeStageIndex
              const isDone = idx < activeStageIndex

              return (
                <button
                  key={stage.id}
                  onClick={() => scrollToStage(idx)}
                  className={`flex items-center gap-2 py-1 px-2.5 rounded-xl transition-all text-left ${
                    isActive
                      ? isDarkScene
                        ? 'bg-white/15 text-white font-bold'
                        : 'bg-slate-200 text-slate-900 font-bold'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono transition-colors ${
                      isActive
                        ? 'bg-[#FF7A1A] text-white shadow-md shadow-[#FF7A1A]/40'
                        : isDone
                        ? 'bg-[#2F6BFF] text-white'
                        : isDarkScene
                        ? 'bg-white/10 text-slate-400'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className='w-3 h-3' /> : stage.id}
                  </div>
                  <span className='hidden sm:inline text-[11px] font-mono uppercase tracking-wider whitespace-nowrap'>
                    {stage.shortLabel}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
