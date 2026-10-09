import Image from "next/image";
import styles from "./LoadingShark.module.css";

interface LoadingSharkProps {
  paused?: boolean;
}

/** Decorative mascot; the surrounding loading screen provides the status text. */
export default function LoadingShark({ paused = false }: LoadingSharkProps) {
  return (
    <div className={styles.stage} data-paused={paused ? "true" : "false"} aria-hidden="true">
      <svg className={styles.currents} viewBox="0 0 200 200" fill="none">
        <g className={styles.currentLeft}>
          <path d="M15 107C24 98 33 98 43 102" />
          <path d="M10 124C21 117 30 117 38 121" />
          <path d="M27 142C32 139 36 139 42 141" />
        </g>
        <g className={styles.currentRight}>
          <path d="M157 101C168 98 176 99 186 106" />
          <path d="M163 119C173 115 182 116 191 123" />
          <path d="M157 138C163 136 169 137 174 140" />
        </g>
      </svg>
      <span className={styles.shadow} />
      <span className={styles.bubble + " " + styles.bubbleOne} />
      <span className={styles.bubble + " " + styles.bubbleTwo} />
      <span className={styles.bubble + " " + styles.bubbleThree} />
      <div className={styles.mascot}>
        <Image
          src="/logos/requin-192.png"
          alt=""
          width={192}
          height={192}
          loading="eager"
          unoptimized
          draggable={false}
          className={styles.shark}
        />
      </div>
    </div>
  );
}
