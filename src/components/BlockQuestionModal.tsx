import React, { useState } from 'react';
import { BlockQuestion, fractionToString } from '../types/game';
import { FormattedFraction } from './FormattedFraction';
import { sound } from '../audio/soundEngine';
import { HelpCircle, CheckCircle2, XCircle, ArrowRight, Sparkles } from 'lucide-react';

interface BlockQuestionModalProps {
  question: BlockQuestion;
  isOpen: boolean;
  onAnswer: (isCorrect: boolean) => void;
  onClose: () => void;
}

export const BlockQuestionModal: React.FC<BlockQuestionModalProps> = ({
  question,
  isOpen,
  onAnswer,
  onClose,
}) => {
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (idx: number) => {
    if (submitted) return;
    sound.playStep();
    setSelectedOptionIdx(idx);
  };

  const handleSubmit = () => {
    if (selectedOptionIdx === null || submitted) return;
    setSubmitted(true);
    const chosen = question.options[selectedOptionIdx];

    if (chosen.isCorrect) {
      sound.playShieldBreak();
    } else {
      sound.playWrong();
    }

    setTimeout(() => {
      onAnswer(chosen.isCorrect);
    }, 1800);
  };

  // Render Visual Aid based on question type
  const renderVisualAid = () => {
    const { fractionA, fractionB, visualAidType, targetNumber } = question;

    if (visualAidType === 'group' && targetNumber) {
      // Fraction of a number (e.g. 2/3 of 12)
      const total = targetNumber;
      const d = fractionA.d;
      const n = fractionA.n;
      const groupSize = total / d;
      const activeCount = n * groupSize;

      return (
        <div className="flex flex-col items-center p-3 bg-slate-900 border border-slate-700 rounded-xl my-2">
          <span className="text-[10px] text-slate-400 font-mono mb-2">
            GROUP VISUALIZER: {total} Mana Crystals divided into {d} equal groups
          </span>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {Array.from({ length: total }).map((_, i) => {
              const isInGroup = i < activeCount;
              return (
                <div
                  key={i}
                  className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center font-mono text-xs ${
                    isInGroup
                      ? 'bg-amber-500/80 border-amber-300 text-white shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                >
                  💎
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (visualAidType === 'bar') {
      // Comparative fraction bars
      return (
        <div className="flex flex-col gap-2 p-3 bg-slate-900 border border-slate-700 rounded-xl my-2">
          {/* Bar A */}
          <div className="flex items-center gap-3">
            <FormattedFraction fraction={fractionA} size="sm" />
            <div className="flex-1 h-6 bg-slate-950 border border-slate-600 rounded-md overflow-hidden flex">
              {Array.from({ length: fractionA.d }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 border-r border-slate-800 last:border-none ${
                    i < fractionA.n ? 'bg-cyan-500 shadow-sm' : 'bg-slate-900'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Bar B if comparing */}
          {fractionB && (
            <div className="flex items-center gap-3">
              <FormattedFraction fraction={fractionB} size="sm" />
              <div className="flex-1 h-6 bg-slate-950 border border-slate-600 rounded-md overflow-hidden flex">
                {Array.from({ length: fractionB.d }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 border-r border-slate-800 last:border-none ${
                      i < fractionB.n ? 'bg-amber-500 shadow-sm' : 'bg-slate-900'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Default Pie Aid
    const ratioA = fractionA.n / fractionA.d;
    return (
      <div className="flex items-center justify-center gap-6 p-3 bg-slate-900 border border-slate-700 rounded-xl my-2">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-2 border-slate-600 bg-slate-950 relative overflow-hidden">
            <div
              className="absolute inset-0"
              style={{
                background: `conic-gradient(#38bdf8 0% ${ratioA * 100}%, rgba(255,255,255,0.06) ${ratioA * 100}% 100%)`,
              }}
            />
          </div>
          <FormattedFraction fraction={fractionA} size="sm" className="mt-1" />
        </div>

        {fractionB && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-slate-600 bg-slate-950 relative overflow-hidden">
              <div
                className="absolute inset-0"
                style={{
                  background: `conic-gradient(#f59e0b 0% ${(fractionB.n / fractionB.d) * 100}%, rgba(255,255,255,0.06) ${(fractionB.n / fractionB.d) * 100}% 100%)`,
                }}
              />
            </div>
            <FormattedFraction fraction={fractionB} size="sm" className="mt-1" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-retro">
      <div className="relative w-full max-w-lg bg-slate-950 border-4 border-cyan-500/80 rounded-2xl p-5 shadow-2xl text-slate-100 flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-pixel text-xs text-cyan-300">TOWER TRIAL: ANCIENT RUNE BLOCK</h3>
          </div>
          <span className="text-[10px] text-amber-400 font-mono">+150 PTS & RELIC</span>
        </div>

        {/* Question Prompt */}
        <div className="py-3">
          <h4 className="text-sm font-retro text-amber-200 leading-relaxed text-center">
            {question.prompt}
          </h4>

          {/* Visual Model Diagram */}
          {renderVisualAid()}
        </div>

        {/* Option Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-2">
          {question.options.map((opt, idx) => {
            const isSelected = selectedOptionIdx === idx;
            let btnStyle = 'bg-slate-900 border-slate-700 hover:border-cyan-400 text-slate-200';

            if (submitted) {
              if (opt.isCorrect) {
                btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.5)]';
              } else if (isSelected && !opt.isCorrect) {
                btnStyle = 'bg-rose-950 border-rose-500 text-rose-200';
              }
            } else if (isSelected) {
              btnStyle = 'bg-cyan-950 border-cyan-400 text-cyan-100 shadow-[0_0_12px_rgba(6,182,212,0.4)]';
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={submitted}
                className={`p-3 rounded-xl border-2 font-mono font-bold text-sm transition-all duration-150 flex items-center justify-between active:scale-95 ${btnStyle}`}
              >
                <span>{opt.label}</span>
                {submitted && opt.isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {submitted && isSelected && !opt.isCorrect && <XCircle className="w-4 h-4 text-rose-400" />}
              </button>
            );
          })}
        </div>

        {/* Feedback / Explanation on submit */}
        {submitted && (
          <div className="mt-2 p-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs text-slate-300 leading-relaxed font-sans">
            <strong>Explanation:</strong> {question.explanation}
          </div>
        )}

        {/* Submit Button */}
        {!submitted && (
          <div className="mt-4 pt-2 border-t border-slate-800 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={selectedOptionIdx === null}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-pixel text-xs rounded-xl shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <span>SUBMIT ANSWER</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
