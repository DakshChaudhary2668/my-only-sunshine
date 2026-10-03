"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { trackEvent } from "@/lib/track-event";
import { MemoryImage, SunflowerMark } from "./memory-image";
import styles from "./page.module.css";

const INTRO = `I understand why that day changed the way you saw me.\n\nBas itna kehna chahta hoon —\nek galat moment aur ek insaan ki poori niyat same cheez nahi hoti.`;

const LETTER = `When life wasn’t making much sense, you arrived unexpectedly… and somehow made my days a little brighter.

Mujhse uss din galti hui, and I know that. But jo main kabhi properly keh nahi paaya — aapke saath main kaafi time baad genuinely safe feel karta tha.

Mujhe laga tha ki shayad 4 saal baad mera birthday sirf ek normal date nahi hoga. Ki shayad kisi ke saath main ‘Developer Daksh’, deadlines aur responsibilities se bahar aa kar bas Daksh ban paunga — woh version jo kahin responsibilities sambhalte-sambhalte peeche reh gaya tha.

Main jaanta hoon aap mujhe maaf kar chuki ho, aur main aapse kuch maang nahi raha.

Bas haan… I still miss my sunshine sometimes.

Aapne bola tha, ‘Bullet train mat bano, gadbad ho jayegi.’
Thoda bewakoof toh hoon — aap jaanti hi ho.

Aur phir kisi ne kaha tha, ‘Ghoom-phir ke wapas yahin aana.’
Maine bola tha — ‘Just like a boomerang.’

Shayad boomerang ka matlab hamesha kisi insaan ke paas wapas aana nahi hota. Kabhi-kabhi woh bas un feelings, lessons aur memories tak wapas le aata hai jo humein thoda better bana deti hain.

Thank you for being a beautiful part of a very confusing phase of my life.

— Daksh
a.k.a. Dakshita Didi :)`;

const HIGHLIGHTS = ["genuinely safe", "bas Daksh", "my sunshine", "Just like a boomerang"];
const MEMORIES = ["/memories/photo-1.jpg", "/memories/photo-2.jpg"];

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useTypewriter(text: string, speed: number, enabled: boolean, reducedMotion: boolean) {
  const [length, setLength] = useState(0);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setLength(0);
      setSkipped(false);
      return;
    }
    if (reducedMotion || skipped) {
      setLength(text.length);
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;
    const type = (index: number) => {
      setLength(index);
      if (index >= text.length) return;
      const char = text[index - 1];
      const pause = /[.!?…]/.test(char) ? 260 : /[,;:—]/.test(char) ? 110 : char === "\n" ? 150 : 0;
      timeout = setTimeout(() => type(index + 1), speed + pause);
    };
    timeout = setTimeout(() => type(1), 420);
    return () => clearTimeout(timeout);
  }, [enabled, reducedMotion, skipped, speed, text]);

  return [text.slice(0, length), length >= text.length, () => setSkipped(true)] as const;
}

function renderHighlighted(text: string) {
  const pattern = new RegExp(`(${HIGHLIGHTS.join("|")})`, "g");
  return text.split(pattern).map((part, index) =>
    HIGHLIGHTS.includes(part) ? <mark key={`${part}-${index}`}>{part}</mark> : part,
  );
}

export default function SunshineLetter() {
  const reducedMotion = useReducedMotion();
  const [scene, setScene] = useState<"intro" | "memories" | "letter">("intro");
  const [activeMemory, setActiveMemory] = useState(0);
  const [introReady, setIntroReady] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicUnavailable, setMusicUnavailable] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const memoriesRef = useRef<HTMLElement>(null);
  const letterRef = useRef<HTMLElement>(null);
  const finalRef = useRef<HTMLElement>(null);
  const [introText, introDone] = useTypewriter(INTRO, 40, scene === "intro", reducedMotion);
  const [letterText, letterDone, showFullLetter] = useTypewriter(LETTER, 19, scene === "letter", reducedMotion);

  useEffect(() => {
    if (!introDone) {
      setIntroReady(false);
      return;
    }
    const timeout = setTimeout(() => setIntroReady(true), reducedMotion ? 0 : 800);
    return () => clearTimeout(timeout);
  }, [introDone, reducedMotion]);

  useEffect(() => {
    if (scene !== "memories" || activeMemory === 1 || reducedMotion) return;
    const timeout = setTimeout(() => setActiveMemory(1), 4000);
    return () => clearTimeout(timeout);
  }, [activeMemory, reducedMotion, scene]);

  useEffect(() => {
    const interaction = () => {
      trackEvent("human_visit");
      ["pointerdown", "scroll", "keydown"].forEach((event) => window.removeEventListener(event, interaction));
    };
    ["pointerdown", "scroll", "keydown"].forEach((event) => window.addEventListener(event, interaction, { passive: true }));
    return () => ["pointerdown", "scroll", "keydown"].forEach((event) => window.removeEventListener(event, interaction));
  }, []);

  useEffect(() => {
    if (scene === "memories" && activeMemory === 1) trackEvent("slideshow_viewed");
  }, [activeMemory, scene]);

  useEffect(() => {
    const element = finalRef.current;
    if (scene !== "letter" || !letterDone || !element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) trackEvent("letter_finished");
    }, { threshold: 0.5 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [letterDone, scene]);

  useEffect(() => {
    setMusicPlaying(sessionStorage.getItem("sunshine-music") === "playing");
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !musicPlaying) return;
    audio.volume = reducedMotion ? 0.32 : 0;
    audio.play().catch(() => {
      setMusicPlaying(false);
      setMusicUnavailable(true);
      sessionStorage.removeItem("sunshine-music");
    });
  }, [musicPlaying, reducedMotion]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    let frame: number;
    const target = musicPlaying ? 0.32 : 0;
    const fade = () => {
      const difference = target - audio.volume;
      if (Math.abs(difference) < 0.015) {
        audio.volume = target;
        if (!musicPlaying) audio.pause();
        return;
      }
      audio.volume = Math.max(0, Math.min(1, audio.volume + Math.sign(difference) * 0.012));
      frame = requestAnimationFrame(fade);
    };
    frame = requestAnimationFrame(fade);
    return () => cancelAnimationFrame(frame);
  }, [musicPlaying]);

  const startMusic = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setMusicUnavailable(false);
    audio.volume = reducedMotion ? 0.32 : 0;
    audio.play().then(() => {
      setMusicPlaying(true);
      sessionStorage.setItem("sunshine-music", "playing");
      trackEvent("music_played");
    }).catch(() => {
      setMusicPlaying(false);
      setMusicUnavailable(true);
      sessionStorage.removeItem("sunshine-music");
    });
  }, [reducedMotion]);

  const toggleMusic = useCallback(() => {
    if (!musicPlaying) return startMusic();
    setMusicPlaying(false);
    sessionStorage.setItem("sunshine-music", "paused");
  }, [musicPlaying, startMusic]);

  const paragraphs = useMemo(() => letterText.split("\n\n"), [letterText]);

  const continueToMemories = () => {
    startMusic();
    setScene("memories");
    requestAnimationFrame(() => memoriesRef.current?.focus());
  };

  const continueToLetter = () => {
    trackEvent("letter_opened");
    setScene("letter");
    requestAnimationFrame(() => letterRef.current?.focus());
  };

  return (
    <main className={`${styles.experience} ${scene === "letter" ? styles.letterOpen : ""}`}>
      <audio ref={audioRef} src="/audio/instrumental.mp3" loop preload="metadata" />
      <button className={styles.musicButton} type="button" onClick={toggleMusic} aria-pressed={musicPlaying}>
        <span aria-hidden="true">♫</span> {musicUnavailable ? "Music unavailable" : musicPlaying ? "Playing" : "Play music"}
      </button>

      {scene === "intro" ? (
        <section className={styles.intro} aria-labelledby="intro-message">
          <div className={styles.sunHalo} aria-hidden="true" />
          <div className={styles.introContent}>
            <div className={styles.introFlower}><SunflowerMark /></div>
            <h1 id="intro-message" className={styles.introText}>
              {introText}
              {!introDone && <span className={styles.cursor} aria-hidden="true" />}
            </h1>
            <div className={`${styles.invitation} ${introReady ? styles.visible : ""}`} aria-hidden={!introReady}>
              <p>There’s something I wanted to say properly.</p>
              <button type="button" onClick={continueToMemories} tabIndex={introReady ? 0 : -1}>
                Continue <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </section>
      ) : scene === "memories" ? (
        <section ref={memoriesRef} className={styles.memoryScene} tabIndex={-1} aria-labelledby="memories-heading">
          <div className={styles.memoryGlow} aria-hidden="true" />
          <div className={styles.slideshow}>
            <div className={styles.memoryTitle}>
              <SunflowerMark />
              <h2 id="memories-heading">A couple of soft moments</h2>
            </div>

            <div className={styles.slides} aria-live="polite">
              <div className={styles.memoryFallback} aria-hidden="true"><SunflowerMark /></div>
              {MEMORIES.map((src, index) => (
                // Native images keep the two-photo crossfade dependency-free.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={src}
                  className={index === activeMemory ? styles.activeSlide : undefined}
                  src={src}
                  alt={`Memory ${index + 1} of ${MEMORIES.length}`}
                  aria-hidden={index !== activeMemory}
                  onError={({ currentTarget }) => { currentTarget.hidden = true; }}
                />
              ))}
              <button
                className={`${styles.slideArrow} ${styles.previous}`}
                type="button"
                aria-label="Previous photo"
                onClick={() => setActiveMemory((activeMemory + 1) % MEMORIES.length)}
              >
                ←
              </button>
              <button
                className={`${styles.slideArrow} ${styles.next}`}
                type="button"
                aria-label="Next photo"
                onClick={() => setActiveMemory((activeMemory + 1) % MEMORIES.length)}
              >
                →
              </button>
            </div>

            <div className={styles.dots} aria-label="Choose a memory">
              {MEMORIES.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={index === activeMemory ? styles.activeDot : undefined}
                  aria-label={`Show photo ${index + 1}`}
                  aria-current={index === activeMemory ? "true" : undefined}
                  onClick={() => setActiveMemory(index)}
                />
              ))}
            </div>

            <p className={styles.memoryLine}>Some moments stay softer than we expect.</p>
            {activeMemory === 1 && (
              <button className={styles.continueLetter} type="button" onClick={continueToLetter}>
                Continue to the letter <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </section>
      ) : (
        <div className={styles.letterScene}>
          <div className={styles.dust} aria-hidden="true" />
          <section ref={letterRef} className={styles.letterWrap} tabIndex={-1} aria-labelledby="letter-heading">
            <p className={styles.eyebrow}>A note, written properly</p>
            <article className={styles.letterCard}>
              <header>
                <SunflowerMark />
                <p>Nidhi,</p>
              </header>
              <h2 id="letter-heading" className={styles.srOnly}>A letter for Nidhi</h2>
              <div className={styles.letterBody} aria-live="polite" aria-busy={!letterDone}>
                {paragraphs.map((paragraph, index) => (
                  <p key={index} className={paragraph.startsWith("— Daksh") ? styles.signature : undefined}>
                    {renderHighlighted(paragraph)}
                    {index === paragraphs.length - 1 && !letterDone && <span className={styles.cursor} aria-hidden="true" />}
                  </p>
                ))}
              </div>
              {!letterDone && (
                <button className={styles.skipButton} type="button" onClick={showFullLetter}>
                  Show full message
                </button>
              )}
            </article>

            <aside className={styles.memory} aria-label="A photo placeholder for a shared memory">
              <MemoryImage src="/memories/keychain.jpg" alt="A little memory" />
            </aside>
          </section>

          <section ref={finalRef} className={`${styles.finalMoment} ${letterDone ? styles.finalVisible : ""}`} aria-hidden={!letterDone}>
            <div className={styles.petals} aria-hidden="true"><i /><i /><i /></div>
            <SunflowerMark />
            <blockquote>
              Some people become memories.<br />
              Some memories become lessons.<br />
              And some lessons quietly make us better.
            </blockquote>
            <p>Take care, Sunshine.</p>
          </section>
        </div>
      )}
    </main>
  );
}
