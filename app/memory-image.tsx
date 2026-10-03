"use client";

import { useState } from "react";
import styles from "./page.module.css";

type MemoryImageProps = {
  src: string;
  alt: string;
  caption?: string;
};

export function MemoryImage({ src, alt, caption = "a little memory" }: MemoryImageProps) {
  const [missing, setMissing] = useState(false);

  return (
    <figure className={styles.memoryPhoto} aria-label={missing ? `${alt} — photo can be added later` : undefined}>
      {missing ? (
        <div className={styles.photoPlaceholder} aria-hidden="true">
          <SunflowerMark />
        </div>
      ) : (
        // A native image keeps this optional placeholder simple and resilient.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} onError={() => setMissing(true)} />
      )}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function SunflowerMark({ decorative = true }: { decorative?: boolean }) {
  return (
    <svg
      className={styles.sunflower}
      viewBox="0 0 96 96"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : "Sunflower"}
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M48 35C39 24 43 12 48 8c5 4 9 16 0 27ZM58 39c2-14 14-19 20-18 1 7-5 18-20 18ZM61 49c11-9 23-5 27 0-4 5-16 9-27 0ZM57 59c14 2 19 14 18 20-7 1-18-5-18-20ZM47 62c9 11 5 23 0 27-5-4-9-16 0-27ZM37 58c-2 14-14 19-20 18-1-7 5-18 20-18ZM34 48c-11 9-23 5-27 0 4-5 16-9 27 0ZM38 38c-14-2-19-14-18-20 7-1 18 5 18 20Z" />
        <circle cx="48" cy="48" r="14" />
        <path d="M40 48c4-4 12-4 16 0M42 54c3 2 9 2 12 0" opacity=".65" />
      </g>
    </svg>
  );
}
