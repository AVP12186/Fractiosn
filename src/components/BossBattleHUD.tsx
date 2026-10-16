import React from 'react';
import { Enemy, fractionToString } from '../types/game';
import { FormattedFraction } from './FormattedFraction';
import { Skull, ShieldAlert } from 'lucide-react';

interface BossBattleHUDProps {
  boss: Enemy;
  telegraphTimer: number; // 0 to 1
  bossPhase: number;
}

export const BossBattleHUD: React.FC<BossBattleHUDProps> = ({
  boss,
  telegraphTimer,
  bossPhase,
}) => {
  const hpRatio = Math.max(0, Math.min(1, boss.hp / boss.maxHp));

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-[720px] select-none pointer-events-none">
      <div className="bg-slate-950/90 border-2 border-red-900/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md">
        {/* Boss Title & Phase */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Skull className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="font-pixel text-xs sm:text-sm text-red-400 tracking-wider">
              {boss.name.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-red-950/80 border border-red-700/60 rounded-md px-2 py-0.5">
            <span className="text-[10px] font-retro text-red-300">PHASE {bossPhase}</span>
            <span className="text-[10px] text-amber-400 font-mono">
              {bossPhase === 1 ? '(Unit Shields)' : bossPhase === 2 ? '(Equivalent Runes)' : '(Unlike Denominators)'}
            </span>
          </div>
        </div>

        {/* Boss Health Bar */}
        <div className="relative w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-red-950 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-red-700 via-rose-500 to-amber-500 transition-all duration-300 relative"
            style={{ width: `${hpRatio * 100}%` }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/30" />
          </div>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white font-bold drop-shadow">
            {boss.hp} / {boss.maxHp} HP
          </span>
        </div>

        {/* Shield Fraction Rune & Attack Telegraph */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 gap-3">
          {/* Active Shield Requirement */}
          {boss.shield ? (
            <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500 rounded-lg px-2.5 py-1">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-300 font-pixel">FRACTION SHIELD:</span>
                <FormattedFraction fraction={boss.shield} size="sm" color="text-amber-200" showPieIndicator={true} />
              </div>
            </div>
          ) : (
            <div className="text-xs text-emerald-400 font-retro">
              BARRIER BROKEN! STRIKE NOW!
            </div>
          )}

          {/* Attack Telegraph Countdown */}
          <div className="flex flex-col items-end flex-1 max-w-[200px]">
            <span className="text-[10px] text-slate-400 font-mono">
              Boss Telegraph: {telegraphTimer > 0.8 ? 'IMMINENT!' : 'Charging'}
            </span>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mt-0.5 border border-slate-800">
              <div
                className={`h-full transition-all duration-100 ${
                  telegraphTimer > 0.8 ? 'bg-rose-500' : 'bg-amber-500'
                }`}
                style={{ width: `${telegraphTimer * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
