import React from 'react';
import { Fraction } from '../types/game';

interface FormattedFractionProps {
  fraction: Fraction;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
  showPieIndicator?: boolean;
}

export const FormattedFraction: React.FC<FormattedFractionProps> = ({
  fraction,
  size = 'md',
  color = 'text-white',
  className = '',
  showPieIndicator = false,
}) => {
  if (!fraction) return null;

  // Whole numbers
  if (fraction.d === 1) {
    return <span className={`font-mono font-bold ${color} ${className}`}>{fraction.n}</span>;
  }

  // Text scaling sizes
  const sizes = {
    xs: { num: 'text-[9px]', den: 'text-[9px]', bar: 'w-3 h-[1px]', gap: 'gap-0' },
    sm: { num: 'text-[11px]', den: 'text-[11px]', bar: 'w-4 h-[1.5px]', gap: 'gap-0.5' },
    md: { num: 'text-sm', den: 'text-sm', bar: 'w-5 h-[2px]', gap: 'gap-0.5' },
    lg: { num: 'text-lg', den: 'text-lg', bar: 'w-7 h-[2px]', gap: 'gap-1' },
    xl: { num: 'text-2xl', den: 'text-2xl', bar: 'w-9 h-[3px]', gap: 'gap-1' },
  };

  const s = sizes[size] || sizes.md;
  const ratio = Math.max(0, Math.min(1, fraction.n / fraction.d));

  return (
    <div className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      {/* Visual mini-pie indicator */}
      {showPieIndicator && (
        <div className="w-4 h-4 rounded-full border border-slate-600 bg-slate-950 relative overflow-hidden shrink-0">
          <div
            className="absolute inset-0"
            style={{
              background: `conic-gradient(#38bdf8 0% ${ratio * 100}%, rgba(255,255,255,0.08) ${ratio * 100}% 100%)`,
            }}
          />
        </div>
      )}

      {/* Stacked Fraction with Horizontal Bar */}
      <div className={`inline-flex flex-col items-center justify-center font-mono font-bold leading-none ${s.gap}`}>
        <span className={`${s.num} ${color} drop-shadow`}>{fraction.n}</span>
        <span className={`${s.bar} bg-current opacity-80 rounded-full`} />
        <span className={`${s.den} ${color} drop-shadow`}>{fraction.d}</span>
      </div>
    </div>
  );
};
