import React from 'react';
import { Fraction, fractionToDecimal, fractionToString } from '../types/game';

interface FractionBeakerProps {
  fraction: Fraction;
  targetFraction?: Fraction;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showPie?: boolean;
  label?: string;
}

export const FractionBeaker: React.FC<FractionBeakerProps> = ({
  fraction,
  targetFraction,
  color = '#38bdf8',
  size = 'md',
  showPie = true,
  label,
}) => {
  const currentRatio = Math.min(1.5, Math.max(0, fractionToDecimal(fraction)));
  const targetRatio = targetFraction ? Math.min(1.5, Math.max(0, fractionToDecimal(targetFraction))) : undefined;

  const isMatched = targetFraction ? Math.abs(currentRatio - targetRatio!) < 0.001 : false;

  const heightCls = size === 'sm' ? 'h-16 w-10' : size === 'lg' ? 'h-32 w-16' : 'h-24 w-12';
  const pieSize = size === 'sm' ? 36 : size === 'lg' ? 64 : 48;

  // Generate pie slices SVG
  const renderPieSlices = () => {
    const d = fraction.d || 1;
    const n = Math.min(d, Math.max(0, fraction.n));
    const r = pieSize / 2 - 2;
    const cx = pieSize / 2;
    const cy = pieSize / 2;

    if (d === 1) {
      return (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={n >= 1 ? color : 'rgba(255,255,255,0.08)'}
          stroke="#475569"
          strokeWidth="1.5"
        />
      );
    }

    const paths = [];
    const step = (2 * Math.PI) / d;

    for (let i = 0; i < d; i++) {
      const startAngle = i * step - Math.PI / 2;
      const endAngle = (i + 1) * step - Math.PI / 2;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const largeArc = step > Math.PI ? 1 : 0;
      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      const isFilled = i < n;
      paths.push(
        <path
          key={i}
          d={pathData}
          fill={isFilled ? color : 'rgba(255, 255, 255, 0.08)'}
          stroke="#334155"
          strokeWidth="1"
          className="transition-colors duration-300"
        />
      );
    }

    return paths;
  };

  return (
    <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700/60 rounded-xl p-2.5 shadow-lg backdrop-blur-sm select-none">
      {/* Cylindrical Potion Flask */}
      <div className="flex flex-col items-center">
        <div className={`relative ${heightCls} rounded-b-xl border-2 border-slate-500/80 bg-slate-950/80 overflow-hidden flex flex-col justify-end shadow-inner`}>
          {/* Flask Rim */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-600/80 border-b border-slate-500" />

          {/* Liquid Volume */}
          <div
            className="w-full transition-all duration-300 relative"
            style={{
              height: `${Math.min(100, (currentRatio / 1.0) * 100)}%`,
              backgroundColor: color,
              boxShadow: `0 0 12px ${color}88`,
            }}
          >
            {/* Liquid Surface Ripple */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/40" />
            {/* Bubbles */}
            <div className="absolute bottom-1 left-2 w-1 h-1 bg-white/50 rounded-full animate-bounce" />
            <div className="absolute bottom-3 right-2 w-1.5 h-1.5 bg-white/30 rounded-full" />
          </div>

          {/* Target marker line if comparing */}
          {targetRatio !== undefined && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-amber-400 z-10 transition-all duration-300"
              style={{ bottom: `${Math.min(100, (targetRatio / 1.0) * 100)}%` }}
              title={`Target: ${targetFraction?.n}/${targetFraction?.d}`}
            >
              <div className="w-1.5 h-1.5 bg-amber-400 -mt-0.5 rounded-full" />
            </div>
          )}

          {/* Calibrated Tick Marks for denominator */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-1 px-0.5">
            {Array.from({ length: Math.min(12, fraction.d) }).map((_, i) => (
              <div key={i} className="w-1.5 h-[1px] bg-white/20 self-end" />
            ))}
          </div>
        </div>
        <span className="text-[10px] text-slate-400 mt-1 font-mono">
          {Math.round(currentRatio * 100)}%
        </span>
      </div>

      {/* Visual Pie Slice representation */}
      {showPie && (
        <div className="flex flex-col items-center">
          <svg width={pieSize} height={pieSize} className="drop-shadow-md">
            {renderPieSlices()}
          </svg>
          <span className="text-[10px] text-slate-400 mt-1 font-mono">
            {fraction.n}/{fraction.d}
          </span>
        </div>
      )}

      {/* Fraction Typography & Match Badge */}
      <div className="flex flex-col items-start min-w-[54px]">
        {label && <span className="text-[11px] font-medium text-slate-400 mb-0.5">{label}</span>}
        <div className="flex flex-col items-center justify-center font-mono font-bold text-base leading-none">
          <span className="text-white drop-shadow-sm">{fraction.n}</span>
          <span className="w-5 h-[2px] bg-slate-400 my-0.5" />
          <span className="text-slate-300">{fraction.d}</span>
        </div>

        {targetFraction && (
          <div className="mt-1 text-[10px]">
            {isMatched ? (
              <span className="text-emerald-400 font-bold">MATCH!</span>
            ) : currentRatio > targetRatio! ? (
              <span className="text-rose-400">OVER</span>
            ) : (
              <span className="text-amber-400 font-mono">
                {fractionToString(fraction)} / {fractionToString(targetFraction)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
