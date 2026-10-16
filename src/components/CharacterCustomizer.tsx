import React, { useState } from 'react';
import { CharacterConfig } from '../types/game';
import { getPlayerSpriteDataURL } from '../graphics/pixelTextures';
import { Sparkles, Check, X, RotateCw, Wand2, Shield, User } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface CharacterCustomizerProps {
  isOpen: boolean;
  config: CharacterConfig;
  onChangeConfig: (newConfig: CharacterConfig) => void;
  onClose: () => void;
}

export const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({
  isOpen,
  config,
  onChangeConfig,
  onClose,
}) => {
  const [showBackView, setShowBackView] = useState(false);
  const [activeTab, setActiveTab] = useState<'robes' | 'skin' | 'hats' | 'weapons' | 'accessories' | 'presets'>('robes');

  if (!isOpen) return null;

  const spriteSrc = getPlayerSpriteDataURL(config, 0, showBackView);

  const robeOptions = [
    { label: 'Sapphire', color: '#2563eb' },
    { label: 'Crimson', color: '#dc2626' },
    { label: 'Emerald', color: '#059669' },
    { label: 'Amethyst', color: '#7c3aed' },
    { label: 'Amber', color: '#d97706' },
    { label: 'Obsidian', color: '#0f172a' },
    { label: 'Rose', color: '#e11d48' },
    { label: 'Teal', color: '#0891b2' },
    { label: 'Solar White', color: '#f8fafc' },
    { label: 'Charcoal', color: '#334155' },
    { label: 'Magma', color: '#ea580c' },
    { label: 'Poison Lime', color: '#65a30d' },
  ];

  const skinOptions: { label: string; value: NonNullable<CharacterConfig['skinTone']>; color: string }[] = [
    { label: 'Fair Peach', value: 'fair', color: '#fed7aa' },
    { label: 'Warm Tan', value: 'tan', color: '#f59e0b' },
    { label: 'Deep Bronze', value: 'bronze', color: '#b45309' },
    { label: 'Dark Slate', value: 'dark', color: '#451a03' },
    { label: 'Goblin Green', value: 'goblin', color: '#4ade80' },
    { label: 'Ghost Pale', value: 'pale', color: '#e2e8f0' },
  ];

  const hatOptions: { label: string; value: CharacterConfig['hatStyle']; desc: string }[] = [
    { label: 'Wizard Hat', value: 'wizard', desc: 'Pointed brim' },
    { label: 'Alchemist Cowl', value: 'cowl', desc: 'Brewmaster cowl' },
    { label: 'Rogue Hood', value: 'hood', desc: 'Shadow mantle' },
    { label: 'Crown of Wholes', value: 'crown', desc: 'Relic gold & ruby' },
    { label: 'Knight Helmet', value: 'helmet', desc: 'Steel visor plume' },
    { label: 'Ninja Headband', value: 'headband', desc: 'Crimson ribbon' },
    { label: 'Demon Horns', value: 'horns', desc: 'Infernal spurs' },
    { label: 'Neko Ears', value: 'catears', desc: 'Whimsical ears' },
    { label: 'Angelic Halo', value: 'halo', desc: 'Gilded divine ring' },
    { label: 'No Hat / Hair', value: 'none', desc: 'Tousled hair' },
  ];

  const wandOptions: { label: string; value: CharacterConfig['wandStyle']; desc: string }[] = [
    { label: 'Oak Wand', value: 'wood', desc: 'Classic branch' },
    { label: 'Crystal Staff', value: 'crystal', desc: 'Frost jewel tip' },
    { label: 'Relic Blade', value: 'gold', desc: 'Ancient golden dagger' },
    { label: 'Knight Broadsword', value: 'sword', desc: 'Tempered steel' },
    { label: 'Alchemist Flask', value: 'potion', desc: 'Bubbling emerald vial' },
    { label: 'Reaper Scythe', value: 'scythe', desc: 'Void curved blade' },
    { label: 'Grimoire Book', value: 'book', desc: 'Floating fraction tome' },
  ];

  const accessoryOptions: { label: string; value: CharacterConfig['accessory']; desc: string }[] = [
    { label: 'None', value: 'none', desc: 'Unburdened' },
    { label: 'Spectacles', value: 'spectacles', desc: 'Golden round frames' },
    { label: 'Monocle', value: 'monocle', desc: 'Scholar single glass' },
    { label: 'Arcane Visor', value: 'visor', desc: 'Cyan cyber visor' },
    { label: 'Royal Cape', value: 'cape', desc: 'Flowing red cloak' },
    { label: 'Fairy Familiar', value: 'fairy', desc: 'Twinkling companion' },
    { label: 'Buckler Shield', value: 'shield', desc: 'Iron & bronze aegis' },
    { label: 'Eye Amulet', value: 'amulet', desc: 'Fraction medallion' },
  ];

  const presets: { name: string; conf: CharacterConfig }[] = [
    {
      name: 'Classic Arc',
      conf: { robeColor: '#2563eb', skinTone: 'fair', hatStyle: 'wizard', wandStyle: 'wood', accessory: 'none' },
    },
    {
      name: 'Paladin of Wholes',
      conf: { robeColor: '#f8fafc', skinTone: 'fair', hatStyle: 'helmet', wandStyle: 'sword', accessory: 'shield' },
    },
    {
      name: 'Shadow Shinobi',
      conf: { robeColor: '#0f172a', skinTone: 'tan', hatStyle: 'headband', wandStyle: 'gold', accessory: 'cape' },
    },
    {
      name: 'Archmage Rex',
      conf: { robeColor: '#d97706', skinTone: 'bronze', hatStyle: 'crown', wandStyle: 'crystal', accessory: 'monocle' },
    },
    {
      name: 'Infernal Pyromancer',
      conf: { robeColor: '#dc2626', skinTone: 'dark', hatStyle: 'horns', wandStyle: 'scythe', accessory: 'amulet' },
    },
    {
      name: 'Emerald Alchemist',
      conf: { robeColor: '#059669', skinTone: 'goblin', hatStyle: 'cowl', wandStyle: 'potion', accessory: 'spectacles' },
    },
    {
      name: 'Celestial Seraph',
      conf: { robeColor: '#7c3aed', skinTone: 'pale', hatStyle: 'halo', wandStyle: 'book', accessory: 'fairy' },
    },
    {
      name: 'Cybernetic Sage',
      conf: { robeColor: '#0891b2', skinTone: 'fair', hatStyle: 'catears', wandStyle: 'crystal', accessory: 'visor' },
    },
  ];

  const handleUpdate = (updated: Partial<CharacterConfig>) => {
    sound.playStep();
    const next = { ...config, ...updated };
    onChangeConfig(next);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm select-none font-retro">
      {/* 100% Pixelated Box Frame: Zero rounded vector corners */}
      <div className="relative w-full max-w-2xl bg-slate-950 border-4 border-amber-500 shadow-[6px_6px_0px_#000,-2px_-2px_0px_#475569] text-slate-100 flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Retro Header Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b-4 border-amber-500/80">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-400 border border-black shadow-[1px_1px_0px_#000]" />
            <h2 className="font-pixel text-[11px] sm:text-xs text-amber-300 tracking-wider">
              ARC'S WARDROBE · PIXEL HERO CUSTOMIZER
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-0.5 bg-rose-900 hover:bg-rose-700 text-rose-200 border-2 border-rose-500 font-pixel text-[10px] cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
          >
            [X] CLOSE
          </button>
        </div>

        {/* Content Body: Left Preview, Right Tabs & Options */}
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden p-3 gap-3">
          
          {/* Left Column: Live 64x64 Pixel Art Viewport */}
          <div className="w-full sm:w-48 bg-slate-900 border-2 border-slate-700 p-2.5 flex flex-col items-center justify-between shadow-[3px_3px_0px_#000] shrink-0">
            <span className="font-pixel text-[9px] text-amber-400 mb-1">
              {showBackView ? 'BACK VIEW' : 'FRONT VIEW'}
            </span>

            {/* Pixelated Mirror Display Box */}
            <div className="w-36 h-36 bg-slate-950 border-2 border-amber-400/70 flex items-center justify-center relative overflow-hidden shadow-inner my-1">
              {/* Retro checker pattern */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                  backgroundSize: '8px 8px',
                }}
              />

              {/* Pedestal shadow */}
              <div className="absolute bottom-2 w-20 h-4 bg-slate-800 border-b-2 border-slate-950 opacity-80" />

              <img
                src={spriteSrc}
                alt="Arc Custom Character Sprite"
                className="relative z-10 w-28 h-28 object-contain pixelated drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] animate-bounce"
                style={{ animationDuration: '2.2s' }}
              />
            </div>

            {/* View Rotation Button */}
            <button
              type="button"
              onClick={() => {
                sound.playStep();
                setShowBackView(!showBackView);
              }}
              className="mt-2 w-full py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border-2 border-cyan-500/80 font-pixel text-[9px] flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              <span>{showBackView ? 'SHOW FRONT' : 'SHOW BACK (BATTLE)'}</span>
            </button>

            {/* Current Summary */}
            <div className="mt-2 text-[9px] font-mono text-slate-400 text-center leading-tight">
              <span>Hat: <strong className="text-amber-300 uppercase">{config.hatStyle}</strong></span><br />
              <span>Wand: <strong className="text-cyan-300 uppercase">{config.wandStyle}</strong></span>
            </div>
          </div>

          {/* Right Column: Pixel Tabs and Detailed Pickers */}
          <div className="flex-1 flex flex-col bg-slate-900 border-2 border-slate-700 overflow-hidden shadow-[3px_3px_0px_#000]">
            
            {/* Retro Pixel Tab Navigation */}
            <div className="flex border-b-2 border-slate-700 bg-slate-950 overflow-x-auto scrollbar-none">
              {(
                [
                  { id: 'robes', label: 'ROBES' },
                  { id: 'skin', label: 'COMPLEXION' },
                  { id: 'hats', label: 'HEADWEAR' },
                  { id: 'weapons', label: 'WEAPONS' },
                  { id: 'accessories', label: 'ACCESSORIES' },
                  { id: 'presets', label: 'PRESETS' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    sound.playStep();
                    setActiveTab(tab.id);
                  }}
                  className={`px-2.5 py-1.5 font-pixel text-[9px] shrink-0 border-r-2 border-slate-800 transition-colors cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-amber-500 text-slate-950 font-bold border-b-2 border-amber-500'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents: Scrollable */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3">
              
              {/* TAB 1: ROBES */}
              {activeTab === 'robes' && (
                <div>
                  <span className="font-mono text-[10px] text-amber-400 block mb-2">
                    SELECT ALCHEMICAL ROBE DYE (12 HUES):
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {robeOptions.map((opt) => {
                      const isSel = config.robeColor === opt.color;
                      return (
                        <button
                          key={opt.color}
                          type="button"
                          onClick={() => handleUpdate({ robeColor: opt.color })}
                          className={`p-1.5 border-2 flex items-center gap-2 font-retro text-xs transition-all cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 ${
                            isSel
                              ? 'border-white bg-slate-800 text-white font-bold'
                              : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <div
                            className="w-5 h-5 border border-black shadow-[1px_1px_0px_#000] shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: opt.color }}
                          >
                            {isSel && <Check className="w-3 h-3 text-white drop-shadow" />}
                          </div>
                          <span className="truncate text-[10px]">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: COMPLEXION / SKIN TONE */}
              {activeTab === 'skin' && (
                <div>
                  <span className="font-mono text-[10px] text-amber-400 block mb-2">
                    SELECT HERO COMPLEXION & SKIN TONE:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {skinOptions.map((opt) => {
                      const isSel = (config.skinTone || 'fair') === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleUpdate({ skinTone: opt.value })}
                          className={`p-2 border-2 flex items-center gap-2 font-retro text-xs cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 ${
                            isSel
                              ? 'border-amber-400 bg-amber-950/60 text-white font-bold'
                              : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <div
                            className="w-6 h-6 border-2 border-black shadow-[1px_1px_0px_#000] shrink-0"
                            style={{ backgroundColor: opt.color }}
                          />
                          <span className="text-[10px]">{opt.label}</span>
                          {isSel && <Check className="w-3.5 h-3.5 text-amber-400 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: HEADWEAR / HATS */}
              {activeTab === 'hats' && (
                <div>
                  <span className="font-mono text-[10px] text-amber-400 block mb-2">
                    SELECT HEADWEAR (10 PIXEL STYLES):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {hatOptions.map((opt) => {
                      const isSel = config.hatStyle === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleUpdate({ hatStyle: opt.value })}
                          className={`p-2 border-2 text-left cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-between ${
                            isSel
                              ? 'border-amber-400 bg-amber-950/70 text-amber-200'
                              : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600 hover:text-white'
                          }`}
                        >
                          <div>
                            <div className="font-pixel text-[10px] text-white">{opt.label}</div>
                            <div className="font-mono text-[9px] text-slate-400">{opt.desc}</div>
                          </div>
                          {isSel && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: WEAPONS / CATALYSTS */}
              {activeTab === 'weapons' && (
                <div>
                  <span className="font-mono text-[10px] text-cyan-400 block mb-2">
                    SELECT CATALYST / WEAPON (7 PIXEL ARSENAL):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {wandOptions.map((opt) => {
                      const isSel = config.wandStyle === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleUpdate({ wandStyle: opt.value })}
                          className={`p-2 border-2 text-left cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-between ${
                            isSel
                              ? 'border-cyan-400 bg-cyan-950/70 text-cyan-200'
                              : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600 hover:text-white'
                          }`}
                        >
                          <div>
                            <div className="font-pixel text-[10px] text-white">{opt.label}</div>
                            <div className="font-mono text-[9px] text-slate-400">{opt.desc}</div>
                          </div>
                          {isSel && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 5: ACCESSORIES */}
              {activeTab === 'accessories' && (
                <div>
                  <span className="font-mono text-[10px] text-emerald-400 block mb-2">
                    SELECT ACCESSORY (8 PIXEL RELICS):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {accessoryOptions.map((opt) => {
                      const isSel = config.accessory === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleUpdate({ accessory: opt.value })}
                          className={`p-2 border-2 text-left cursor-pointer shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-between ${
                            isSel
                              ? 'border-emerald-400 bg-emerald-950/70 text-emerald-200'
                              : 'border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600 hover:text-white'
                          }`}
                        >
                          <div>
                            <div className="font-pixel text-[10px] text-white">{opt.label}</div>
                            <div className="font-mono text-[9px] text-slate-400">{opt.desc}</div>
                          </div>
                          {isSel && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 6: PRESETS */}
              {activeTab === 'presets' && (
                <div>
                  <span className="font-mono text-[10px] text-amber-400 block mb-2">
                    ONE-CLICK ARCHETYPE PRESETS:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {presets.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          sound.playShieldBlock();
                          onChangeConfig(p.conf);
                        }}
                        className="p-2 border-2 border-slate-800 hover:border-amber-400 bg-slate-950 text-left font-retro text-xs text-slate-200 hover:text-white shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-pixel text-[10px] text-amber-300">{p.name}</span>
                        <span className="font-mono text-[9px] text-slate-500">APPLY →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Modal Actions */}
            <div className="p-2.5 bg-slate-950 border-t-2 border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400">
                Customizations saved instantly.
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-pixel text-[10px] border-2 border-black shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer font-bold"
              >
                SAVE & RETURN
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
