"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, Flame, Sparkles, Timer, Wheat } from "lucide-react"
import { ROUTES } from "@/lib/constants"

const TOTAL_FRAMES = 52

interface PhaseContent {
  id: number
  range: [number, number]
  step: string
  title: string
  description: string
  badge: string
  icon: typeof Wheat
  position?: "left" | "right"
}

const PHASES: PhaseContent[] = [
  {
    id: 1,
    range: [0.0, 0.18],
    step: "01 / 05 · MATERIAS PRIMAS",
    title: "Ingredientes de Calidad",
    description: "Comenzamos cada jornada con harina de trigo seleccionada, mantequilla, huevos frescos y levadura tradicional para dar vida a nuestras masas.",
    badge: "Ingredientes Frescos",
    icon: Wheat,
    position: "left",
  },
  {
    id: 2,
    range: [0.20, 0.38],
    step: "02 / 05 · AMASADO ARTESANAL",
    title: "El Toque Artesanal",
    description: "Amasamos con paciencia y dedicación para lograr esa textura suave y esponjosa que caracteriza a nuestro pan.",
    badge: "Hecho a Mano",
    icon: Sparkles,
    position: "right",
  },
  {
    id: 3,
    range: [0.40, 0.58],
    step: "03 / 05 · LEUDADO NATURAL",
    title: "El Tiempo Justo de Reposo",
    description: "Dejamos que la masa leude a su propio ritmo. El reposo adecuado es el secreto para que el pan crezca ligero y aromático.",
    badge: "Leudado Natural",
    icon: Timer,
    position: "left",
  },
  {
    id: 4,
    range: [0.60, 0.78],
    step: "04 / 05 · EL CALOR DEL HORNO",
    title: "Directo al Horno",
    description: "Horneamos 2 veces al día (5:00 AM y 2:00 PM) para que siempre encuentres pan doradito, caliente y recién salido.",
    badge: "2 Hornadas Diarias",
    icon: Flame,
    position: "right",
  },
  {
    id: 5,
    range: [0.80, 1.0],
    step: "05 / 05 · EL GRAN FINAL",
    title: "Listo para tu Mesa",
    description: "Conchas doradas, pan francés crujiente, champurradas y panes tradicionales recién salidos del horno, listos para disfrutar en familia.",
    badge: "Listo para Disfrutar",
    icon: Sparkles,
    position: "left",
  },
]

export function ProcessScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const [scrollProgress, setScrollProgress] = useState(0)
  const currentFrameRef = useRef<number>(0)

  // 1. Draw frame onto canvas with responsive object-fit: cover
  const drawFrame = (frameIndex: number) => {
    const canvas = canvasRef.current
    const list = imagesRef.current
    if (!canvas || list.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = list[frameIndex] || list[0]
    if (!img || !img.complete || img.naturalWidth === 0) return

    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1
    const width = canvas.clientWidth || window.innerWidth
    const height = canvas.clientHeight || window.innerHeight

    if (width === 0 || height === 0) return

    const pixelW = Math.floor(width * dpr)
    const pixelH = Math.floor(height * dpr)

    if (canvas.width !== pixelW || canvas.height !== pixelH) {
      canvas.width = pixelW
      canvas.height = pixelH
    }

    ctx.save()
    ctx.scale(dpr, dpr)

    // Calculate cover dimensions centering the focal subject
    const imgRatio = img.naturalWidth / img.naturalHeight
    const canvasRatio = width / height

    let renderW = width
    let renderH = height
    let offsetX = 0
    let offsetY = 0

    if (canvasRatio > imgRatio) {
      renderW = width
      renderH = width / imgRatio
      offsetY = (height - renderH) / 2
    } else {
      renderH = height
      renderW = height * imgRatio
      offsetX = (width - renderW) / 2
    }

    ctx.clearRect(0, 0, width, height)
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH)

    // Subtle warm cinematic vignette for text readability
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.35,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.85
    )
    gradient.addColorStop(0, "rgba(0, 0, 0, 0.1)")
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.6)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.restore()
  }

  // 2. Progressive sequence loading: initial frame immediately, remaining on intersection / idle
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = new Array(TOTAL_FRAMES)

    // Load initial frame 1 immediately for instant paint
    const firstImg = new Image()
    firstImg.src = "/process-sequence/frame-001.webp"
    firstImg.onload = () => {
      loadedImages[0] = firstImg
      imagesRef.current = loadedImages
      drawFrame(0)
    }

    // Load remaining frames only when user scrolls towards this section
    let hasLoadedRest = false
    const loadRemainingFrames = () => {
      if (hasLoadedRest) return
      hasLoadedRest = true

      for (let i = 2; i <= TOTAL_FRAMES; i++) {
        const img = new Image()
        const padded = String(i).padStart(3, "0")
        img.src = `/process-sequence/frame-${padded}.webp`
        const index = i - 1
        img.onload = () => {
          loadedImages[index] = img
          if (index === currentFrameRef.current) {
            drawFrame(index)
          }
        }
      }
      imagesRef.current = loadedImages
    }

    let observer: IntersectionObserver | null = null
    if (typeof window !== "undefined" && "IntersectionObserver" in window && containerRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            loadRemainingFrames()
            observer?.disconnect()
          }
        },
        { rootMargin: "400px 0px" }
      )
      observer.observe(containerRef.current)
    } else {
      const timer = setTimeout(loadRemainingFrames, 3000)
      return () => clearTimeout(timer)
    }

    return () => {
      observer?.disconnect()
    }
  }, [])

  // 3. Handle scroll progress
  useEffect(() => {
    let animationFrameId: number

    const handleScroll = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const totalScrollable = rect.height - window.innerHeight

      if (totalScrollable <= 0) return

      // Progress from 0 to 1
      const progress = Math.min(1, Math.max(0, -rect.top / totalScrollable))
      setScrollProgress(progress)

      const targetFrame = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.floor(progress * TOTAL_FRAMES)))
      if (currentFrameRef.current !== targetFrame) {
        currentFrameRef.current = targetFrame
        animationFrameId = requestAnimationFrame(() => drawFrame(targetFrame))
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", () => drawFrame(currentFrameRef.current), { passive: true })

    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Find active phase
  const activePhase = PHASES.find(
    (phase) => scrollProgress >= phase.range[0] && scrollProgress <= phase.range[1]
  ) || PHASES[0]

  return (
    <section ref={containerRef} className="relative h-[320vh] bg-[#121110] text-white">
      {/* Sticky Fullscreen Scrollytelling Viewport */}
      <div className="sticky top-0 flex h-screen w-full flex-col justify-between overflow-hidden">
        {/* Fullscreen HTML5 Canvas Background */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
          aria-label="Animación del proceso de panadería artesanal"
        />

        {/* Top Header Overlay */}
        <header className="relative z-20 flex items-center justify-between px-4 pt-20 sm:px-8 sm:pt-24">
          <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-black/60 px-3.5 py-1.5 backdrop-blur-xl sm:gap-3 sm:px-4 sm:py-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/90 sm:text-sm">
              El Proceso Artesanal
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3 py-1 backdrop-blur-xl text-xs font-mono font-bold text-amber-300 sm:px-3.5 sm:py-1.5">
            <span>{Math.round(scrollProgress * 100)}%</span>
          </div>
        </header>

        {/* Floating Narrative Content Cards */}
        <div className="relative z-20 mx-auto w-full max-w-6xl px-4 sm:px-8 my-auto">
          <div className="grid lg:grid-cols-12 items-center">
            {PHASES.map((phase) => {
              const isActive = activePhase.id === phase.id
              const Icon = phase.icon
              const isRight = phase.position === "right"

              return (
                <div
                  key={phase.id}
                  className={`transition-all duration-700 ease-out lg:col-span-6 ${
                    isRight ? "lg:col-start-7" : "lg:col-start-1"
                  } ${
                    isActive
                      ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                      : "opacity-0 translate-y-8 scale-95 pointer-events-none absolute inset-x-4 lg:inset-x-auto"
                  }`}
                >
                  <div className="overflow-hidden rounded-[2rem] border border-white/20 bg-black/65 p-6 shadow-[0_32px_64px_-24px_rgba(0,0,0,0.8)] backdrop-blur-2xl sm:p-8">
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-4">
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
                        {phase.step}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-[11px] font-bold text-amber-300 border border-amber-400/30">
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {phase.badge}
                      </span>
                    </div>

                    <h2 className="mt-4 font-display text-2xl font-semibold leading-tight text-white sm:text-3xl lg:text-4xl">
                      {phase.title}
                    </h2>

                    <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">
                      {phase.description}
                    </p>

                    {phase.id === 5 && (
                      <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-3">
                        <Link href={ROUTES.products} className="w-full sm:w-auto">
                          <button className="touch-tactile public-focus inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-amber-500 px-6 text-sm font-bold text-black shadow-lg hover:bg-amber-400 transition-colors sm:w-auto">
                            Ver Productos Disponibles
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Scroll Progress Bar & Phase Dots */}
        <footer className="relative z-20 flex items-center justify-between px-4 pb-6 sm:px-8 sm:pb-8">
          {/* Phase Indicators */}
          <div className="flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3.5 py-2 backdrop-blur-xl">
            {PHASES.map((phase) => (
              <span
                key={phase.id}
                className={`h-2 rounded-full transition-all duration-500 ${
                  activePhase.id === phase.id
                    ? "w-8 bg-amber-400"
                    : "w-2 bg-white/30"
                }`}
                aria-hidden="true"
              />
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
            <span>Desliza para continuar</span>
            <ArrowRight className="h-3.5 w-3.5 rotate-90 text-amber-400" aria-hidden="true" />
          </div>
        </footer>
      </div>
    </section>
  )
}
