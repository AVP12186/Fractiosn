import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface VirtualControlsProps {
  onMove: (dx: number, dz: number) => void;
}

export const VirtualControls: React.FC<VirtualControlsProps> = ({ onMove }) => {
  return (
    <div className="fixed bottom-28 left-4 z-20 select-none opacity-80 hover:opacity-100 transition-opacity">
      <div className="relative w-28 h-28 bg-slate-950/70 border border-slate-700/60 rounded-full p-2 backdrop-blur-sm shadow-xl flex items-center justify-center">
        {/* Center Pad */}
        <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-600" />

        {/* Up */}
        <button
          onClick={() => onMove(0, -1.5)}
          className="absolute top-1.5 left-1/2 -translate-x-1/2 p-2 bg-slate-800/80 hover:bg-cyan-900/60 rounded-lg text-slate-300 hover:text-white active:scale-95 transition-all"
          title="Move North (W / Up)"
        >
          <ArrowUp className="w-4 h-4" />
        </button>

        {/* Down */}
        <button
          onClick={() => onMove(0, 1.5)}
          className="absolute bottom-1.5 left-1/2 -translate-x-1/2 p-2 bg-slate-800/80 hover:bg-cyan-900/60 rounded-lg text-slate-300 hover:text-white active:scale-95 transition-all"
          title="Move South (S / Down)"
        >
          <ArrowDown className="w-4 h-4" />
        </button>

        {/* Left */}
        <button
          onClick={() => onMove(-1.5, 0)}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 p-2 bg-slate-800/80 hover:bg-cyan-900/60 rounded-lg text-slate-300 hover:text-white active:scale-95 transition-all"
          title="Move West (A / Left)"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Right */}
        <button
          onClick={() => onMove(1.5, 0)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-slate-800/80 hover:bg-cyan-900/60 rounded-lg text-slate-300 hover:text-white active:scale-95 transition-all"
          title="Move East (D / Right)"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="text-[10px] font-mono text-slate-400 text-center mt-1">
        WASD / Arrows / Click Floor
      </div>
    </div>
  );
};
