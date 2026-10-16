import React, { useState } from 'react';
import { Fraction, fractionToString, areFractionsEqual, reduceFraction, SpellType } from '../types/game';
import { FractionBeaker } from './FractionBeaker';
import { Flame, Snowflake, Zap, Sparkles, RotateCcw, Wand2, ChevronDown, ChevronUp } from 'lucide-react';

interface AlchemistDeckProps {
  currentMixture: Fraction;
  targetFraction: Fraction | null;
  availableVials: Fraction[];
  selectedVials: Fraction[];
  onAddVial: (vial: Fraction) => void;
  onClearMixture: () => void;
  onCastSpell: (spellType: SpellType) => void;
  onSimplify: () => void;
  targetDescription?: string;
  disabled?: boolean;
}

export const AlchemistDeck: React.FC<AlchemistDeckProps> = ({
  currentMixture,
  targetFraction,
  availableVials,
  selectedVials,
  onAddVial,
  onClearMixture,
  onCastSpell,
  onSimplify,
  targetDescription = 'Cast fraction spell to shatter beast barrier!',
  disabled = false,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const isMatch = targetFraction ? areFractionsEqual(currentMixture, targetFraction) : currentMixture.n > 0;
  const reduced = reduceFraction(currentMixture);
  const canSimplify = reduced.n !== currentMixture.n || reduced.d !== currentMixture.d;

  return (
    <div
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 transition-transform duration-300 w-[96vw] max-w-[920px] select-none"
      style={{
        transform: collapsed ? 'translate(-50%, calc(100% - 32px))' : 'translate(-50%, 0)',
      }}
    >
      {/* Collapse / Expand Tab */}
      <div className="flex justify-center -mb-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="px-4 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border-t border-x border-slate-700/80 rounded-t-lg text-xs font-retro flex items-center gap-1.5 shadow-md backdrop-blur-md transition-colors"
          title="Toggle Alchemist Spell Deck"
        >
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{collapsed ? 'SHOW ALCHEMIST DECK' : 'ALCHEMIST FLASK BELT'}</span>
        </button>
      </div>

      {/* Main Glassmorphic Deck Container */}
      <div className="bg-slate-950/90 border border-slate-700/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md text-slate-100">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Target & Mixture Beakers Zone */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-center">
            {/* Target Requirement */}
            {targetFraction ? (
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-amber-400 font-retro tracking-wider mb-1">
                  BARRIER TARGET
                </span>
                <FractionBeaker
                  fraction={targetFraction}
                  color="#f59e0b"
                  size="sm"
                  showPie={true}
                  label="TARGET"
                />
              </div>
            ) : (
              <div className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-center">
                <span className="text-[10px] text-slate-400 font-retro">TARGET</span>
                <div className="text-xs text-slate-300 font-sans mt-0.5">Explore / Target Beast</div>
              </div>
            )}

            <span className="text-slate-500 font-bold text-sm hidden sm:inline">➔</span>

            {/* Arc's Current Mixture */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-cyan-400 font-retro tracking-wider mb-1">
                CURRENT FLASK
              </span>
              <FractionBeaker
                fraction={currentMixture}
                targetFraction={targetFraction || undefined}
                color={isMatch ? '#10b981' : '#38bdf8'}
                size="sm"
                showPie={true}
                label="MIXTURE"
              />
            </div>

            {/* Clear & Simplify Mini Actions */}
            <div className="flex flex-col gap-1.5">
              <button
                onClick={onClearMixture}
                disabled={currentMixture.n === 0 || disabled}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white border border-slate-600/70 rounded-lg text-xs font-mono flex items-center gap-1 transition-all"
                title="Pour out current flask contents"
              >
                <RotateCcw className="w-3 h-3 text-rose-400" />
                <span>Pour</span>
              </button>

              <button
                onClick={onSimplify}
                disabled={!canSimplify || disabled}
                className="px-2.5 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 disabled:opacity-40 text-indigo-200 hover:text-white border border-indigo-700/60 rounded-lg text-xs font-mono flex items-center gap-1 transition-all"
                title={`Simplify fraction to ${reduced.n}/${reduced.d}`}
              >
                <Wand2 className="w-3 h-3 text-indigo-400" />
                <span>Reduce</span>
              </button>
            </div>
          </div>

          {/* Vials Inventory Rack */}
          <div className="flex flex-col items-center flex-1 max-w-md w-full px-2">
            <div className="flex items-center justify-between w-full mb-1 text-[11px] text-slate-400 font-mono">
              <span>MANA VIAL RACK (Click to Add)</span>
              <span>{selectedVials.length} Added</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-center p-1.5 bg-slate-900/80 border border-slate-800 rounded-xl w-full">
              {availableVials.map((vial, idx) => (
                <button
                  key={`${vial.n}-${vial.d}-${idx}`}
                  onClick={() => onAddVial(vial)}
                  disabled={disabled}
                  className="px-2.5 py-1.5 bg-gradient-to-b from-slate-800 to-slate-900 hover:from-cyan-900/60 hover:to-slate-800 text-cyan-200 hover:text-white border border-cyan-800/60 hover:border-cyan-400 rounded-lg text-xs font-mono font-bold transition-all transform active:scale-95 shadow-sm flex items-center gap-1"
                >
                  <span className="text-[10px] text-cyan-400">+</span>
                  <span>{fractionToString(vial)}</span>
                </button>
              ))}
            </div>

            {/* Context Hint */}
            <span className="text-[11px] text-slate-400 mt-1 truncate max-w-full text-center">
              {targetDescription}
            </span>
          </div>

          {/* Elemental Spell Casting Actions */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-center">
            {/* Fireball */}
            <button
              onClick={() => onCastSpell('fire')}
              disabled={disabled || currentMixture.n === 0}
              className="px-3 py-2.5 bg-gradient-to-t from-red-950 to-red-800/80 hover:from-red-900 hover:to-red-700 disabled:opacity-40 text-red-100 border border-red-500/60 rounded-xl text-xs font-retro flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
              title="Cast Fireball with Current Mixture"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>FIRE</span>
            </button>

            {/* Frost */}
            <button
              onClick={() => onCastSpell('frost')}
              disabled={disabled || currentMixture.n === 0}
              className="px-3 py-2.5 bg-gradient-to-t from-blue-950 to-blue-800/80 hover:from-blue-900 hover:to-blue-700 disabled:opacity-40 text-blue-100 border border-blue-500/60 rounded-xl text-xs font-retro flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
              title="Cast Frost Shard with Current Mixture"
            >
              <Snowflake className="w-4 h-4 text-cyan-200" />
              <span>FROST</span>
            </button>

            {/* Lightning */}
            <button
              onClick={() => onCastSpell('lightning')}
              disabled={disabled || currentMixture.n === 0}
              className="px-3 py-2.5 bg-gradient-to-t from-amber-950 to-amber-800/80 hover:from-amber-900 hover:to-amber-700 disabled:opacity-40 text-amber-100 border border-amber-500/60 rounded-xl text-xs font-retro flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
              title="Cast Lightning with Current Mixture"
            >
              <Zap className="w-4 h-4 text-yellow-300" />
              <span>ZAP</span>
            </button>

            {/* Arcane Dispel */}
            <button
              onClick={() => onCastSpell('arcane')}
              disabled={disabled || currentMixture.n === 0}
              className="px-3.5 py-2.5 bg-gradient-to-t from-emerald-950 to-emerald-800/80 hover:from-emerald-900 hover:to-emerald-700 disabled:opacity-40 text-emerald-100 border border-emerald-500/60 rounded-xl text-xs font-retro flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
              title="Cast Arcane Dispel"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>DISPEL</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
