"use client"

import { useRef, useEffect, useState } from "react"
import Hls from "hls.js"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Radio } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
}

export function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    setError(null)
    setLoading(true)

    let hls: Hls | null = null

    if (src.includes(".m3u8") && Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      })
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false)
        video.play().catch(() => {})
      })
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError("Stream unavailable. The channel may be offline.")
          setLoading(false)
        }
      })
    } else {
      video.src = src
      video.onloadeddata = () => {
        setLoading(false)
        video.play().catch(() => {})
      }
      video.onerror = () => {
        setError("Stream unavailable. The channel may be offline.")
        setLoading(false)
      }
    }

    return () => {
      hls?.destroy()
      video.onloadeddata = null
      video.onerror = null
    }
  }, [src])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)
    return () => {
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    video.paused ? video.play() : video.pause()
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  const handleVolume = (v: number) => {
    const video = videoRef.current
    if (!video) return
    video.volume = v
    setVolume(v)
    if (v > 0 && video.muted) {
      video.muted = false
      setMuted(false)
    }
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      video.requestFullscreen()
    }
  }

  if (error) {
    return (
      <div className={cn("grid place-items-center rounded-2xl bg-card/50 border border-border/60", className)}>
        <div className="text-center p-8">
          <Radio className="size-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold">Stream Unavailable</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("group relative rounded-2xl overflow-hidden bg-black", className)}>
      <video
        ref={videoRef}
        poster={poster}
        className="size-full object-contain"
        playsInline
        muted={muted}
      />

      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-black/60">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-sm text-white/70">Loading stream...</span>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="grid size-10 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30">
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </button>

          <button onClick={toggleMute} className="grid size-10 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30">
            {muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => handleVolume(Number(e.target.value))}
            className="w-24 accent-white"
          />

          <div className="ml-auto flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded bg-red-500/20 px-2 py-1 text-[11px] font-bold text-red-400">
              <span className="size-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
            </span>
            <button onClick={toggleFullscreen} className="grid size-10 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30">
              <Maximize className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
