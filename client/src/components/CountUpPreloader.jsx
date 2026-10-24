// Lucian UX/UI Prompt #256 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#256
import React, { useEffect, useRef } from 'react';
import './CountUpPreloader.css';

export function CountUpPreloader() {
  const rootRef = useRef(null);
  const ldRef = useRef(null);
  const numSpanRef = useRef(null);
  const barRef = useRef(null);
  const timerRef = useRef(null);

  const setProgress = (val) => {
    if (numSpanRef.current) numSpanRef.current.textContent = String(val);
    if (barRef.current) barRef.current.style.width = `${val}%`;
    if (ldRef.current) ldRef.current.setAttribute('aria-valuenow', String(val));
  };

  const load = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const root = rootRef.current;
    if (!root) return;

    // Snap reset without transition
    root.classList.add('is-snap');
    root.classList.remove('is-open');
    void root.offsetWidth; // Force reflow
    root.classList.remove('is-snap');

    let v = 0;
    setProgress(0);

    const rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (rm) {
      setProgress(100);
      root.classList.add('is-open');
      return;
    }

    const step = () => {
      if (!rootRef.current || !rootRef.current.isConnected) return;
      v = Math.min(100, v + (Math.random() < 0.18 ? 0 : 2 + Math.floor(Math.random() * (v > 80 ? 4 : 9))));
      setProgress(v);
      if (v < 100) {
        timerRef.current = setTimeout(step, Math.random() < 0.12 ? 260 : 45);
      } else {
        timerRef.current = setTimeout(() => {
          if (rootRef.current) rootRef.current.classList.add('is-open');
        }, 300);
      }
    };

    step();
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let io;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries[0] && entries[0].isIntersecting) {
            io.disconnect();
            load();
          }
        },
        { threshold: 0.4 }
      );
      io.observe(root);
    } else {
      load();
    }

    return () => {
      if (io) io.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div ref={rootRef} className="ux u256">
      <div className="u256-site">
        <div className="u256-nv" data-s style={{ '--d': '.15s' }}>
          <b>Travel With Me</b>
          <span>
            <span>Tour</span>
            <span>Khám Phá</span>
            <span>Liên Hệ</span>
          </span>
        </div>
        <div className="u256-ph" data-s style={{ '--d': '.25s' }} aria-hidden="true"></div>
        <h3 className="u256-hd" data-s style={{ '--d': '.45s' }}>
          Khám phá kỳ quan<br />hành trình độc bản
        </h3>
        <div className="u256-sb" data-s style={{ '--d': '.6s' }}>
          Việt Nam · since 2026
        </div>
      </div>
      <div
        ref={ldRef}
        className="u256-ld"
        role="progressbar"
        aria-label="Đang tải dữ liệu chuyến đi"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={0}
      >
        <div className="u256-hf u256-a"></div>
        <div className="u256-hf u256-b"></div>
        <div className="u256-bn">Travel With Me</div>
        <div className="u256-ct">
          <small>Đang tải hành trình...</small>
          <div className="u256-n">
            <span ref={numSpanRef}>0</span>
            <i>%</i>
          </div>
          <div className="u256-br">
            <i ref={barRef}></i>
          </div>
        </div>
      </div>
      <button
        type="button"
        className="u256-re"
        onClick={load}
        aria-label="Tải lại hoạt ảnh preloader"
      >
        Reload
      </button>
    </div>
  );
}
