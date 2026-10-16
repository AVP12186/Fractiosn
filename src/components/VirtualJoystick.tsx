import React, { useState, useRef, useEffect, useCallback } from 'react';

interface VirtualJoystickProps {
  onMoveVector: (vx: number, vz: number) => void;
  className?: string;
}

export const VirtualJoystick: React.FC<VirtualJoystickProps> = ({
  onMoveVector,
  className = '',
}) => {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const baseRef = useRef<HTMLDivElement>(null);
  const maxRadius = 45; // Max knob drag radius

  const onMoveVectorRef = useRef(onMoveVector);
  useEffect(() => {
    onMoveVectorRef.current = onMoveVector;
  }, [onMoveVector]);

  const handlePointerStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    handlePointerMove(clientX, clientY);
  };

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    let finalX = dx;
    let finalY = dy;

    if (dist > maxRadius) {
      finalX = (dx / dist) * maxRadius;
      finalY = (dy / dist) * maxRadius;
    }

    setKnobPos({ x: finalX, y: finalY });

    // Send normalized vector (-1 to 1)
    const vx = finalX / maxRadius;
    const vz = finalY / maxRadius;
    onMoveVectorRef.current(vx, vz);
  }, [maxRadius]);

  const handlePointerEnd = useCallback(() => {
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    onMoveVectorRef.current(0, 0);
  }, []);

  // Window listeners so dragging outside the ring never loses control
  useEffect(() => {
    if (!isDragging) return;

    const onWindowPointerMove = (e: PointerEvent) => {
      e.preventDefault();
      handlePointerMove(e.clientX, e.clientY);
    };

    const onWindowPointerUp = () => {
      handlePointerEnd();
    };

    window.addEventListener('pointermove', onWindowPointerMove, { passive: false });
    window.addEventListener('pointerup', onWindowPointerUp);
    window.addEventListener('pointercancel', onWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', onWindowPointerMove);
      window.removeEventListener('pointerup', onWindowPointerUp);
      window.removeEventListener('pointercancel', onWindowPointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerEnd]);

  return (
    <div className={`select-none touch-none ${className}`}>
      {/* Joystick Outer Ring Base */}
      <div
        ref={baseRef}
        onPointerDown={(e) => {
          e.preventDefault();
          handlePointerStart(e.clientX, e.clientY);
        }}
        className="relative w-32 h-32 rounded-full bg-slate-950/90 border-2 border-cyan-400/80 shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-md flex items-center justify-center cursor-grab active:cursor-grabbing pointer-events-auto"
        style={{ touchAction: 'none' }}
      >
        {/* Directional Marks */}
        <div className="absolute top-2.5 w-1.5 h-3 bg-cyan-300 rounded-full" />
        <div className="absolute bottom-2.5 w-1.5 h-3 bg-cyan-300 rounded-full" />
        <div className="absolute left-2.5 w-3 h-1.5 bg-cyan-300 rounded-full" />
        <div className="absolute right-2.5 w-3 h-1.5 bg-cyan-300 rounded-full" />

        {/* Center Target Disc */}
        <div className="w-10 h-10 rounded-full border border-cyan-700 bg-cyan-950/60 pointer-events-none" />

        {/* Draggable Analog Thumbstick Knob */}
        <div
          className="absolute w-14 h-14 rounded-full bg-gradient-to-b from-cyan-300 via-cyan-500 to-blue-600 border-2 border-white shadow-[0_0_16px_rgba(34,211,238,0.8)] flex items-center justify-center pointer-events-none transition-transform duration-75"
          style={{
            transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
          }}
        >
          {/* Inner Core */}
          <div className="w-6 h-6 rounded-full bg-slate-900/70 border border-white/60 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
          </div>
        </div>
      </div>

      <div className="text-[10px] font-retro text-cyan-300 text-center mt-1.5 drop-shadow font-bold">
        🕹️ DRAG TO MOVE
      </div>
    </div>
  );
};
