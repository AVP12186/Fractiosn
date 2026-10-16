import React, { useState, useEffect } from 'react';
import { Fraction, fractionToString } from '../types/game';
import { FormattedFraction } from './FormattedFraction';
import { sound } from '../audio/soundEngine';
import { Shield, ShieldAlert, Sparkles, CheckCircle, Clock } from 'lucide-react';

export interface BlockDefenseQuestion {
  id: string;
  attackerName: string;
  attackerType: string;
  prompt: string;
  fractionA: Fraction;
  fractionB?: Fraction;
  operation?: '+' | '-' | 'simplify' | 'equiv';
  targetFraction?: Fraction;
  options: {
    fraction: Fraction;
    label: string;
    isCorrect: boolean;
  }[];
}

interface BlockDefenseModalProps {
  question: BlockDefenseQuestion;
  isOpen: boolean;
  onBlockOutcome: (wasSaved: boolean) => void;
}

export const BlockDefenseModal: React.FC<BlockDefenseModalProps> = ({
  question,
  isOpen,
  onBlockOutcome,
}) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<'pending' | 'blocked' | 'failed'>('pending');
  // Generous 24-second timer so it's fair and not too short!
  const [secondsLeft, setSecondsLeft] = useState<number>(24);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || outcome !== 'pending') return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAnswer(-1); // timed out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, outcome]);

  if (!isOpen) return null;

  const handleAnswer = (idx: number) => {
    if (outcome !== 'pending') return;
    setSelectedIdx(idx);

    const isCorrect = idx >= 0 && question.options[idx]?.isCorrect;

    if (isCorrect) {
      setOutcome('blocked');
      sound.playShieldBlock();
      setTimeout(() => {
        onBlockOutcome(true); // saved! takes less damage
      }, 1400);
    } else {
      setOutcome('failed');
      sound.playPlayerHurt();
      setTimeout(() => {
        onBlockOutcome(false); // full damage
      }, 1400);
    }
  };

  const timerPercent = Math.max(0, Math.min(100, (secondsLeft / 24) * 100));

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-3 select-none font-retro animate-bounce">
      {/* Sharp pixel frame, zero rounded vector corners */}
      <div
        className={`relative w-full bg-slate-950 border-4 p-3 shadow-[6px_6px_0px_#000,-2px_-2px_0px_#334155] text-slate-100 flex flex-col transition-all duration-200 ${
          outcome === 'blocked'
            ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
            : outcome === 'failed'
            ? 'border-rose-600 shadow-[0_0_30px_rgba(244,63,94,0.6)] animate-shake'
            : 'border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
        }`}
      >
        {/* Top Warning Banner */}
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-3 bg-slate-900 px-2 py-1">
          <div className="flex items-center gap-2">
            <ShieldAlert
              className={`w-5 h-5 ${
                outcome === 'blocked'
                  ? 'text-emerald-400'
                  : outcome === 'failed'
                  ? 'text-rose-500'
                  : 'text-amber-400 animate-pulse'
              }`}
            />
            <div>
              <span className="font-pixel text-[11px] text-amber-400 block tracking-wider">
                SHIELD BLOCK REACTION!
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                {question.attackerName} is striking Arc!
              </span>
            </div>
          </div>

          {/* Time Remaining Indicator */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 px-2 py-0.5">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span className="font-mono text-[10px] text-amber-300 font-bold tabular-nums">
              {secondsLeft}s
            </span>
          </div>
        </div>

        {/* Generous Progress Bar */}
        <div className="w-full h-1.5 bg-slate-900 border border-slate-800 mb-3">
          <div
            className={`h-full transition-all duration-1000 ${
              secondsLeft > 10 ? 'bg-emerald-400' : secondsLeft > 5 ? 'bg-amber-400' : 'bg-rose-500'
            }`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        {/* Central Problem Prompt */}
        <div className="bg-slate-900 border-2 border-slate-800 p-3 mb-3 text-center shadow-inner">
          <p className="text-xs text-slate-200 font-retro leading-relaxed mb-2">
            {question.prompt}
          </p>

          {/* Formatted Fraction Math Equation */}
          <div className="flex items-center justify-center gap-2.5 py-1">
            <FormattedFraction
              fraction={question.fractionA}
              size="md"
              color="text-amber-300"
              showPieIndicator={true}
            />

            {question.operation && question.fractionB && (
              <>
                <span className="text-base font-bold text-slate-400">
                  {question.operation === '+'
                    ? '+'
                    : question.operation === '-'
                    ? '−'
                    : '='}
                </span>
                <FormattedFraction
                  fraction={question.fractionB}
                  size="md"
                  color="text-cyan-300"
                  showPieIndicator={true}
                />
                <span className="text-base font-bold text-slate-400">=</span>
                <span className="text-sm font-pixel text-amber-400">?</span>
              </>
            )}
          </div>
        </div>

        {/* Action Options: FRACTIONS AT THE TOP OF EACH BUTTON */}
        <div className="grid grid-cols-3 gap-2">
          {question.options.map((opt, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleAnswer(idx)}
                disabled={outcome !== 'pending'}
                className={`p-2 border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 ${
                  outcome === 'blocked' && opt.isCorrect
                    ? 'border-emerald-400 bg-emerald-950 text-emerald-200 font-bold'
                    : outcome === 'failed' && isSelected
                    ? 'border-rose-600 bg-rose-950 text-rose-300'
                    : 'border-slate-700 bg-slate-900 hover:border-amber-400 text-white'
                }`}
              >
                {/* 1. FRACTION AT TOP */}
                <div className="w-full pb-1 border-b border-slate-800 flex justify-center">
                  <FormattedFraction
                    fraction={opt.fraction}
                    size="sm"
                    showPieIndicator={true}
                    color="text-amber-300 font-bold"
                  />
                </div>

                {/* 2. LABEL AT BOTTOM */}
                <span className="font-pixel text-[9px] text-slate-200 mt-0.5">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Outcome banner */}
        {outcome === 'blocked' && (
          <div className="mt-3 p-2 bg-emerald-950/90 border-2 border-emerald-500 font-pixel text-[10px] text-emerald-300 text-center shadow-md">
            🛡️ BLOCKED! Shield absorbed the shock! (Took only 1 DMG instead of 3 DMG)
          </div>
        )}
        {outcome === 'failed' && (
          <div className="mt-3 p-2 bg-rose-950/90 border-2 border-rose-500 font-pixel text-[10px] text-rose-300 text-center shadow-md">
            💥 BLOCK BROKEN! Direct hit taken! (Took 3 DMG)
          </div>
        )}
      </div>
    </div>
  );
};
