"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A clip label that plays its audio when clicked. Only one clip plays at a
 * time, matching the in-game player.
 */
export default function AudioLink({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = ref.current;
    return () => {
      audio?.pause();
    };
  }, []);

  function toggle() {
    const audio = ref.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
      return;
    }

    // Stop anything else that is already playing.
    document.querySelectorAll("audio").forEach((el) => {
      if (el !== audio) {
        el.pause();
        el.currentTime = 0;
      }
    });
    void audio.play().then(
      () => setPlaying(true),
      () => setPlaying(false)
    );
  }

  return (
    <>
      <audio
        ref={ref}
        src={src}
        preload="none"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        className="dv-audio"
        data-playing={playing}
        onClick={toggle}
        aria-label={`${playing ? "Stop" : "Play"} ${label}`}
      >
        {label}
      </button>
    </>
  );
}
