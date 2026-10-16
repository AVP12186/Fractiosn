import React, { useState, useEffect } from 'react';
import { StoryChapter } from '../types/game';
import { sound } from '../audio/soundEngine';
import { ChevronRight, FastForward } from 'lucide-react';

interface StoryModalProps {
  chapter: StoryChapter;
  onComplete: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({ chapter, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setCharIndex(0);
  }, [chapter]);

  useEffect(() => {
    if (charIndex < chapter.text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(chapter.text.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
        if (charIndex % 3 === 0) {
          sound.playStep();
        }
      }, 25);
      return () => clearTimeout(timer);
    }
  }, [charIndex, chapter.text]);

  const handleFinish = () => {
    if (charIndex < chapter.text.length) {
      setDisplayedText(chapter.text);
      setCharIndex(chapter.text.length);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-xl bg-slate-950 border-2 border-amber-600/80 rounded-2xl p-5 shadow-2xl text-slate-100 flex flex-col">
        {/* Character Portrait & Speaker Name */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-12 h-12 bg-slate-900 border-2 border-amber-500 rounded-xl flex items-center justify-center overflow-hidden shadow-inner">
            {chapter.portrait === 'arc' ? (
              <span className="text-2xl">🧙‍♂️</span>
            ) : chapter.portrait === 'elder' ? (
              <span className="text-2xl">📜</span>
            ) : (
              <span className="text-2xl">🗿</span>
            )}
          </div>
          <div>
            <h3 className="font-pixel text-xs text-amber-400">{chapter.speaker.toUpperCase()}</h3>
            <span className="text-[11px] text-slate-400 font-sans">Numeria Dungeon Archives</span>
          </div>
        </div>

        {/* Story Text Box with typing cursor */}
        <div className="min-h-[90px] py-4 text-sm font-retro text-slate-200 leading-relaxed">
          {displayedText}
          {charIndex < chapter.text.length && <span className="animate-pulse text-amber-400 font-bold">|</span>}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={onComplete}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Skip Story</span>
          </button>

          <button
            onClick={handleFinish}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-retro flex items-center gap-1.5 transition-colors shadow-lg active:scale-95"
          >
            <span>{charIndex < chapter.text.length ? 'Show All' : 'Continue'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
