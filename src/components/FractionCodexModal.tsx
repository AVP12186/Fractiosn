import React, { useState } from 'react';
import { Fraction, reduceFraction, fractionToString } from '../types/game';
import { FractionBeaker } from './FractionBeaker';
import { BookOpen, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface FractionCodexModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FractionCodexModal: React.FC<FractionCodexModalProps> = ({ isOpen, onClose }) => {
  const [num, setNum] = useState(3);
  const [den, setDen] = useState(4);
  const [tab, setTab] = useState<'basics' | 'equivalent' | 'addition'>('basics');

  if (!isOpen) return null;

  const sampleFraction: Fraction = { n: num, d: den };
  const reduced = reduceFraction(sampleFraction);
  const isReduced = reduced.n === num && reduced.d === den;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="relative w-full max-w-2xl bg-slate-950 border-2 border-cyan-800/80 rounded-2xl p-5 shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="font-pixel text-sm text-cyan-300">ALCHEMIST FRACTION CODEX</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => setTab('basics')}
            className={`flex-1 py-1.5 text-xs font-retro rounded-lg transition-colors ${
              tab === 'basics' ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-700/60' : 'text-slate-400 hover:text-white'
            }`}
          >
            1. What is a Fraction?
          </button>
          <button
            onClick={() => setTab('equivalent')}
            className={`flex-1 py-1.5 text-xs font-retro rounded-lg transition-colors ${
              tab === 'equivalent' ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-700/60' : 'text-slate-400 hover:text-white'
            }`}
          >
            2. Equivalent Fractions
          </button>
          <button
            onClick={() => setTab('addition')}
            className={`flex-1 py-1.5 text-xs font-retro rounded-lg transition-colors ${
              tab === 'addition' ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-700/60' : 'text-slate-400 hover:text-white'
            }`}
          >
            3. Combining & Adding
          </button>
        </div>

        {/* Tab Contents */}
        <div className="mt-4 flex-1">
          {tab === 'basics' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                A fraction represents parts of a whole. In alchemy, when you divide a pure mana crystal into equal pieces, each piece is a fractional shard!
              </p>

              {/* Interactive Sandbox Slider */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex flex-col gap-3 flex-1 w-full">
                  <div>
                    <label className="text-[11px] text-slate-400 font-mono block mb-1">
                      Numerator (Parts you have): <span className="text-cyan-300 font-bold">{num}</span>
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={den}
                      value={num}
                      onChange={(e) => setNum(parseInt(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-mono block mb-1">
                      Denominator (Total equal parts): <span className="text-amber-300 font-bold">{den}</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={12}
                      value={den}
                      onChange={(e) => {
                        const newDen = parseInt(e.target.value);
                        setDen(newDen);
                        if (num > newDen) setNum(newDen);
                      }}
                      className="w-full accent-amber-400 cursor-pointer"
                    />
                  </div>

                  <div className="text-xs text-slate-300 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800">
                    Fraction: <span className="text-cyan-400 font-bold">{num}/{den}</span>{' '}
                    {!isReduced && (
                      <span className="text-emerald-400 ml-2">
                        ➔ Simplifies to: {reduced.n}/{reduced.d}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0">
                  <FractionBeaker fraction={sampleFraction} size="lg" color="#38bdf8" />
                </div>
              </div>
            </div>
          )}

          {tab === 'equivalent' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Equivalent fractions represent the exact same amount of liquid, even though they use different numbers of cuts!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                  <span className="text-xs font-mono text-cyan-300 mb-2">1 / 2</span>
                  <FractionBeaker fraction={{ n: 1, d: 2 }} size="sm" color="#38bdf8" />
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                  <span className="text-xs font-mono text-cyan-300 mb-2">2 / 4</span>
                  <FractionBeaker fraction={{ n: 2, d: 4 }} size="sm" color="#38bdf8" />
                </div>
                <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl flex flex-col items-center">
                  <span className="text-xs font-mono text-cyan-300 mb-2">4 / 8</span>
                  <FractionBeaker fraction={{ n: 4, d: 8 }} size="sm" color="#38bdf8" />
                </div>
              </div>

              <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-xl text-xs text-cyan-200">
                <Sparkles className="w-4 h-4 inline mr-1 text-cyan-300" />
                <strong>Alchemist Rule:</strong> Multiply or divide both the top (numerator) and bottom (denominator) by the same number to find an equivalent spell!
              </div>
            </div>
          )}

          {tab === 'addition' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                When adding fractions, they must have the same denominator (same size slices) before you can add their tops together!
              </p>

              {/* Example 1: Same denominator */}
              <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl">
                <span className="text-xs font-retro text-amber-300 block mb-2">Like Denominators:</span>
                <div className="flex items-center gap-2 font-mono text-sm">
                  <span className="text-cyan-300 font-bold">1/4</span>
                  <span>+</span>
                  <span className="text-cyan-300 font-bold">2/4</span>
                  <span>=</span>
                  <span className="text-emerald-400 font-bold">3/4</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Keep the 4 on bottom, just add 1 + 2 = 3!</p>
              </div>

              {/* Example 2: Unlike denominator */}
              <div className="bg-slate-900/70 border border-slate-800 p-3 rounded-xl">
                <span className="text-xs font-retro text-amber-300 block mb-2">Unlike Denominators (Convert First!):</span>
                <div className="flex items-center gap-2 font-mono text-sm flex-wrap">
                  <span className="text-cyan-300 font-bold">1/2</span>
                  <span>+</span>
                  <span className="text-cyan-300 font-bold">1/4</span>
                  <span>➔</span>
                  <span className="text-slate-300">Convert 1/2 into 2/4:</span>
                  <span className="text-cyan-300 font-bold">2/4 + 1/4 =</span>
                  <span className="text-emerald-400 font-bold">3/4</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Both now have quarters, so they can be combined into a 3/4 spell!</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white rounded-xl text-xs font-retro flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>RETURN TO DUNGEON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
