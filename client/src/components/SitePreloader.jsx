// Lucian UX/UI Prompt #256 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#256
import React, { useEffect, useRef } from 'react';
import './SitePreloader.css';

/**
 * SitePreloader – full-screen version shown on login success.
 * Counts 0→100, splits curtain, then calls onDone().
 */
export function SitePreloader({ onDone }) {
  const rootRef = useRef(null);
  const numRef = useRef(null);
  const barRef = useRef(null);
  const ldRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let v = 0;
    const setVal = (n) => {
      if (numRef.current) numRef.current.textContent = String(n);
      if (barRef.current) barRef.current.style.width = `${n}%`;
      if (ldRef.current) ldRef.current.setAttribute('aria-valuenow', String(n));
    };

    if (rm) {
      setVal(100);
      root.classList.add('spl-open');
      timerRef.current = setTimeout(() => onDone && onDone(), 400);
      return;
    }

    const step = () => {
      if (!rootRef.current) return;
      v = Math.min(100, v + (Math.random() < 0.18 ? 0 : 2 + Math.floor(Math.random() * (v > 80 ? 4 : 9))));
      setVal(v);
      if (v < 100) {
        timerRef.current = setTimeout(step, Math.random() < 0.12 ? 260 : 45);
      } else {
        timerRef.current = setTimeout(() => {
          root.classList.add('spl-open');
          timerRef.current = setTimeout(() => onDone && onDone(), 950);
        }, 300);
      }
    };
    step();

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [onDone]);

  return (
    <div ref={rootRef} className="spl-root" aria-live="polite">
      {/* Site preview behind curtain */}
      <div className="spl-site">
        <div className="spl-nv" data-s style={{ '--d': '.1s' }}>
          <b>Travel With Me</b>
          <span>
            <span>Tour</span>
            <span>Khám Phá</span>
            <span>Liên Hệ</span>
          </span>
        </div>
        <div className="spl-ph" data-s style={{ '--d': '.2s' }} aria-hidden="true"></div>
        <h2 className="spl-hd" data-s style={{ '--d': '.38s' }}>
          Khám phá kỳ quan<br />hành trình độc bản
        </h2>
        <p className="spl-sb" data-s style={{ '--d': '.52s' }}>Việt Nam · since 2026</p>
      </div>

      {/* Curtain – top half */}
      <div className="spl-hf spl-a"></div>
      {/* Curtain – bottom half */}
      <div className="spl-hf spl-b"></div>

      {/* Loading overlay content */}
      <div
        ref={ldRef}
        className="spl-overlay"
        role="progressbar"
        aria-label="Đang tải Travel With Me"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
      >
        <div className="spl-brand">Travel With Me ✈️</div>
        <div className="spl-center">
          <small className="spl-label">Đang tải hành trình...</small>
          <div className="spl-num">
            <span ref={numRef}>0</span><i>%</i>
          </div>
          <div className="spl-bar">
            <i ref={barRef}></i>
          </div>
        </div>
      </div>
    </div>
  );
}
