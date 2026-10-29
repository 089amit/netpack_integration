import React, { useEffect, useRef } from 'react'

interface CityNode {
  name: string
  lat: number
  lon: number
  code: string
  hub?: boolean
}

const GLOBAL_CITIES: CityNode[] = [
  { name: 'Kathmandu', lat: 27.7172, lon: 85.324, code: 'KTM', hub: true },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, code: 'DXB' },
  { name: 'Frankfurt', lat: 50.1109, lon: 8.6821, code: 'FRA' },
  { name: 'London', lat: 51.5074, lon: -0.1278, code: 'LHR' },
  { name: 'New York', lat: 40.7128, lon: -74.006, code: 'JFK' },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, code: 'HND' },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198, code: 'SIN' },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093, code: 'SYD' },
]

const FLIGHT_ROUTES = [
  { from: 'KTM', to: 'DXB' },
  { from: 'DXB', to: 'FRA' },
  { from: 'FRA', to: 'LHR' },
  { from: 'LHR', to: 'JFK' },
  { from: 'KTM', to: 'SIN' },
  { from: 'SIN', to: 'HND' },
  { from: 'SIN', to: 'SYD' },
]

export const HeroGlobe: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let angle = 0

    // Detect user preference for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const render = () => {
      if (!canvas) return
      const width = canvas.width
      const height = canvas.height
      const radius = Math.min(width, height) * 0.42
      const centerX = width / 2
      const centerY = height / 2

      ctx.clearRect(0, 0, width, height)

      // Outer atmosphere radial glow
      const glowGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.6, centerX, centerY, radius * 1.3)
      glowGrad.addColorStop(0, 'rgba(47, 107, 255, 0.15)')
      glowGrad.addColorStop(0.5, 'rgba(47, 107, 255, 0.05)')
      glowGrad.addColorStop(1, 'rgba(47, 107, 255, 0)')
      ctx.fillStyle = glowGrad
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius * 1.35, 0, Math.PI * 2)
      ctx.fill()

      // Globe sphere rim border
      ctx.strokeStyle = 'rgba(47, 107, 255, 0.45)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.stroke()

      // Rotating Longitudes
      const numLongitudes = 16
      for (let i = 0; i < numLongitudes; i++) {
        const lonAngle = (i * Math.PI) / (numLongitudes / 2) + angle
        const rx = radius * Math.cos(lonAngle)

        ctx.strokeStyle = Math.sin(lonAngle) > 0 ? 'rgba(47, 107, 255, 0.28)' : 'rgba(47, 107, 255, 0.07)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, Math.abs(rx), radius, 0, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Parallels (Latitudes)
      const latitudes = [-60, -40, -20, 0, 20, 40, 60]
      latitudes.forEach((lat) => {
        const latRad = (lat * Math.PI) / 180
        const y = centerY - radius * Math.sin(latRad)
        const rParallel = radius * Math.cos(latRad)

        ctx.strokeStyle = 'rgba(47, 107, 255, 0.18)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(centerX, y, rParallel, rParallel * 0.25, 0, 0, Math.PI * 2)
        ctx.stroke()
      })

      // Project cities
      const projectedCities = GLOBAL_CITIES.map((city) => {
        const radLat = (city.lat * Math.PI) / 180
        const radLon = (city.lon * Math.PI) / 180 + angle
        const isFront = Math.cos(radLon) > -0.2

        const x = centerX + radius * Math.cos(radLat) * Math.sin(radLon)
        const y = centerY - radius * Math.sin(radLat)
        return { ...city, x, y, isFront, alpha: Math.max(0, Math.cos(radLon) + 0.2) }
      })

      // Draw Flight Arcs
      FLIGHT_ROUTES.forEach((route) => {
        const c1 = projectedCities.find((c) => c.code === route.from)
        const c2 = projectedCities.find((c) => c.code === route.to)
        if (!c1 || !c2) return
        if (!c1.isFront && !c2.isFront) return

        const midX = (c1.x + c2.x) / 2
        const midY = Math.min(c1.y, c2.y) - 45 // Arc arching upward

        const arcAlpha = Math.min(c1.alpha, c2.alpha) * 0.75

        // Dotted route line
        ctx.setLineDash([4, 6])
        ctx.strokeStyle = `rgba(47, 107, 255, ${arcAlpha})`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(c1.x, c1.y)
        ctx.quadraticCurveTo(midX, midY, c2.x, c2.y)
        ctx.stroke()
        ctx.setLineDash([])

        // Moving transit particle along arc
        const t = (Date.now() / 2500 + (c1.lat + c2.lon) * 0.05) % 1
        const ptX = (1 - t) * (1 - t) * c1.x + 2 * (1 - t) * t * midX + t * t * c2.x
        const ptY = (1 - t) * (1 - t) * c1.y + 2 * (1 - t) * t * midY + t * t * c2.y

        // Glowing photon head
        ctx.fillStyle = `rgba(255, 122, 26, ${arcAlpha * 1.2})`
        ctx.beginPath()
        ctx.arc(ptX, ptY, 3, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(47, 107, 255, ${arcAlpha * 0.5})`
        ctx.beginPath()
        ctx.arc(ptX, ptY, 7, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw City Hub Nodes
      projectedCities.forEach((city) => {
        if (!city.isFront) return

        const isKTM = city.hub
        const nodeColor = isKTM ? '#FF7A1A' : '#2F6BFF'

        // Outer pulse circle
        ctx.strokeStyle = isKTM ? 'rgba(255, 122, 26, 0.6)' : 'rgba(47, 107, 255, 0.5)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(city.x, city.y, isKTM ? 8 : 5, 0, Math.PI * 2)
        ctx.stroke()

        // Inner solid dot
        ctx.fillStyle = nodeColor
        ctx.beginPath()
        ctx.arc(city.x, city.y, isKTM ? 4 : 2.5, 0, Math.PI * 2)
        ctx.fill()

        // City code badge label
        ctx.font = '10px "Space Grotesk", sans-serif'
        ctx.fillStyle = `rgba(255, 255, 255, ${city.alpha * 0.9})`
        ctx.fillText(city.code, city.x + 8, city.y - 4)
      })

      if (!prefersReducedMotion) {
        angle += 0.003
      }
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className='relative w-full max-w-[560px] aspect-square mx-auto flex items-center justify-center select-none pointer-events-none'>
      {/* Background ambient radial aura */}
      <div className='absolute inset-0 rounded-full bg-blue-600/10 blur-3xl pointer-events-none' />

      {/* Primary Canvas rendering the 60fps globe */}
      <canvas
        ref={canvasRef}
        width={700}
        height={700}
        className='w-full h-full object-contain relative z-10'
        aria-label='Interactive 3D wireframe world globe showing NetPack global routes'
      />

      {/* Floating telemetry metrics pill */}
      <div className='absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0D1B2A]/90 border border-white/10 backdrop-blur-md text-[11px] font-mono tracking-wider text-slate-300'>
        <span className='w-2 h-2 rounded-full bg-[#FF7A1A] animate-ping' />
        <span>KTM GLOBAL GATEWAY ACTIVE</span>
      </div>
    </div>
  )
}
