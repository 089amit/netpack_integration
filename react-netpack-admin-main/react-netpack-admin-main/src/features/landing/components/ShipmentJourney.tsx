import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { LANDING_CONFIG } from '../config'
import { Clock, CheckCircle2 } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Canvas Texture Generators
// ─────────────────────────────────────────────────────────────────────────────

function createCardboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 384
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // Kraft cardboard background with subtle grain
    ctx.fillStyle = '#D49B6A'
    ctx.fillRect(0, 0, 512, 384)

    // Grain lines
    ctx.strokeStyle = 'rgba(0,0,0,0.04)'
    ctx.lineWidth = 1
    for (let y = 0; y < 384; y += 4) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(512, y)
      ctx.stroke()
    }

    // PVC sealing tape down the center
    ctx.fillStyle = 'rgba(246, 216, 96, 0.88)'
    ctx.fillRect(220, 0, 72, 384)

    // Thermal shipping label
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.roundRect(40, 50, 240, 260, 8)
    ctx.fill()

    // Brand wordmark & priority badge
    ctx.fillStyle = '#0D1B2A'
    ctx.font = 'bold 24px sans-serif'
    ctx.fillText('NETPACK', 55, 88)

    ctx.fillStyle = '#FF7A1A'
    ctx.font = 'bold 13px monospace'
    ctx.fillText('EXPRESS AIR', 180, 88)

    ctx.strokeStyle = '#CBD5E1'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(55, 102)
    ctx.lineTo(265, 102)
    ctx.stroke()

    // Destination & AWB
    ctx.fillStyle = '#0D1B2A'
    ctx.font = 'bold 30px monospace'
    ctx.fillText('LHR • NYC', 55, 142)

    // Barcode
    const barX = 55
    const barY = 168
    const barH = 46
    const barWidths = [4, 2, 5, 2, 7, 3, 4, 2, 6, 3, 5, 2, 8, 3, 4, 6, 2, 7, 3, 2]
    let curX = barX
    ctx.fillStyle = '#0D1B2A'
    barWidths.forEach((bw) => {
      ctx.fillRect(curX, barY, bw, barH)
      curX += bw + 3
    })

    ctx.font = '11px monospace'
    ctx.fillText('* NP-TEST-1001 *', 55, 236)

    // Fragile / Handle with Care icons
    ctx.fillStyle = '#E11D48'
    ctx.font = 'bold 11px sans-serif'
    ctx.fillText('FRAGILE // HANDLE WITH CARE', 55, 275)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  return texture
}

function createXrayScreenTexture(headerTitle: string, statusText: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // Dark CRT monitor background
    ctx.fillStyle = '#07121E'
    ctx.fillRect(0, 0, 512, 256)

    // Grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)'
    ctx.lineWidth = 1
    for (let x = 0; x < 512; x += 32) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, 256)
      ctx.stroke()
    }
    for (let y = 0; y < 256; y += 32) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(512, y)
      ctx.stroke()
    }

    // Header
    ctx.fillStyle = '#38BDF8'
    ctx.font = 'bold 16px monospace'
    ctx.fillText(headerTitle, 24, 38)

    // Oscilloscope scan wave
    ctx.strokeStyle = '#00E5FF'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    for (let x = 24; x < 488; x++) {
      const y = 110 + Math.sin(x * 0.05) * 24 + Math.sin(x * 0.12) * 12
      if (x === 24) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Verified Status Badge
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'
    ctx.fillRect(24, 180, 464, 52)
    ctx.strokeStyle = '#10B981'
    ctx.lineWidth = 2
    ctx.strokeRect(24, 180, 464, 52)

    ctx.fillStyle = '#10B981'
    ctx.font = 'bold 22px monospace'
    ctx.fillText(statusText, 45, 214)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  return texture
}

function createVanLiveryTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#0D1B2A'
    ctx.fillRect(0, 0, 512, 256)

    // Dynamic racing swooshes
    ctx.fillStyle = '#2F6BFF'
    ctx.beginPath()
    ctx.moveTo(0, 180)
    ctx.lineTo(512, 110)
    ctx.lineTo(512, 140)
    ctx.lineTo(0, 210)
    ctx.fill()

    ctx.fillStyle = '#FF7A1A'
    ctx.beginPath()
    ctx.moveTo(0, 215)
    ctx.lineTo(512, 145)
    ctx.lineTo(512, 160)
    ctx.lineTo(0, 230)
    ctx.fill()

    // Brand Wordmark
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 44px sans-serif'
    ctx.fillText('NETPACK', 40, 95)

    ctx.fillStyle = '#38BDF8'
    ctx.font = 'bold 18px monospace'
    ctx.fillText('INTERNATIONAL LOGISTICS', 42, 130)

    ctx.fillStyle = '#94A3B8'
    ctx.font = '14px monospace'
    ctx.fillText('EXPRESS COURIER & CARGO DISPATCH', 42, 165)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  return texture
}

export const ShipmentJourney: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement | null>(null)
  const canvasContainerRef = useRef<HTMLDivElement | null>(null)
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [scrollProgress, setScrollProgress] = useState(0)

  const stages = LANDING_CONFIG.stages
  const currentStage = stages[activeStageIndex]
  const isDarkScene = currentStage.theme === 'dark'

  const progressRef = useRef(0)

  // Scroll listener that updates progress through the pinned journey
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const totalHeight = sectionRef.current.offsetHeight
      const viewportHeight = window.innerHeight

      const stickyTop = window.innerWidth < 640 ? 64 : 80
      const stickyHeight = viewportHeight - stickyTop
      const pinnedScrollDistance = Math.max(1, totalHeight - stickyHeight)

      const pinnedScrolled = stickyTop - rect.top
      const p = Math.min(1, Math.max(0, pinnedScrolled / pinnedScrollDistance))
      progressRef.current = p
      setScrollProgress(p)

      const stageIdx = Math.min(stages.length - 1, Math.floor(p * stages.length))
      setActiveStageIndex(stageIdx)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [stages.length])

  // Scroll directly to a specific stage on dot click
  const scrollToStage = (stageIdx: number) => {
    if (!sectionRef.current) return
    const rect = sectionRef.current.getBoundingClientRect()
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const sectionTop = rect.top + scrollTop
    const totalHeight = sectionRef.current.offsetHeight
    const viewportHeight = window.innerHeight

    const stickyTop = window.innerWidth < 640 ? 64 : 80
    const stickyHeight = viewportHeight - stickyTop
    const pinnedScrollDistance = Math.max(1, totalHeight - stickyHeight)

    const targetRatio = (stageIdx + 0.5) / stages.length
    const targetScrollY = sectionTop - stickyTop + targetRatio * pinnedScrollDistance
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
    const isMobile = window.innerWidth < 640

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000)

    const updateCameraPosition = (w: number, h: number) => {
      const aspect = w / h
      const targetVisibleWidth = 36
      const halfFovRad = (42 * Math.PI / 180) / 2
      const requiredZ = targetVisibleWidth / (2 * aspect * Math.tan(halfFovRad))
      camera.position.set(0, 3.5, Math.max(28, Math.min(requiredZ, 44)))
      camera.lookAt(0, -0.2, 0)
    }
    updateCameraPosition(width, height)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.25
    container.appendChild(renderer.domElement)

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.2)
    mainKeyLight.position.set(22, 35, 25)
    mainKeyLight.castShadow = true
    mainKeyLight.shadow.mapSize.width = 1024
    mainKeyLight.shadow.mapSize.height = 1024
    mainKeyLight.shadow.bias = -0.001
    scene.add(mainKeyLight)

    const blueRimLight = new THREE.PointLight(0x2f6bff, 3.0, 70)
    blueRimLight.position.set(-22, 18, -12)
    scene.add(blueRimLight)

    const warmFillLight = new THREE.PointLight(0xff7a1a, 2.0, 50)
    warmFillLight.position.set(18, -4, 18)
    scene.add(warmFillLight)

    // Shared Textures
    const cardboardTexture = createCardboardTexture()
    const exportScreenTexture = createXrayScreenTexture('TIA CARGO SCANNER // DUAL-ENERGY 3D', 'CLEARED • PASS FOR EXPORT')
    const importScreenTexture = createXrayScreenTexture('DESTINATION GATEWAY // DUAL-ENERGY 3D', 'IMPORT CLEARED • REGULATORY PASS')
    const vanLiveryTexture = createVanLiveryTexture()

    // Base shadow plane
    const shadowGeo = new THREE.PlaneGeometry(36, 26)
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 })
    const floorShadow = new THREE.Mesh(shadowGeo, shadowMat)
    floorShadow.rotation.x = -Math.PI / 2
    floorShadow.position.y = -4.0
    floorShadow.receiveShadow = true
    scene.add(floorShadow)

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 1: PACKING (Workbench, Box Flaps Folding, Tape Sealing, Barcode Scanner)
    // ─────────────────────────────────────────────────────────────────────────
    const stage1Group = new THREE.Group()
    scene.add(stage1Group)

    // Workbench Table
    const tableTopGeo = new THREE.BoxGeometry(16, 0.8, 12)
    const tableTopMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4, metalness: 0.6 })
    const tableTop = new THREE.Mesh(tableTopGeo, tableTopMat)
    tableTop.position.set(0, -3.8, 0)
    tableTop.receiveShadow = true
    stage1Group.add(tableTop)

    // Table legs
    const legGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 12)
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
    ;[[-7, -5], [7, -5], [-7, 5], [7, 5]].forEach(([lx, lz]) => {
      const leg = new THREE.Mesh(legGeo, legMat)
      leg.position.set(lx, -5.8, lz)
      stage1Group.add(leg)
    })

    // Packing Box Body
    const s1BoxGeo = new THREE.BoxGeometry(7.5, 5, 5.5)
    const s1BoxMat = new THREE.MeshStandardMaterial({ map: cardboardTexture, roughness: 0.75, metalness: 0.05 })
    const s1BoxMesh = new THREE.Mesh(s1BoxGeo, s1BoxMat)
    s1BoxMesh.position.set(0, -0.9, 0)
    s1BoxMesh.castShadow = true
    s1BoxMesh.receiveShadow = true
    stage1Group.add(s1BoxMesh)

    // Left and Right Folding Flaps
    const flapGeo = new THREE.PlaneGeometry(3.7, 5.5)
    const flapMat = new THREE.MeshStandardMaterial({ color: 0xc89260, side: THREE.DoubleSide, roughness: 0.8 })

    const leftFlapPivot = new THREE.Group()
    leftFlapPivot.position.set(-3.75, 1.6, 0)
    const leftFlap = new THREE.Mesh(flapGeo, flapMat)
    leftFlap.position.set(1.85, 0, 0)
    leftFlap.rotation.x = Math.PI / 2
    leftFlapPivot.add(leftFlap)
    stage1Group.add(leftFlapPivot)

    const rightFlapPivot = new THREE.Group()
    rightFlapPivot.position.set(3.75, 1.6, 0)
    const rightFlap = new THREE.Mesh(flapGeo, flapMat)
    rightFlap.position.set(-1.85, 0, 0)
    rightFlap.rotation.x = Math.PI / 2
    rightFlapPivot.add(rightFlap)
    stage1Group.add(rightFlapPivot)

    // Sealing Tape Strip
    const tapeGeo = new THREE.PlaneGeometry(7.6, 0.8)
    const tapeMat = new THREE.MeshStandardMaterial({ color: 0xf6d860, roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.95 })
    const tapeStrip = new THREE.Mesh(tapeGeo, tapeMat)
    tapeStrip.rotation.x = -Math.PI / 2
    tapeStrip.position.set(0, 1.65, 0)
    stage1Group.add(tapeStrip)

    // Barcode Scanner Arm & Laser
    const scannerHeadGeo = new THREE.BoxGeometry(2.2, 1.2, 1.6)
    const scannerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.2 })
    const scannerHead = new THREE.Mesh(scannerHeadGeo, scannerMat)
    scannerHead.position.set(0, 4.5, 1.5)
    stage1Group.add(scannerHead)

    const s1LaserGeo = new THREE.PlaneGeometry(6.5, 0.15)
    const s1LaserMat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    const s1Laser = new THREE.Mesh(s1LaserGeo, s1LaserMat)
    s1Laser.rotation.x = Math.PI / 2
    s1Laser.position.set(0, 1.7, 0)
    stage1Group.add(s1Laser)

    // ─────────────────────────────────────────────────────────────────────────
    // Helper to Build an Industrial Airport X-Ray Scanner (Stage 2 & Stage 4)
    // ─────────────────────────────────────────────────────────────────────────
    const buildXrayScanner = (screenTexture: THREE.CanvasTexture, badgeText: string) => {
      const xrayGroup = new THREE.Group()

      // Conveyor Bed
      const convBedGeo = new THREE.BoxGeometry(26, 0.8, 7.5)
      const convBedMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 })
      const convBed = new THREE.Mesh(convBedGeo, convBedMat)
      convBed.position.set(0, -3.6, 0)
      convBed.receiveShadow = true
      xrayGroup.add(convBed)

      // Conveyor Rollers
      const rollerGeo = new THREE.CylinderGeometry(0.35, 0.35, 7.3, 16)
      const rollerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 })
      for (let rx = -11; rx <= 11; rx += 2.2) {
        const roller = new THREE.Mesh(rollerGeo, rollerMat)
        roller.rotation.x = Math.PI / 2
        roller.position.set(rx, -3.1, 0)
        xrayGroup.add(roller)
      }

      // Scanner Tunnel Machine Enclosure
      const outerHousingGeo = new THREE.BoxGeometry(9.5, 9.5, 10)
      const outerHousingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.3 })
      const outerHousing = new THREE.Mesh(outerHousingGeo, outerHousingMat)
      outerHousing.position.set(0, 1.2, 0)
      outerHousing.castShadow = true
      xrayGroup.add(outerHousing)

      // Inner Cutout Chamber (cyan glowing tunnel)
      const tunnelInteriorGeo = new THREE.BoxGeometry(7.2, 7.2, 10.1)
      const tunnelInteriorMat = new THREE.MeshBasicMaterial({ color: 0x0284c7, wireframe: false, side: THREE.BackSide })
      const tunnelInterior = new THREE.Mesh(tunnelInteriorGeo, tunnelInteriorMat)
      tunnelInterior.position.set(0, 1.2, 0)
      xrayGroup.add(tunnelInterior)

      // Lead Rubber Curtains (Entrance & Exit)
      const curtainMat = new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.9 })
      const curtainStripGeo = new THREE.PlaneGeometry(1.1, 6.2)
      const entranceCurtains: THREE.Mesh[] = []
      const exitCurtains: THREE.Mesh[] = []

      for (let ci = 0; ci < 6; ci++) {
        const cx = -2.75 + ci * 1.1
        const entStrip = new THREE.Mesh(curtainStripGeo, curtainMat)
        entStrip.position.set(cx, 1.2, -5.02)
        xrayGroup.add(entStrip)
        entranceCurtains.push(entStrip)

        const extStrip = new THREE.Mesh(curtainStripGeo, curtainMat)
        extStrip.position.set(cx, 1.2, 5.02)
        xrayGroup.add(extStrip)
        exitCurtains.push(extStrip)
      }

      // Overhead Scanner Monitor
      const monitorGeo = new THREE.BoxGeometry(6, 3, 0.4)
      const monitorMat = new THREE.MeshStandardMaterial({ map: screenTexture, roughness: 0.3 })
      const monitor = new THREE.Mesh(monitorGeo, monitorMat)
      monitor.position.set(0, 7.2, 3.5)
      monitor.rotation.x = -0.2
      xrayGroup.add(monitor)

      // Cyan X-Ray Vertical Scanning Sheet
      const scanSheetGeo = new THREE.PlaneGeometry(6.8, 6.8)
      const scanSheetMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
      })
      const scanSheet = new THREE.Mesh(scanSheetGeo, scanSheetMat)
      scanSheet.position.set(0, 1.2, 0)
      xrayGroup.add(scanSheet)

      // Internal X-Ray Glowing Contents Container
      const xrayBoxGroup = new THREE.Group()

      // Outer Translucent Shell (becomes X-Ray holographic)
      const xrayShellGeo = new THREE.BoxGeometry(6.5, 4.8, 5)
      const xrayShellMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.45,
        metalness: 0.2,
        roughness: 0.1,
      })
      const xrayShell = new THREE.Mesh(xrayShellGeo, xrayShellMat)
      xrayBoxGroup.add(xrayShell)

      // Standard Opaque Cardboard Mesh
      const normalBoxMat = new THREE.MeshStandardMaterial({ map: cardboardTexture, roughness: 0.75 })
      const normalBox = new THREE.Mesh(xrayShellGeo, normalBoxMat)
      xrayBoxGroup.add(normalBox)

      // Inside Density-Colored Cargo Items (Authentic Dual-Energy X-Ray Color Coding)
      // Organics: Orange (#FF8C00), Metals/Electronics: Electric Cyan (#00E5FF)
      const organicItemGeo = new THREE.CylinderGeometry(1.2, 1.2, 3.2, 16)
      const organicItemMat = new THREE.MeshBasicMaterial({ color: 0xff7a1a, wireframe: false })
      const organicItem = new THREE.Mesh(organicItemGeo, organicItemMat)
      organicItem.position.set(-1.4, 0, 0)
      organicItem.rotation.z = Math.PI / 6
      xrayBoxGroup.add(organicItem)

      const metalItemGeo = new THREE.BoxGeometry(2.4, 1.4, 1.8)
      const metalItemMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, wireframe: false })
      const metalItem = new THREE.Mesh(metalItemGeo, metalItemMat)
      metalItem.position.set(1.4, 0, 0)
      xrayBoxGroup.add(metalItem)

      xrayBoxGroup.position.set(0, -0.6, 0)
      xrayGroup.add(xrayBoxGroup)

      // Approved Stamp Badge
      const stampGeo = new THREE.RingGeometry(2.8, 3.8, 32)
      const stampMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0 })
      const stamp = new THREE.Mesh(stampGeo, stampMat)
      stamp.position.set(0, 4.2, 5.5)
      xrayGroup.add(stamp)

      return {
        group: xrayGroup,
        xrayBoxGroup,
        normalBox,
        xrayShell,
        organicItem,
        metalItem,
        scanSheet,
        stamp,
        stampMat,
        entranceCurtains,
        exitCurtains,
        badgeText,
      }
    }

    // Stage 2: Export Customs X-Ray
    const stage2Data = buildXrayScanner(exportScreenTexture, 'EXPORT CLEARED')
    scene.add(stage2Data.group)

    // Stage 4: Destination Import Customs X-Ray
    const stage4Data = buildXrayScanner(importScreenTexture, 'IMPORT CLEARED')
    scene.add(stage4Data.group)

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 3: SHIPMENT DEPARTURE (Cargo Pallet Loading & Airplane Flight)
    // ─────────────────────────────────────────────────────────────────────────
    const stage3Group = new THREE.Group()
    scene.add(stage3Group)

    // Twinkling Starfield
    const starCount = 350
    const starGeo = new THREE.BufferGeometry()
    const starPositions: number[] = []
    for (let i = 0; i < starCount; i++) {
      starPositions.push((Math.random() - 0.5) * 140, (Math.random() - 0.5) * 80 + 10, (Math.random() - 0.5) * 80)
    }
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3))
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.75, transparent: true, opacity: 0 })
    const starField = new THREE.Points(starGeo, starMat)
    stage3Group.add(starField)

    // 3D Soft Cloud Clusters
    const cloudGroup = new THREE.Group()
    const cloudPuffGeo = new THREE.SphereGeometry(3.5, 12, 12)
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.4 })
    for (let ci = 0; ci < 8; ci++) {
      const puff = new THREE.Mesh(cloudPuffGeo, cloudMat)
      puff.position.set((ci - 4) * 8, -6 + Math.sin(ci) * 1.5, -15 - Math.cos(ci) * 10)
      puff.scale.set(1.6, 0.8, 1.2)
      cloudGroup.add(puff)
    }
    stage3Group.add(cloudGroup)

    // The Cargo Pallet with Strapped Boxes
    const palletGroup = new THREE.Group()

    // Aluminum / Heavy Wooden Cargo Pallet Base
    const palletBaseGeo = new THREE.BoxGeometry(8, 0.6, 7.5)
    const palletBaseMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 })
    const palletBase = new THREE.Mesh(palletBaseGeo, palletBaseMat)
    palletGroup.add(palletBase)

    // Stacked NetPack boxes on pallet (3 on bottom, 1 on top)
    const pBoxGeo = new THREE.BoxGeometry(3.6, 2.8, 3.4)
    const pBoxMat = new THREE.MeshStandardMaterial({ map: cardboardTexture, roughness: 0.75 })

    const pBox1 = new THREE.Mesh(pBoxGeo, pBoxMat)
    pBox1.position.set(-1.9, 1.7, -1.8)
    palletGroup.add(pBox1)

    const pBox2 = new THREE.Mesh(pBoxGeo, pBoxMat)
    pBox2.position.set(1.9, 1.7, -1.8)
    palletGroup.add(pBox2)

    const pBox3 = new THREE.Mesh(pBoxGeo, pBoxMat)
    pBox3.position.set(-1.9, 1.7, 1.8)
    palletGroup.add(pBox3)

    const pBox4 = new THREE.Mesh(pBoxGeo, pBoxMat)
    pBox4.position.set(0, 4.5, 0)
    palletGroup.add(pBox4)

    // Silver cargo safety webbing / tie-down straps
    const strapMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.5, roughness: 0.5 })
    const strapH1 = new THREE.Mesh(new THREE.BoxGeometry(8.05, 0.25, 7.55), strapMat)
    strapH1.position.set(0, 2.2, 0)
    palletGroup.add(strapH1)

    palletGroup.position.set(-8, -2, 2)
    stage3Group.add(palletGroup)

    // Realistic Twin-Engine Cargo Jet Airliner
    const airplane = new THREE.Group()

    // Fuselage (cylinder along Z-axis)
    const fuselageGeo = new THREE.CylinderGeometry(2.3, 2.3, 22, 24)
    const planeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.25, metalness: 0.4 })
    const fuselage = new THREE.Mesh(fuselageGeo, planeWhiteMat)
    fuselage.rotation.x = Math.PI / 2
    airplane.add(fuselage)

    // Nose Radome Cone
    const noseGeo = new THREE.ConeGeometry(2.3, 4.5, 24)
    const nose = new THREE.Mesh(noseGeo, planeWhiteMat)
    nose.rotation.x = -Math.PI / 2
    nose.position.set(0, 0, 13.2)
    airplane.add(nose)

    // Cockpit Window Glass
    const cockpitGeo = new THREE.PlaneGeometry(2.4, 0.9)
    const cockpitMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 })
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat)
    cockpit.position.set(0, 1.4, 11.5)
    cockpit.rotation.x = -0.5
    airplane.add(cockpit)

    // Cargo Hold Door on Fuselage Side
    const cargoDoorGeo = new THREE.PlaneGeometry(3.8, 3)
    const cargoDoorMat = new THREE.MeshStandardMaterial({ color: 0x2f6bff, roughness: 0.3 })
    const cargoDoor = new THREE.Mesh(cargoDoorGeo, cargoDoorMat)
    cargoDoor.position.set(-2.31, -0.2, 0)
    cargoDoor.rotation.y = -Math.PI / 2
    airplane.add(cargoDoor)

    // Swept Main Wings
    const wingShape = new THREE.Shape()
    wingShape.moveTo(0, 0)
    wingShape.lineTo(13, -5)
    wingShape.lineTo(12, -7.5)
    wingShape.lineTo(0, -3)
    wingShape.closePath()
    const wingExtGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.3, bevelEnabled: false })

    const leftWing = new THREE.Mesh(wingExtGeo, planeWhiteMat)
    leftWing.position.set(0, -0.2, 2)
    leftWing.rotation.x = Math.PI / 2
    airplane.add(leftWing)

    const rightWing = new THREE.Mesh(wingExtGeo, planeWhiteMat)
    rightWing.position.set(0, -0.2, 2)
    rightWing.rotation.x = Math.PI / 2
    rightWing.scale.set(-1, 1, 1)
    airplane.add(rightWing)

    // Wingtip Winglets & Navigation Lights
    const navRed = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshBasicMaterial({ color: 0xef4444 }))
    navRed.position.set(12.5, 0.6, -5)
    airplane.add(navRed)

    const navGreen = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 12), new THREE.MeshBasicMaterial({ color: 0x10b981 }))
    navGreen.position.set(-12.5, 0.6, -5)
    airplane.add(navGreen)

    // Dual Turbofan Engines Under Wings
    const engineGeo = new THREE.CylinderGeometry(1.2, 1.0, 5, 20)
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 })
    const exhaustMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })

    const leftEngine = new THREE.Mesh(engineGeo, engineMat)
    leftEngine.rotation.x = Math.PI / 2
    leftEngine.position.set(5.5, -1.8, 1)
    const leftExhaust = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 16), exhaustMat)
    leftExhaust.rotation.x = Math.PI
    leftExhaust.position.set(0, -2.8, 0)
    leftEngine.add(leftExhaust)
    airplane.add(leftEngine)

    const rightEngine = new THREE.Mesh(engineGeo, engineMat)
    rightEngine.rotation.x = Math.PI / 2
    rightEngine.position.set(-5.5, -1.8, 1)
    const rightExhaust = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.8, 16), exhaustMat)
    rightExhaust.rotation.x = Math.PI
    rightExhaust.position.set(0, -2.8, 0)
    rightEngine.add(rightExhaust)
    airplane.add(rightEngine)

    // Vertical Stabilizer (Tail fin) with NetPack Livery
    const tailShape = new THREE.Shape()
    tailShape.moveTo(0, 0)
    tailShape.lineTo(0, 6.5)
    tailShape.lineTo(2.5, 5.8)
    tailShape.lineTo(4.5, 0)
    tailShape.closePath()
    const tailExtGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.25, bevelEnabled: false })
    const tailFin = new THREE.Mesh(tailExtGeo, new THREE.MeshStandardMaterial({ color: 0x2f6bff, roughness: 0.3 }))
    tailFin.position.set(-0.125, 2, -10.5)
    tailFin.rotation.y = Math.PI / 2
    airplane.add(tailFin)

    // Retractable Landing Gear Undercarriage
    const gearLegGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.2, 12)
    const gearLegMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 })
    const wheelGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 16)
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })

    const landingGearGroup = new THREE.Group()
    ;[[-3.2, 0], [3.2, 0], [0, 8.5]].forEach(([gx, gz]) => {
      const leg = new THREE.Mesh(gearLegGeo, gearLegMat)
      leg.position.set(gx, -2.2, gz)
      const wheel = new THREE.Mesh(wheelGeo, wheelMat)
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(0, -1.1, 0)
      leg.add(wheel)
      landingGearGroup.add(leg)
    })
    airplane.add(landingGearGroup)

    airplane.position.set(4, 0, -4)
    stage3Group.add(airplane)

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 5: OUT FOR DELIVERY (NetPack Delivery Van Driving Along Road)
    // ─────────────────────────────────────────────────────────────────────────
    const stage5Group = new THREE.Group()
    scene.add(stage5Group)

    // Asphalt Road with Scrolling Dashed White Centerline
    const roadPlaneGeo = new THREE.PlaneGeometry(64, 16)
    const roadPlaneMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95 })
    const roadPlane = new THREE.Mesh(roadPlaneGeo, roadPlaneMat)
    roadPlane.rotation.x = -Math.PI / 2
    roadPlane.position.set(0, -3.8, 0)
    roadPlane.receiveShadow = true
    stage5Group.add(roadPlane)

    const dashGeo = new THREE.PlaneGeometry(2.8, 0.35)
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const roadDashes: THREE.Mesh[] = []
    for (let di = -30; di <= 30; di += 6) {
      const dash = new THREE.Mesh(dashGeo, dashMat)
      dash.rotation.x = -Math.PI / 2
      dash.position.set(di, -3.78, 0)
      stage5Group.add(dash)
      roadDashes.push(dash)
    }

    // Modern 3D NetPack Delivery Courier Van
    const vanGroup = new THREE.Group()

    // Main Cargo Van Chassis
    const vanBodyGeo = new THREE.BoxGeometry(11, 4.8, 4.8)
    const vanBodyMat = new THREE.MeshStandardMaterial({ color: 0x0d1b2a, roughness: 0.35, metalness: 0.5 })
    const vanBody = new THREE.Mesh(vanBodyGeo, vanBodyMat)
    vanBody.position.set(0, 0, 0)
    vanBody.castShadow = true
    vanGroup.add(vanBody)

    // Side Livery Decal Panels
    const liveryPlaneGeo = new THREE.PlaneGeometry(10.9, 4.5)
    const liveryPlaneMat = new THREE.MeshStandardMaterial({ map: vanLiveryTexture, roughness: 0.4 })
    const liveryLeft = new THREE.Mesh(liveryPlaneGeo, liveryPlaneMat)
    liveryLeft.position.set(0, 0, 2.42)
    vanGroup.add(liveryLeft)

    const liveryRight = new THREE.Mesh(liveryPlaneGeo, liveryPlaneMat)
    liveryRight.position.set(0, 0, -2.42)
    liveryRight.rotation.y = Math.PI
    vanGroup.add(liveryRight)

    // Front Windshield & Cab
    const cabGeo = new THREE.BoxGeometry(3.5, 3.8, 4.7)
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x0b1522, roughness: 0.3 })
    const cab = new THREE.Mesh(cabGeo, cabMat)
    cab.position.set(5.2, -0.4, 0)
    vanGroup.add(cab)

    const windshieldGeo = new THREE.PlaneGeometry(2.8, 2.2)
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.1 })
    const windshield = new THREE.Mesh(windshieldGeo, glassMat)
    windshield.rotation.y = Math.PI / 2
    windshield.rotation.z = -0.3
    windshield.position.set(6.96, 0.4, 0)
    vanGroup.add(windshield)

    // Headlights & Light Cones
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfef08a })
    ;[[6.95, -0.6, 1.8], [6.95, -0.6, -1.8]].forEach(([hx, hy, hz]) => {
      const hl = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16), headlightMat)
      hl.rotation.z = Math.PI / 2
      hl.position.set(hx, hy, hz)
      vanGroup.add(hl)
    })

    const lightConeGeo = new THREE.ConeGeometry(3.5, 12, 16, 1, true)
    const lightConeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.15, side: THREE.DoubleSide })
    const lightCone = new THREE.Mesh(lightConeGeo, lightConeMat)
    lightCone.rotation.z = -Math.PI / 2
    lightCone.position.set(13, -1.2, 0)
    vanGroup.add(lightCone)

    // 4 Van Wheels with Rubber Tires & Silver Alloy Rims
    const tireGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 20)
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.95 })
    const rimGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.82, 16)
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })

    const vanWheels: THREE.Mesh[] = []
    ;[[3.6, 2.5], [-3.6, 2.5], [3.6, -2.5], [-3.6, -2.5]].forEach(([wx, wz]) => {
      const wheelHub = new THREE.Mesh(tireGeo, tireMat)
      wheelHub.rotation.x = Math.PI / 2
      wheelHub.position.set(wx, -2.6, wz)

      const rim = new THREE.Mesh(rimGeo, rimMat)
      wheelHub.add(rim)

      vanGroup.add(wheelHub)
      vanWheels.push(wheelHub)
    })

    vanGroup.position.set(0, -0.4, 0)
    stage5Group.add(vanGroup)

    // Roadside Lampposts Gliding Past
    const lampGroup = new THREE.Group()
    const poleGeo = new THREE.CylinderGeometry(0.18, 0.18, 8, 12)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 })

    for (let li = 0; li < 4; li++) {
      const pole = new THREE.Mesh(poleGeo, poleMat)
      pole.position.set((li - 2) * 16, 0.2, -6)
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 12), bulbMat)
      bulb.position.set(0, 4, 1.2)
      pole.add(bulb)
      lampGroup.add(pole)
    }
    stage5Group.add(lampGroup)

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 6: DELIVERED (Delivery Courier Handing Parcel to Consignee)
    // ─────────────────────────────────────────────────────────────────────────
    const stage6Group = new THREE.Group()
    scene.add(stage6Group)

    // Front Porch Doorway
    const porchWallGeo = new THREE.BoxGeometry(18, 12, 0.8)
    const porchWallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 })
    const porchWall = new THREE.Mesh(porchWallGeo, porchWallMat)
    porchWall.position.set(0, 2, -6)
    stage6Group.add(porchWall)

    // Front Door Frame & Wooden Door (Ajar)
    const doorFrameGeo = new THREE.BoxGeometry(6.4, 9.4, 1)
    const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
    const doorFrame = new THREE.Mesh(doorFrameGeo, doorFrameMat)
    doorFrame.position.set(3, 0.7, -5.9)
    stage6Group.add(doorFrame)

    const doorGeo = new THREE.BoxGeometry(5.8, 8.8, 0.3)
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 })
    const door = new THREE.Mesh(doorGeo, doorMat)
    door.position.set(1.5, 0.7, -5.2)
    door.rotation.y = -0.45
    stage6Group.add(door)

    // Welcome Doormat
    const matGeo = new THREE.BoxGeometry(5, 0.15, 3.2)
    const matMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 })
    const doormat = new THREE.Mesh(matGeo, matMat)
    doormat.position.set(2.8, -3.9, -2)
    stage6Group.add(doormat)

    // Delivery Courier Figure (Delivery Boy in Uniform)
    const courier = new THREE.Group()

    // Torso (NetPack Navy Uniform Jacket)
    const cTorsoGeo = new THREE.BoxGeometry(2.2, 3.2, 1.4)
    const cTorsoMat = new THREE.MeshStandardMaterial({ color: 0x0d1b2a, roughness: 0.6 })
    const cTorso = new THREE.Mesh(cTorsoGeo, cTorsoMat)
    cTorso.position.set(0, 0, 0)
    courier.add(cTorso)

    // Orange livery collar
    const cCollar = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.6, 1.42), new THREE.MeshStandardMaterial({ color: 0xff7a1a }))
    cCollar.position.set(0, 1.2, 0)
    courier.add(cCollar)

    // Head
    const cHead = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.7 }))
    cHead.position.set(0, 2.3, 0)
    courier.add(cHead)

    // Courier Cap with Visor
    const cCap = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.5, 16), new THREE.MeshStandardMaterial({ color: 0x0d1b2a }))
    cCap.position.set(0, 2.8, 0)
    const cVisor = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.8), new THREE.MeshStandardMaterial({ color: 0xff7a1a }))
    cVisor.position.set(0.6, 2.65, 0)
    cCap.add(cVisor)
    courier.add(cCap)

    // Courier Arms extending forward
    const armGeo = new THREE.BoxGeometry(2.2, 0.6, 0.6)
    const cArmLeft = new THREE.Mesh(armGeo, cTorsoMat)
    cArmLeft.position.set(1.5, 0.4, 0.6)
    cArmLeft.rotation.z = -0.2
    courier.add(cArmLeft)

    const cArmRight = new THREE.Mesh(armGeo, cTorsoMat)
    cArmRight.position.set(1.5, 0.4, -0.6)
    cArmRight.rotation.z = -0.2
    courier.add(cArmRight)

    // Legs
    const legPantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
    ;[0.45, -0.45].forEach((lz) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.8, 0.75), legPantsMat)
      leg.position.set(0, -2.8, lz)
      courier.add(leg)
    })

    courier.position.set(-3.8, -0.8, 0)
    courier.rotation.y = Math.PI / 4
    stage6Group.add(courier)

    // Consignee / Customer Figure
    const customer = new THREE.Group()

    const custTorso = new THREE.Mesh(new THREE.BoxGeometry(2.0, 3.0, 1.3), new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.6 }))
    customer.add(custTorso)

    const custHead = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.7 }))
    custHead.position.set(0, 2.2, 0)
    customer.add(custHead)

    const custArmLeft = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: 0x38bdf8 }))
    custArmLeft.position.set(-1.4, 0.3, 0.5)
    custArmLeft.rotation.z = 0.2
    customer.add(custArmLeft)

    const custArmRight = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: 0x38bdf8 }))
    custArmRight.position.set(-1.4, 0.3, -0.5)
    custArmRight.rotation.z = 0.2
    customer.add(custArmRight)

    ;[0.4, -0.4].forEach((lz) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.8, 0.7), new THREE.MeshStandardMaterial({ color: 0x334155 }))
      leg.position.set(0, -2.7, lz)
      customer.add(leg)
    })

    customer.position.set(3.4, -0.8, 0)
    customer.rotation.y = -Math.PI / 4
    stage6Group.add(customer)

    // Handover Parcel Box
    const handoverBox = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 3.2, 3.4),
      new THREE.MeshStandardMaterial({ map: cardboardTexture, roughness: 0.75 })
    )
    handoverBox.position.set(-1.2, -0.4, 0)
    handoverBox.castShadow = true
    stage6Group.add(handoverBox)

    // Floating Green Delivery Verified Holographic Badge
    const badgeGeo = new THREE.RingGeometry(2.6, 3.4, 32)
    const badgeMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide, transparent: true, opacity: 0 })
    const badgeMesh = new THREE.Mesh(badgeGeo, badgeMat)
    badgeMesh.position.set(0, 4.2, 1)
    stage6Group.add(badgeMesh)

    // Confetti particles
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
      confettiPos.push((Math.random() - 0.5) * 26, (Math.random() - 0.5) * 18 + 2, (Math.random() - 0.5) * 24)
      const c = colorChoices[i % colorChoices.length]
      confettiColors.push(c.r, c.g, c.b)
    }

    confettiGeo.setAttribute('position', new THREE.Float32BufferAttribute(confettiPos, 3))
    confettiGeo.setAttribute('color', new THREE.Float32BufferAttribute(confettiColors, 3))
    const confettiMat = new THREE.PointsMaterial({ size: 0.8, vertexColors: true, transparent: true, opacity: 0 })
    const confetti = new THREE.Points(confettiGeo, confettiMat)
    stage6Group.add(confetti)

    // ─────────────────────────────────────────────────────────────────────────
    // Animation Render Loop Synchronized to Scroll Progress
    // ─────────────────────────────────────────────────────────────────────────
    let animId: number
    const clock = new THREE.Clock()

    const animate = () => {
      animId = requestAnimationFrame(animate)
      const elapsedTime = clock.getElapsedTime()
      const p = progressRef.current // 0.0 -> 1.0

      // Hide all stages by default, activate only the visible stage
      stage1Group.visible = false
      stage2Data.group.visible = false
      stage3Group.visible = false
      stage4Data.group.visible = false
      stage5Group.visible = false
      stage6Group.visible = false

      if (p < 0.17) {
        // ── STAGE 1: PACKING ──
        stage1Group.visible = true
        const localT = p / 0.17

        // Flaps fold inward smoothly
        const flapAngle = THREE.MathUtils.lerp(0.85, 0, Math.min(1, localT * 2))
        leftFlapPivot.rotation.z = -flapAngle
        rightFlapPivot.rotation.z = flapAngle

        // Tape strip rolls across
        tapeStrip.scale.x = Math.max(0.001, THREE.MathUtils.lerp(0, 1, Math.max(0, (localT - 0.45) * 2)))

        // Barcode laser sweeps back and forth
        s1Laser.position.x = Math.sin(elapsedTime * 6) * 2.8
        s1Laser.position.z = Math.cos(elapsedTime * 4) * 1.4

      } else if (p < 0.34) {
        // ── STAGE 2: CUSTOMS CLEARANCE (PASSING THROUGH X-RAY) ──
        stage2Data.group.visible = true
        const localT = (p - 0.17) / 0.17

        // Box moves horizontally along conveyor through the scanner tunnel
        const boxX = THREE.MathUtils.lerp(-10, 10, localT)
        stage2Data.xrayBoxGroup.position.x = boxX

        // Inside the tunnel (-3.2 <= boxX <= 3.2): Box becomes translucent X-ray holographic!
        const insideTunnel = boxX >= -3.5 && boxX <= 3.5
        stage2Data.normalBox.visible = !insideTunnel
        stage2Data.xrayShell.visible = insideTunnel
        stage2Data.organicItem.visible = insideTunnel
        stage2Data.metalItem.visible = insideTunnel

        // Lead curtains sway as box enters and exits
        const entSway = Math.sin(Math.max(0, 1 - Math.abs(boxX - (-4.5))) * Math.PI) * 0.4
        stage2Data.entranceCurtains.forEach((c) => { c.rotation.x = entSway })

        const extSway = Math.sin(Math.max(0, 1 - Math.abs(boxX - 4.5)) * Math.PI) * 0.4
        stage2Data.exitCurtains.forEach((c) => { c.rotation.x = extSway })

        // Cyan X-ray beam pulses
        stage2Data.scanSheet.position.x = Math.sin(elapsedTime * 5) * 2.5

        // Green approval stamp slams down when clearing the tunnel
        const stampProgress = Math.max(0, (localT - 0.6) / 0.4)
        stage2Data.stampMat.opacity = stampProgress > 0 ? 0.95 : 0
        stage2Data.stamp.scale.setScalar(THREE.MathUtils.lerp(1.6, 1.0, Math.min(1, stampProgress * 2)))

      } else if (p < 0.51) {
        // ── STAGE 3: SHIPMENT DEPARTURE (LOADING PALLET & FLYING PLANE) ──
        stage3Group.visible = true
        const localT = (p - 0.34) / 0.17

        starMat.opacity = THREE.MathUtils.lerp(0.3, 0.95, localT)

        if (localT < 0.4) {
          // Phase A: Pallet lifts up and slides into the cargo plane
          const loadT = localT / 0.4
          palletGroup.position.x = THREE.MathUtils.lerp(-9, 1.5, loadT)
          palletGroup.position.y = THREE.MathUtils.lerp(-2.8, 0.2, loadT)
          palletGroup.position.z = THREE.MathUtils.lerp(3, 0, loadT)
          palletGroup.scale.setScalar(THREE.MathUtils.lerp(1.0, 0.7, loadT))
          airplane.position.set(2, 0, -3)
          airplane.rotation.set(0, 0, 0)
          landingGearGroup.position.y = 0
        } else {
          // Phase B: Pallet inside cargo hold, Airplane takes off & banks gracefully
          palletGroup.position.set(0, -999, 0) // stowed inside hold
          const flyT = (localT - 0.4) / 0.6

          // Airplane climbs, pitches up, and banks into turn
          airplane.position.x = THREE.MathUtils.lerp(1, -2, flyT)
          airplane.position.y = THREE.MathUtils.lerp(0, 3.5, flyT) + Math.sin(elapsedTime * 3) * 0.2
          airplane.position.z = THREE.MathUtils.lerp(-2, 4, flyT)
          airplane.rotation.x = THREE.MathUtils.lerp(0.05, -0.28, flyT)
          airplane.rotation.y = THREE.MathUtils.lerp(-0.1, 0.45, flyT)
          airplane.rotation.z = THREE.MathUtils.lerp(0, -0.32, flyT)

          // Landing gear retracts into fuselage belly
          landingGearGroup.position.y = THREE.MathUtils.lerp(0, 1.6, Math.min(1, flyT * 2.5))

          // Clouds glide backward
          cloudGroup.position.z = ((elapsedTime * 12) % 35) - 15
        }

      } else if (p < 0.68) {
        // ── STAGE 4: CLEARANCE AT DESTINATION (AIRPORT X-RAY) ──
        stage4Data.group.visible = true
        const localT = (p - 0.51) / 0.17

        const boxX = THREE.MathUtils.lerp(-10, 10, localT)
        stage4Data.xrayBoxGroup.position.x = boxX

        const insideTunnel = boxX >= -3.5 && boxX <= 3.5
        stage4Data.normalBox.visible = !insideTunnel
        stage4Data.xrayShell.visible = insideTunnel
        stage4Data.organicItem.visible = insideTunnel
        stage4Data.metalItem.visible = insideTunnel

        const entSway = Math.sin(Math.max(0, 1 - Math.abs(boxX - (-4.5))) * Math.PI) * 0.4
        stage4Data.entranceCurtains.forEach((c) => { c.rotation.x = entSway })

        const extSway = Math.sin(Math.max(0, 1 - Math.abs(boxX - 4.5)) * Math.PI) * 0.4
        stage4Data.exitCurtains.forEach((c) => { c.rotation.x = extSway })

        stage4Data.scanSheet.position.x = Math.sin(elapsedTime * 5) * 2.5

        const stampProgress = Math.max(0, (localT - 0.6) / 0.4)
        stage4Data.stampMat.opacity = stampProgress > 0 ? 0.95 : 0
        stage4Data.stamp.scale.setScalar(THREE.MathUtils.lerp(1.6, 1.0, Math.min(1, stampProgress * 2)))

      } else if (p < 0.85) {
        // ── STAGE 5: OUT FOR DELIVERY (DELIVERED BY VAN) ──
        stage5Group.visible = true

        // Van wheels spin continuously
        vanWheels.forEach((w) => {
          w.rotation.x = elapsedTime * 14
        })

        // Realistic vehicle chassis micro-bounce and suspension roll
        vanGroup.position.y = -0.4 + Math.sin(elapsedTime * 10) * 0.06
        vanGroup.rotation.z = Math.sin(elapsedTime * 5) * 0.015

        // Road center dashed lines scroll continuously backward
        roadDashes.forEach((dash, idx) => {
          const baseOffset = (idx * 6) - 30
          dash.position.x = ((baseOffset - (elapsedTime * 28)) % 60 + 60) % 60 - 30
        })

        // Roadside lampposts glide backward
        lampGroup.position.x = -((elapsedTime * 18) % 48) + 24

      } else {
        // ── STAGE 6: DELIVERED (COURIER HANDING PARCEL TO CONSIGNEE) ──
        stage6Group.visible = true
        const localT = (p - 0.85) / 0.15

        // Courier extends arms forward with the parcel
        const handoverT = Math.min(1, localT * 1.5)
        courier.position.x = THREE.MathUtils.lerp(-4.2, -2.2, handoverT)
        customer.position.x = THREE.MathUtils.lerp(3.8, 2.2, handoverT)

        // Parcel moves smoothly from courier's hands into consignee's hands
        handoverBox.position.x = THREE.MathUtils.lerp(-1.6, 0.4, handoverT)
        handoverBox.position.y = -0.4 + Math.sin(handoverT * Math.PI) * 0.35

        // Delivery confirmation badge appears
        const badgeProgress = Math.max(0, (localT - 0.5) / 0.5)
        badgeMat.opacity = THREE.MathUtils.lerp(0, 0.95, badgeProgress)
        badgeMesh.scale.setScalar(THREE.MathUtils.lerp(0.6, 1.0, badgeProgress))

        // Confetti gently drifts
        confettiMat.opacity = THREE.MathUtils.lerp(0, 0.95, badgeProgress)
        confetti.rotation.y = elapsedTime * 0.25
      }

      renderer.render(scene, camera)
    }

    animate()

    // Responsive ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect
        if (w > 0 && h > 0) {
          camera.aspect = w / h
          updateCameraPosition(w, h)
          camera.updateProjectionMatrix()
          renderer.setSize(w, h)
        }
      }
    })
    resizeObserver.observe(container)

    return () => {
      cancelAnimationFrame(animId)
      resizeObserver.disconnect()
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
      className={`relative w-full min-h-[300vh] sm:min-h-[350vh] transition-colors duration-700 ease-in-out ${
        isDarkScene ? 'bg-[#0D1B2A] text-white' : 'bg-[#F5F7FA] text-slate-900'
      }`}
    >
      {/* Pinned Sticky Viewport Container */}
      <div className='sticky top-16 sm:top-20 h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] flex flex-col justify-between py-2 sm:py-4 lg:py-6 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden'>
        {/* Top Header - clean & minimal */}
        <div className='text-center max-w-3xl mx-auto z-10 shrink-0'>
          <h2 className='text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight font-display leading-tight'>
            THE SHIPMENT JOURNEY
          </h2>
        </div>

        {/* Center: Split between 3D WebGL Canvas & Stage Narrative Card */}
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-center my-auto w-full z-10 min-h-0'>
          {/* LEFT: Active Stage Narrative */}
          <div className='lg:col-span-5 order-2 lg:order-1'>
            <div
              className={`p-3.5 sm:p-5 lg:p-7 rounded-2xl sm:rounded-3xl border backdrop-blur-xl transition-all duration-500 shadow-xl ${
                isDarkScene
                  ? 'bg-[#132238]/95 border-white/10 text-white'
                  : 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-200/60'
              }`}
            >
              <div className='flex items-center justify-between gap-3 mb-2 sm:mb-3'>
                <span className='px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase bg-[#2F6BFF]/15 text-[#2F6BFF] border border-[#2F6BFF]/30'>
                  {currentStage.badge}
                </span>
                <div
                  className={`flex items-center gap-1.5 text-[11px] sm:text-xs font-mono ${
                    isDarkScene ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  <Clock className='w-3 h-3 sm:w-3.5 sm:h-3.5' />
                  <span>{currentStage.eta}</span>
                </div>
              </div>

              <h3 className='text-lg sm:text-2xl lg:text-3xl font-extrabold uppercase tracking-tight font-display mb-1.5 sm:mb-2'>
                {currentStage.title}
              </h3>

              <p
                className={`text-xs sm:text-sm lg:text-base leading-relaxed line-clamp-3 sm:line-clamp-none ${
                  isDarkScene ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                {currentStage.description}
              </p>

              {/* Minimal Progress Bar within active stage */}
              <div className='mt-2.5 sm:mt-5 pt-2 sm:pt-3 border-t border-current/10'>
                <div className='w-full h-1 sm:h-1.5 rounded-full bg-slate-300/30 overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-[#2F6BFF] to-[#FF7A1A] transition-all duration-200 rounded-full'
                    style={{ width: `${scrollProgress * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Real Three.js WebGL 3D Canvas Scene */}
          <div className='lg:col-span-7 order-1 lg:order-2 flex items-center justify-center min-h-0'>
            <div
              ref={canvasContainerRef}
              className={`relative h-[200px] xs:h-[240px] sm:h-[280px] md:h-[320px] lg:h-[380px] xl:h-[420px] max-h-[46vh] w-full max-w-2xl rounded-2xl sm:rounded-3xl border overflow-hidden shadow-2xl transition-all duration-500 flex items-center justify-center ${
                isDarkScene ? 'bg-[#08111D] border-white/10' : 'bg-[#EBF1F8] border-slate-200'
              }`}
            >
              {/* 3D WebGL Canvas mounts here */}
            </div>
          </div>
        </div>

        {/* Bottom: Clean 6-Dot Stage Progress Navigation */}
        <div className='w-full max-w-3xl mx-auto pt-1 sm:pt-2 pb-1 z-20 shrink-0'>
          <div className='flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-none'>
            {stages.map((stage, idx) => {
              const isActive = idx === activeStageIndex
              const isDone = idx < activeStageIndex

              return (
                <button
                  key={stage.id}
                  onClick={() => scrollToStage(idx)}
                  className={`flex items-center gap-1.5 sm:gap-2 py-1 px-1.5 sm:px-2.5 rounded-lg sm:rounded-xl transition-all text-left ${
                    isActive
                      ? isDarkScene
                        ? 'bg-white/15 text-white font-bold'
                        : 'bg-slate-200 text-slate-900 font-bold'
                      : 'opacity-50 hover:opacity-80'
                  }`}
                >
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-mono transition-colors ${
                      isActive
                        ? 'bg-[#FF7A1A] text-white shadow-md shadow-[#FF7A1A]/40'
                        : isDone
                        ? 'bg-[#2F6BFF] text-white'
                        : isDarkScene
                        ? 'bg-white/10 text-slate-400'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className='w-2.5 h-2.5 sm:w-3 sm:h-3' /> : stage.id}
                  </div>
                  <span className='hidden md:inline text-[11px] font-mono uppercase tracking-wider whitespace-nowrap'>
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
