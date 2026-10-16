import React, { useEffect, useState } from 'react';
import { Heart, Shield, AlertTriangle, Sparkles, ShieldCheck, Swords } from 'lucide-react';

interface HealthSpotProps {
  hp: number;
  maxHp: number;
  floor: number;
  isInvulnerable?: boolean;
  lastDamageTime?: number;
  armor?: number;
  damageBonus?: number;
}

export const HealthSpot: React.FC<HealthSpotProps> = ({
  hp,
  maxHp,
  floor,
  isInvulnerable = false,
  lastDamageTime = 0,
  armor = 1,
  damageBonus = 0,
}) => {
  const [damagedFlash, setDamagedFlash] = useState(false);

  useEffect(() => {
    if (lastDamageTime > 0) {
      setDamagedFlash(true);
      const timer = setTimeout(() => setDamagedFlash(false), 600);
      return () => clearTimeout(timer);
    }
  }, [lastDamageTime]);

  const hpPercent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const isCritical = hp <= 5;
  const isLow = hp <= 10;

  // 30 maxHp divided into 6 hearts (5 HP per heart, 5 pieces per heart)
  const totalHearts = 6;
  const hpPerHeart = 5;

  return (
    <div
      className={`relative select-none transition-all duration-300 font-retro ${
        damagedFlash ? 'animate-shake' : ''
      }`}
    >
      {/* 100% Pixel Frame */}
      <div
        className={`bg-slate-950 border-4 p-2.5 sm:p-3 shadow-[4px_4px_0px_#000,-2px_-2px_0px_#334155] transition-all ${
          damagedFlash
            ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.8)] scale-105'
            : isCritical
            ? 'border-rose-600 shadow-[0_0_15px_rgba(225,29,72,0.4)]'
            : 'border-slate-700'
        }`}
      >
        {/* Top Tag & Status */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-1.5">
            <div
              className={`w-2.5 h-2.5 border border-black shadow-[1px_1px_0px_#000] ${
                isCritical
                  ? 'bg-rose-500 animate-ping'
                  : isLow
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
            />
            <span className="font-pixel text-[10px] tracking-wider text-amber-300">
              HEALTH SPOT
            </span>
          </div>

          {/* Armor & Damage Status */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-1.5 py-0.5 shadow-[1px_1px_0px_#000]">
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span className="font-pixel text-[8px] text-cyan-300">
                ARMOR +{armor}
              </span>
            </div>
            {damageBonus > 0 && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-1.5 py-0.5 shadow-[1px_1px_0px_#000]">
                <Swords className="w-3 h-3 text-rose-400" />
                <span className="font-pixel text-[8px] text-rose-300">
                  ATK +{damageBonus}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 6 Hearts with 5 pieces per heart */}
        <div className="flex items-center gap-1.5 mb-2 overflow-x-auto py-1">
          {Array.from({ length: totalHearts }).map((_, hIdx) => {
            // HP points remaining for this specific heart (0 to 5)
            const heartHp = Math.max(0, Math.min(hpPerHeart, hp - hIdx * hpPerHeart));
            return (
              <div
                key={hIdx}
                className="flex flex-col items-center gap-0.5 bg-slate-900 border border-slate-800 p-1 rounded-sm"
                title={`Heart ${hIdx + 1}: ${heartHp}/5 HP`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    heartHp > 0
                      ? 'text-rose-500 fill-rose-500'
                      : 'text-slate-700 fill-slate-900'
                  }`}
                />
                {/* 5 pieces of the heart */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, pieceIdx) => (
                    <div
                      key={pieceIdx}
                      className={`w-1 h-2 transition-all ${
                        pieceIdx < heartHp
                          ? 'bg-rose-500 border border-rose-300'
                          : 'bg-slate-800 border border-slate-900'
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Numerical HP Display */}
          <span className="font-mono text-xs font-bold text-white ml-auto tabular-nums pl-2">
            {hp} / {maxHp} <span className="text-[10px] text-slate-400">HP</span>
          </span>
        </div>

        {/* Stepped Pixel Bar */}
        <div className="w-full h-2 bg-slate-900 border-2 border-slate-700 p-0.5 overflow-hidden flex shadow-inner">
          <div
            className={`h-full transition-all duration-300 ${
              hpPercent > 50
                ? 'bg-emerald-500'
                : hpPercent > 20
                ? 'bg-amber-500'
                : 'bg-rose-600 animate-pulse'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>

        {/* Subtitle / Alert Text */}
        <div className="flex items-center justify-between mt-1 text-[9px] font-retro text-slate-400">
          <span>TOWER F.{floor}</span>
          {isCritical ? (
            <span className="text-rose-400 font-bold flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5" /> CRITICAL!
            </span>
          ) : isInvulnerable ? (
            <span className="text-cyan-300 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> SHIELDED
            </span>
          ) : (
            <span className="text-emerald-400">VITAL OK</span>
          )}
        </div>
      </div>
    </div>
  );
};
