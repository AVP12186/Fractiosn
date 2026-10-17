import { useRef, useState } from 'react';
import { Crosshair, Zap } from 'lucide-react';
import { ShooterEngine } from './engine';

export function TouchControls({ engine }: { engine: React.RefObject<ShooterEngine | null> }) {
  const stick = useRef<HTMLDivElement>(null), [offset, setOffset] = useState({ x: 0, y: 0 });
  const move = (e: React.PointerEvent) => {
    const box = stick.current!.getBoundingClientRect(); let x = (e.clientX - box.left - box.width / 2) / 37, y = (e.clientY - box.top - box.height / 2) / 37;
    const d = Math.hypot(x, y); if (d > 1) { x /= d; y /= d; } setOffset({ x: x * 28, y: y * 28 }); engine.current?.setMove(x, y);
  };
  const stop = () => { setOffset({ x: 0, y: 0 }); engine.current?.setMove(0, 0); };
  return <div className="touch-controls"><div ref={stick} className="touch-stick" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); move(e); }} onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e); }} onPointerUp={stop} onPointerCancel={stop}><span style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }} /><small>MOVE</small></div><div className="touch-actions"><button onClick={() => engine.current?.reload()} aria-label="Reload">R</button><button onClick={() => engine.current?.ability()} aria-label="Use class ability">Q</button><button onClick={() => engine.current?.dash()} aria-label="Dash"><Zap size={19} /></button><button className="touch-fire" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); engine.current?.setFiring(true); }} onPointerUp={() => engine.current?.setFiring(false)} onPointerCancel={() => engine.current?.setFiring(false)}><Crosshair />FIRE</button></div></div>;
}
