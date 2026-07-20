"use client"

import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import Hls from "hls.js"
import { Play, Pause, Volume2, VolumeX, Maximize, Radio } from "lucide-react"
import { cn } from "@/lib/utils"
import type { IptvStream } from "@/lib/types"

interface VideoPlayerProps {
  sources: IptvStream[]
  poster?: string
  className?: string
  autoPlay?: boolean
  onAllSourcesUnavailable?: () => void
}

function isHlsStream(src: string) {
  return /\.m3u8(?:$|[?#])/i.test(src) || /[?&](?:format|type)=m3u8(?:$|&)/i.test(src)
}

export function VideoPlayer({ sources, poster, className, autoPlay = true, onAllSourcesUnavailable }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reportedUnavailableRef = useRef(false)
  const sourceKey = useMemo(() => sources.map((source) => source.url).join("|"), [sources])
  const [sourceIndex, setSourceIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [volume, setVolume] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setSourceIndex(0)
    setError(null)
    setLoading(sources.length > 0)
    reportedUnavailableRef.current = false
  }, [sourceKey, sources.length])

  const activeSource = sources[sourceIndex]

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!activeSource) {
      setError("This channel does not currently provide a playable stream.")
      setLoading(false)
      return
    }

    setError(null)
    setLoading(true)
    let failureHandled = false

    const startPlayback = () => {
      if (autoPlay) video.play().catch(() => setPlaying(false))
    }

    const handleSourceFailure = () => {
      if (failureHandled) return
      failureHandled = true

      if (sourceIndex + 1 < sources.length) {
        setSourceIndex((index) => index + 1)
        return
      }

      setError("Every provider-published stream is currently unavailable.")
      setLoading(false)
      if (!reportedUnavailableRef.current) {
        reportedUnavailableRef.current = true
        onAllSourcesUnavailable?.()
      }
    }

    let hls: Hls | null = null
    const canUseNativeHls = Boolean(video.canPlayType("application/vnd.apple.mpegurl"))

    if (isHlsStream(activeSource.url) && Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        enableWorker: true,
        // Recover transient network/media errors before advancing sources.
        fragLoadingMaxRetry: 3,
        manifestLoadingMaxRetry: 2,
      })
      hls.loadSource(activeSource.url)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false)
        startPlayback()
      })
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) return
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          hls?.startLoad()
          return
        }
        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls?.recoverMediaError()
          return
        }
        handleSourceFailure()
      })
    } else if (isHlsStream(activeSource.url) && canUseNativeHls) {
      // Safari / iOS: native HLS
      video.src = activeSource.url
      video.onloadeddata = () => {
        setLoading(false)
        startPlayback()
      }
      video.onerror = handleSourceFailure
    } else {
      video.src = activeSource.url
      video.onloadeddata = () => {
        setLoading(false)
        startPlayback()
      }
      video.onerror = handleSourceFailure
    }

    return () => {
      hls?.destroy()
      video.onloadeddata = null
      video.onerror = null
      video.removeAttribute("src")
      video.load()
    }
  }, [activeSource, autoPlay, onAllSourcesUnavailable, sourceIndex, sources.length])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onVolumeChange = () => {
      setMuted(video.muted)
      setVolume(video.volume)
    }

    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)
    video.addEventListener("volumechange", onVolumeChange)
    setMuted(video.muted)
    setVolume(video.volume)

    return () => {
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
      video.removeEventListener("volumechange", onVolumeChange)
    }
  }, [])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    void (video.paused ? video.play() : video.pause())
  }, [])

  const pauseFromVideoSurface = useCallback(() => {
    const video = videoRef.current
    if (video && !video.paused) void video.pause()
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }, [])

  const handleVolume = useCallback((value: number) => {
    const video = videoRef.current
    if (!video) return
    video.volume = value
    setVolume(value)
    if (value > 0 && video.muted) {
      video.muted = false
      setMuted(false)
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
    } else {
      void video.requestFullscreen().catch(() => undefined)
    }
  }, [])

  if (error) {
    return (
      <div className={cn("grid place-items-center rounded-2xl border border-border/60 bg-card/50", className)}>
        <div className="max-w-md p-8 text-center">
          <Radio className="mx-auto mb-4 size-12 text-muted-foreground" />
          <p className="text-lg font-semibold">Stream Unavailable</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("group relative overflow-hidden rounded-2xl bg-black", className)}>
      <video
        ref={videoRef}
        poster={poster}
        className="size-full cursor-pointer object-contain"
        playsInline
        muted={muted}
        autoPlay={autoPlay}
        onClick={pauseFromVideoSurface}
      />

      {loading && (
        <div className="absolute inset-0 grid place-items-center bg-black/60">
          <div className="flex flex-col items-center gap-3">
            <div className="size-10 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            <span className="text-sm text-white/70">
              {sources.length > 1 ? `Trying stream ${sourceIndex + 1} of ${sources.length}...` : "Loading stream..."}
            </span>
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-100 transition-opacity sm:p-4 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={togglePlay} aria-label={playing ? "Pause stream" : "Play stream"} className="grid size-10 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30">
            {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
          </button>
          <button onClick={toggleMute} aria-label={muted || volume === 0 ? "Unmute stream" : "Mute stream"} className="grid size-10 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30">
            {muted || volume === 0 ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(event) => handleVolume(Number(event.target.value))} aria-label="Volume" className="w-16 accent-white sm:w-24" />
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded bg-red-500/20 px-2 py-1 text-[11px] font-bold text-red-400 sm:flex sm:items-center sm:gap-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-red-500" /> LIVE
            </span>
            <button onClick={toggleFullscreen} aria-label="Toggle fullscreen" className="grid size-10 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30">
              <Maximize className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
