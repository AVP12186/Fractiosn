import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Radio, SkipForward } from 'lucide-react';
import { drawActor, random } from './art';
import { ClassId } from './classes';
import { filmFor } from './campaign';
import { audio } from './audio';

function FilmScene({ shot, survivor }: { shot: string; survivor: ClassId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!.getContext('2d')!, rand = random(32);
    const towers = Array.from({ length: 32 }, (_, i) => ({ x: i * 42, h: 45 + rand() * 145, w: 30 + rand() * 20 }));
    const motes = Array.from({ length: 65 }, () => ({ x: rand() * 960, y: rand() * 420, speed: 3 + rand() * 20 }));
    let raf = 0, start = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const draw = (ms: number) => {
      if (!start) start = ms;
      const t = reduced ? 0 : (ms - start) / 1000, dawn = shot === 'dawn', lab = shot === 'lab';
      c.imageSmoothingEnabled = false;
      const sky = c.createLinearGradient(0, 0, 0, 420); sky.addColorStop(0, dawn ? '#344f63' : lab ? '#16383b' : '#101e29'); sky.addColorStop(1, dawn ? '#e8b18a' : '#5b7063'); c.fillStyle = sky; c.fillRect(0, 0, 960, 420);
      c.fillStyle = dawn ? '#f5d1a0' : '#c0c5ac'; c.beginPath(); c.arc(dawn ? 705 : 760, dawn ? 180 : 90, dawn ? 53 : 24, 0, Math.PI * 2); c.fill();
      for (let layer = 0; layer < 3; layer++) {
        c.fillStyle = ['#35494a', '#293f3c', '#20352f'][layer]; c.beginPath(); c.moveTo(0, 340);
        for (let x = -80; x <= 1040; x += 60) c.lineTo(x, 200 + layer * 32 + Math.sin(x * .007 + layer * 3 + t * .005) * 45);
        c.lineTo(1040, 420); c.lineTo(0, 420); c.fill();
      }
      if (lab) {
        c.fillStyle = '#263f3d'; c.fillRect(110, 100, 520, 230); c.fillStyle = '#60877b'; c.fillRect(110, 100, 520, 8);
        for (let x = 140; x < 610; x += 62) { c.fillStyle = '#83b6a833'; c.fillRect(x, 130, 40, 80); c.fillStyle = '#b5dfc755'; c.fillRect(x, 130, 40, 3); }
        c.fillStyle = '#c8dbbc'; c.fillRect(326, 235, 82, 18); c.fillRect(357, 203, 19, 82);
      } else for (const b of towers) {
        const x = (b.x - t * 1.8 + 1120) % 1120 - 80;
        c.fillStyle = '#1a302c'; c.fillRect(x, 326 - b.h, b.w, b.h);
        c.fillStyle = '#c6b78555'; for (let y = 340 - b.h; y < 302; y += 23) c.fillRect(x + 7, y, 4, 7);
      }
      if (['tower', 'radio', 'dawn'].includes(shot)) {
        c.strokeStyle = '#c1b58d'; c.lineWidth = 4; c.beginPath(); c.moveTo(664, 325); c.lineTo(704, 62); c.lineTo(744, 325); c.moveTo(682, 210); c.lineTo(729, 210); c.moveTo(692, 147); c.lineTo(718, 147); c.stroke();
        c.fillStyle = '#efb375'; c.fillRect(699, 55, 10, 10);
        for (let i = 0; i < 4; i++) { const r = (t * 25 + i * 60) % 250; c.strokeStyle = `rgba(225,190,133,${(1 - r / 250) * .3})`; c.lineWidth = 1; c.beginPath(); c.arc(704, 60, r, 0, Math.PI * 2); c.stroke(); }
      }
      c.fillStyle = '#142923'; c.fillRect(0, 325, 960, 95); c.fillStyle = '#4c5b46'; c.fillRect(0, 329, 960, 3);
      c.fillStyle = '#aeac7455'; for (let x = -60; x < 1040; x += 100) c.fillRect((x - t * 12 + 1100) % 1100 - 80, 377, 48, 3);
      drawActor(c, survivor, 335 + Math.sin(t * .6) * 8, 345, -.18, Math.floor(t * 5) % 4, 1.8);
      if (shot === 'survivor' || dawn) { drawActor(c, 'medic', 480, 340, 2.5, 0, 1.6); if (dawn) drawActor(c, 'scavenger', 540, 342, 2.5, 0, 1.1); }
      for (const p of motes) { c.fillStyle = dawn ? '#ffdab657' : '#c0d1b24a'; c.fillRect((p.x + t * p.speed) % 960, (p.y + t * 3) % 420, 2, 2); }
      const shade = c.createLinearGradient(0, 0, 0, 420); shade.addColorStop(0, '#06101250'); shade.addColorStop(.5, 'transparent'); shade.addColorStop(1, '#06120e99'); c.fillStyle = shade; c.fillRect(0, 0, 960, 420);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf);
  }, [shot, survivor]);
  return <canvas ref={ref} width={960} height={420} aria-hidden="true" />;
}

export function Cinematic({ completed, survivor, onFinish }: { completed: number; survivor: ClassId; onFinish: () => void }) {
  const film = filmFor(completed), [index, setIndex] = useState(0), [letters, setLetters] = useState(0);
  const current = film.frames[index], button = useRef<HTMLButtonElement>(null);
  useEffect(() => { button.current?.focus(); }, []);
  useEffect(() => { setLetters(0); const timer = setInterval(() => setLetters(n => Math.min(current.text.length, n + 2)), 26); return () => clearInterval(timer); }, [index, current.text]);
  const next = () => { audio.play('click'); if (letters < current.text.length) setLetters(current.text.length); else if (index < film.frames.length - 1) setIndex(n => n + 1); else onFinish(); };
  useEffect(() => { const key = (e: KeyboardEvent) => { if (['Space', 'Enter'].includes(e.code)) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) next(); } }; window.addEventListener('keydown', key, true); return () => window.removeEventListener('keydown', key, true); });
  return <section className="cinematic" role="dialog" aria-modal="true" aria-label={film.title}>
    <header><span>DEAD SIGNAL <b> / NORTHBOUND</b></span><button onClick={onFinish}><SkipForward size={15} />SKIP CUTSCENE</button></header>
    <div className="cinema-frame"><FilmScene shot={current.shot} survivor={survivor} /><div className="cinema-grain" /><div className="cinema-title"><small>{film.subtitle}</small><h2>{film.title}</h2></div><span className="cinema-timestamp">REC {String(completed).padStart(3, '0')} : {String(index + 1).padStart(2, '0')}</span></div>
    <div className="cinema-dialogue"><div><Radio size={16} /><span>{current.speaker}</span><i /></div><p aria-label={current.text}><span aria-hidden="true">{current.text.slice(0, letters)}<span className="type-caret">▌</span></span></p><footer><span>{film.frames.map((_, n) => <i key={n} className={n === index ? 'active' : ''} />)}</span><button ref={button} className="primary-button" onClick={next}>{letters < current.text.length ? 'SHOW TRANSMISSION' : index === film.frames.length - 1 ? completed === 100 ? 'SEE THE DAWN' : 'KEEP MOVING' : 'CONTINUE'}<ArrowRight size={17} /></button></footer></div>
  </section>;
}
