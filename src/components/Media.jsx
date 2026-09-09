import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Media primitives.
 *
 * Both take the descriptors the content plugin emits, so a component never
 * builds a srcset or guesses a dimension — those are known at build time and
 * arrive as data.
 */

/**
 * A responsive image.
 *
 * Three things prevent layout shift and flashes: the intrinsic width and
 * height are always present, the wrapper reserves the aspect ratio, and the
 * dominant colour sits behind the image while it decodes so the space is
 * never a bright empty rectangle on a dark page.
 *
 * `priority` is for the one image above the fold — an entry's cover. Everything
 * else stays lazy, because a gallery of twelve should cost one request.
 */
export function Picture({ image, alt = "", sizes = "(min-width: 1024px) 720px, 100vw", priority = false, className, imgClassName }) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef(null);

  // An image restored from cache can finish before React attaches onLoad,
  // leaving it stuck at zero opacity. Checking `complete` on mount covers it.
  useEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, []);

  if (!image?.src) return null;

  const ratio = image.width && image.height ? `${image.width} / ${image.height}` : undefined;
  const sources = Object.entries(image.sources ?? {});

  return (
    <div className={cn("relative overflow-hidden", className)} style={{ aspectRatio: ratio, backgroundColor: image.color ?? "var(--muted)" }}>
      <picture>
        {sources.map(([type, srcSet]) => (
          <source key={type} type={type} srcSet={srcSet} sizes={sizes} />
        ))}
        <img
          ref={ref}
          src={image.src}
          alt={alt}
          width={image.width ?? undefined}
          height={image.height ?? undefined}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          fetchPriority={priority ? "high" : "auto"}
          onLoad={() => setLoaded(true)}
          className={cn("h-full w-full object-cover transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0", imgClassName)}
        />
      </picture>
    </div>
  );
}

/**
 * A video that costs nothing until someone wants it.
 *
 * `preload="none"` plus a poster means the browser fetches no video bytes on
 * page load. The source element is only attached once the user presses play,
 * so even the metadata request waits for intent.
 */
export function Video({ video, poster, caption, className, loop = false, muted = true }) {
  const [started, setStarted] = useState(false);
  const ref = useRef(null);

  if (!video?.src) return null;

  const ratio = poster?.width && poster?.height ? `${poster.width} / ${poster.height}` : "16 / 9";

  const start = () => {
    setStarted(true);
    // The source lands in the DOM on this render; play on the next tick.
    requestAnimationFrame(() => ref.current?.play?.());
  };

  return (
    <figure className={cn("not-prose", className)}>
      <div className="border-border relative overflow-hidden rounded-lg border" style={{ aspectRatio: ratio, backgroundColor: poster?.color ?? "var(--muted)" }}>
        <video ref={ref} controls={started} preload="none" playsInline loop={loop} muted={muted} poster={poster?.src} className="h-full w-full object-cover">
          {started && <source src={video.src} type="video/webm" />}
        </video>

        {!started && (
          <button type="button" onClick={start} className="group absolute inset-0 grid place-items-center bg-black/20 transition-colors hover:bg-black/10">
            <span className="sr-only">Play video</span>
            <span className="bg-background/90 group-hover:bg-background rounded-full p-4 transition-colors">
              <Play size={20} className="translate-x-px" aria-hidden="true" />
            </span>
          </button>
        )}
      </div>

      {caption && <figcaption className="text-muted-foreground mt-2 text-sm">{caption}</figcaption>}
    </figure>
  );
}

/** Audio needs no poster or gating; the element is already cheap. */
export function Audio({ audio, caption }) {
  if (!audio?.src) return null;
  return (
    <figure className="not-prose my-6">
      <audio controls preload="none" src={audio.src} className="w-full">
        Your browser cannot play this audio.
      </audio>
      {caption && <figcaption className="text-muted-foreground mt-2 text-sm">{caption}</figcaption>}
    </figure>
  );
}
