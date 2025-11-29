/*import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";

interface VideoCardProps {
  src: string; // e.g. "/videos/bse_tutorial.mp4"
  poster?: string; // optional poster image path
  className?: string;
}

export default function VideoCard({ src, poster, className = "" }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);

    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = async () => {
    const el = videoRef.current;
    if (!el) return;
    try {
      if (el.paused) {
        // attempt play (may be blocked on mobile/autoplay policies if not user gesture)
        await el.play();
        setIsPlaying(true);
        setShowControls(true);
      } else {
        el.pause();
        setIsPlaying(false);
      }
    } catch {
      // ignore play errors (autoplay policies)
    }
  };

  const toggleMute = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    // don't toggle if clicking control buttons
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    togglePlay();
  };

  return (
    <div
      className={`rounded-xl border border-border/50 bg-card overflow-hidden shadow-soft ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => !isPlaying && setShowControls(false)}
      onClick={handleContainerClick}
    >
      <div className="relative w-full aspect-[16/9] bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src={src}
          poster={poster}
          preload="metadata"
          playsInline
          // controls attribute intentionally omitted to use custom controls
        />

        {/* Center Play Button (smooth) */}
      /*  {!isPlaying && (
          <button
            aria-label="Play tutorial"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="absolute inset-0 m-auto w-20 h-20 rounded-full flex items-center justify-center bg-black/40 backdrop-blur-sm border border-white/20 transform transition-all duration-300 hover:scale-105 focus:outline-none"
            style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
          >
            <Play className="w-8 h-8 text-white" />
          </button>
        )}

        {/* Top-left badge */}
      /*  <div className="absolute left-3 top-3 px-3 py-1 rounded-full bg-black/40 text-xs text-white/90">
          Tutorial
        </div>

        {/* Bottom controls (fade-in) */}
      /*  <div
          className={`absolute left-0 right-0 bottom-0 px-3 py-2 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-between gap-2 transition-opacity duration-200 ${
            showControls || isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="p-2 rounded-md bg-white/5 hover:bg-white/10 focus:outline-none"
            >
              {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              aria-label={muted ? "Unmute" : "Mute"}
              className="p-2 rounded-md bg-white/5 hover:bg-white/10 focus:outline-none"
            >
              {muted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>

            <div className="text-xs text-white/80 ml-2">
              {/* basic time display (optional) */}
        /*      {/* You can add timeupdate listener to show current / duration if desired */}
        /*      {isPlaying ? "Playing" : "Paused"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-white/80 hover:underline"
            >
              Open
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const el = videoRef.current;
                if (!el) return;
                el.requestFullscreen?.();
              }}
              aria-label="Fullscreen"
              className="p-2 rounded-md bg-white/5 hover:bg-white/10 focus:outline-none"
            >
              <Maximize className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Caption below */}
   /*   <div className="p-3">
        <p className="text-sm font-medium text-foreground">How to perform your breast self-exam</p>
        <p className="text-xs text-muted-foreground mt-1">
          Short tutorial — watch the video and follow along with the checklist. If you see anything abnormal, contact a healthcare professional.
        </p>
      </div>
    </div>
  );
} */
