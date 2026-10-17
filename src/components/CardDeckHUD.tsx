import React, { useState } from 'react';
import { Fraction, fractionToString, areFractionsEqual, addFractions, SpellType, toggleSpellCard } from '../types/game';
import { SpellCard } from './PokemonBattleView';
import { FormattedFraction } from './FormattedFraction';
import { Flame, Snowflake, Zap, Sparkles, Swords, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface CardDeckHUDProps {
  cards: SpellCard[];
  targetFraction: Fraction | null;
  targetName?: string;
  onCastCard: (fraction: Fraction, spellType: SpellType, cardIds: string[]) => void;
  onOpenPokemonBattle?: () => void;
  disabled?: boolean;
}

export const CardDeckHUD: React.FC<CardDeckHUDProps> = ({
  cards,
  targetFraction,
  targetName = 'Corrupted Beast',
  onCastCard,
  onOpenPokemonBattle,
  disabled = false,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const selectedCards = selectedCardIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is SpellCard => !!c);

  const combinedFraction: Fraction =
    selectedCards.length > 0
      ? selectedCards.reduce((acc, card) => addFractions(acc, card.fraction), { n: 0, d: 1 })
      : { n: 0, d: 1 };

  const isMatched =
    targetFraction && selectedCards.length > 0
      ? areFractionsEqual(combinedFraction, targetFraction)
      : false;

  const handleCardToggle = (cardId: string) => {
    if (!disabled) setSelectedCardIds((selected) => toggleSpellCard(selected, cardId));
  };

  const handleCast = () => {
    if (selectedCards.length === 0 || disabled) return;
    const leadType = selectedCards[0].type;
    onCastCard(combinedFraction, leadType, [...selectedCardIds]);
    setSelectedCardIds([]);
  };

  return (
    <aside
      aria-label="Alchemist Spell Deck"
      className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-30 transition-transform duration-300 w-auto max-w-[calc(100vw-180px)] sm:max-w-[420px] select-none font-retro"
      style={{
        transform: collapsed ? 'translateY(calc(100% - 28px))' : 'translateY(0)',
      }}
    >
      {/* Collapse Tab on Right: Sharp Pixel Tab */}
      <div className="flex justify-end pr-2 -mb-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-t-2 border-x-2 border-slate-700 text-[10px] font-pixel flex items-center gap-1.5 shadow-[2px_0px_0px_#000] cursor-pointer"
        >
          {collapsed ? <ChevronUp className="w-3 h-3 text-cyan-400" /> : <ChevronDown className="w-3 h-3 text-cyan-400" />}
          <span>{collapsed ? 'ALCHEMIST BELT (EXPAND)' : 'ALCHEMIST BELT'}</span>
        </button>
      </div>

      {/* Main Cards Deck Container: Pure Pixel Styling */}
      <div className="bg-slate-950 border-4 border-slate-700 p-2 sm:p-2.5 shadow-[4px_4px_0px_#000,-2px_-2px_0px_#334155] text-slate-100 flex flex-col gap-2">
        
        {/* Top Status Strip: Target Shield & Combined Math */}
        <div className="flex items-center justify-between gap-1.5 bg-slate-900 border-2 border-slate-800 px-2 py-1 flex-wrap sm:flex-nowrap">
          {/* Target Shield Box */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-pixel text-amber-400 truncate max-w-[90px]">
              {targetName.toUpperCase()}:
            </span>
            {targetFraction ? (
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-pixel text-amber-400">SHIELD</span>
                <FormattedFraction fraction={targetFraction} size="xs" color="text-amber-200" showPieIndicator={true} />
              </div>
            ) : (
              <span className="text-emerald-400 text-[8px] font-pixel">NO SHIELD</span>
            )}
          </div>

          {/* Selected Math Output */}
          <div className="flex items-center gap-1 ml-auto">
            {selectedCards.length > 0 ? (
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 px-1.5 py-0.5">
                <span className="text-[8px] text-slate-400 font-mono">SELECTED:</span>
                <FormattedFraction
                  fraction={combinedFraction}
                  size="xs"
                  color={isMatched ? 'text-emerald-400' : 'text-cyan-300'}
                  showPieIndicator={true}
                />
                {isMatched && (
                  <span className="text-[8px] text-emerald-400 font-bold font-retro animate-pulse ml-0.5">
                    MATCH!
                  </span>
                )}
              </div>
            ) : (
              <span className="text-[9px] text-slate-400 font-mono">Pick 1-2 cards</span>
            )}

            {selectedCardIds.length > 0 && (
              <button
                onClick={() => setSelectedCardIds([])}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Deselect cards"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Spell Cards Row: FRACTION IS PROMINENTLY AT THE TOP OF EACH CARD */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 px-0.5 max-w-full justify-start scrollbar-thin">
          {cards.map((card) => {
            const isSelected = selectedCardIds.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => handleCardToggle(card.id)}
                disabled={disabled}
                className={`relative shrink-0 flex flex-col items-center justify-between border-2 transition-all cursor-pointer w-[68px] sm:w-[74px] h-[82px] shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 ${
                  isSelected
                    ? 'border-cyan-300 bg-cyan-950 text-white -translate-y-1 shadow-[0_0_8px_rgba(6,182,212,0.6)]'
                    : 'border-slate-700 bg-slate-900 hover:border-amber-400 text-slate-200'
                }`}
              >
                {selectedCardIds.filter((id) => id === card.id).length === 2 && (
                  <div className="absolute -top-2.5 -right-2 bg-amber-400 text-black border-2 border-black font-pixel text-[11px] px-1.5 py-0.2 shadow-[2px_2px_0px_#000] z-20 animate-bounce">
                    2x
                  </div>
                )}
                {selectedCardIds.filter((id) => id === card.id).length === 1 && (
                  <div className="absolute -top-2 -right-1 bg-cyan-400 text-black border border-black font-pixel text-[8px] px-1 shadow-[1px_1px_0px_#000] z-20">
                    1x
                  </div>
                )}
                {/* 1. TOP OF CARD: PROMINENT FRACTION */}
                <div className="w-full bg-slate-950 border-b border-slate-800 py-1 px-1 flex items-center justify-between">
                  <FormattedFraction fraction={card.fraction} size="xs" showPieIndicator={true} color="text-amber-300 font-bold" />
                  {card.type === 'fire' ? (
                    <Flame className="w-3 h-3 text-rose-400 shrink-0" />
                  ) : card.type === 'frost' ? (
                    <Snowflake className="w-3 h-3 text-cyan-300 shrink-0" />
                  ) : (
                    <Zap className="w-3 h-3 text-amber-300 shrink-0" />
                  )}
                </div>

                {/* 2. MIDDLE: SPELL NAME */}
                <div className="px-1 text-center font-retro text-[8px] text-slate-200 truncate w-full">
                  {card.name}
                </div>

                {/* 3. BOTTOM: ELEMENT TAG */}
                <div className="w-full bg-slate-950/80 py-0.5 text-center text-[7px] font-mono text-slate-400 uppercase">
                  {card.type}
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Controls: CAST and RETRO FIGHT */}
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={handleCast}
            disabled={selectedCards.length === 0 || disabled}
            className="flex-1 py-1.5 bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-white font-pixel text-[9px] border-2 border-cyan-400 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>{selectedCards.length === 0 ? 'CHOOSE CARD' : `CAST (${fractionToString(combinedFraction)})`}</span>
          </button>

          {onOpenPokemonBattle && <button
            onClick={onOpenPokemonBattle}
            className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold font-pixel text-[9px] border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-1 shrink-0 cursor-pointer"
            title="Enter retro Pokémon fight arena"
          >
            <Swords className="w-3 h-3 text-yellow-300" />
            <span>ARENA!</span>
          </button>}
        </div>

      </div>
    </aside>
  );
};
