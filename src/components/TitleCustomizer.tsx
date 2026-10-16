import React from 'react';
import { CharacterConfig } from '../types/game';
import { getPlayerSpriteDataURL } from '../graphics/pixelTextures';
import { User, Sparkles, Check } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface TitleCustomizerProps {
  config: CharacterConfig;
  onChangeConfig: (newConfig: CharacterConfig) => void;
}

export const TitleCustomizer: React.FC<TitleCustomizerProps> = ({
  config,
  onChangeConfig,
}) => {
  const spriteSrc = getPlayerSpriteDataURL(config, 0, false);

  const robeOptions = [
    { label: 'Sapphire', color: '#2563eb' },
    { label: 'Crimson', color: '#dc2626' },
    { label: 'Emerald', color: '#059669' },
    { label: 'Amethyst', color: '#7c3aed' },
    { label: 'Amber', color: '#d97706' },
    { label: 'Void', color: '#1e293b' },
    { label: 'Rose', color: '#e11d48' },
    { label: 'Teal', color: '#0891b2' },
  ];

  const hatOptions: { label: string; value: CharacterConfig['hatStyle'] }[] = [
    { label: 'Wizard Hat', value: 'wizard' },
    { label: 'Alchemist Cowl', value: 'cowl' },
    { label: 'Shadow Hood', value: 'hood' },
    { label: 'Crown of Wholes', value: 'crown' },
  ];

  const wandOptions: { label: string; value: CharacterConfig['wandStyle'] }[] = [
    { label: 'Oak Wand', value: 'wood' },
    { label: 'Crystal Staff', value: 'crystal' },
    { label: 'Relic Blade', value: 'gold' },
  ];

  const accessoryOptions: { label: string; value: CharacterConfig['accessory'] }[] = [
    { label: 'No Accessory', value: 'none' },
    { label: 'Spectacles', value: 'spectacles' },
    { label: 'Monocle', value: 'monocle' },
    { label: 'Arcane Visor', value: 'visor' },
  ];

  const presets: { name: string; conf: CharacterConfig }[] = [
    {
      name: 'Classic Arc',
      conf: { robeColor: '#2563eb', hatStyle: 'wizard', wandStyle: 'wood', accessory: 'none' },
    },
    {
      name: 'Pyromancer',
      conf: { robeColor: '#dc2626', hatStyle: 'hood', wandStyle: 'gold', accessory: 'visor' },
    },
    {
      name: 'Forest Sage',
      conf: { robeColor: '#059669', hatStyle: 'cowl', wandStyle: 'crystal', accessory: 'spectacles' },
    },
    {
      name: 'Archmage',
      conf: { robeColor: '#d97706', hatStyle: 'crown', wandStyle: 'crystal', accessory: 'monocle' },
    },
  ];

  const applyPreset = (presetConfig: CharacterConfig) => {
    sound.playShieldBreak();
    onChangeConfig(presetConfig);
  };

  return (
    <div className="bg-slate-900/95 border-2 border-slate-700/80 rounded-2xl p-3.5 shadow-xl backdrop-blur-md flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 text-amber-400 font-pixel text-xs">
          <User className="w-4 h-4" />
          <span>HERO CUSTOMIZATION</span>
        </div>
        <span className="text-[10px] text-cyan-300 font-mono">Arc's Workshop</span>
      </div>

      {/* Main Row: Sprite Preview + Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Live Sprite Preview Viewport */}
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 sm:w-32 sm:h-32 bg-slate-950 border-2 border-amber-500/80 rounded-2xl flex items-center justify-center p-2 relative shadow-[0_0_15px_rgba(245,158,11,0.2)] overflow-hidden">
            {/* Pedestal Shadow */}
            <div className="absolute bottom-2 w-20 h-5 bg-slate-800 rounded-[50%] border border-slate-700 opacity-60" />

            <img
              src={spriteSrc}
              alt="Arc Sprite Preview"
              className="relative z-10 w-24 h-24 sm:w-28 sm:h-28 object-contain pixelated drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] animate-bounce"
              style={{ animationDuration: '2.5s' }}
            />
          </div>
          <span className="text-[9px] font-pixel text-amber-300 mt-1.5">64x64 ARC</span>
        </div>

        {/* Options Stack */}
        <div className="flex-1 flex flex-col gap-2.5 w-full">
          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> PRESETS:
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {presets.map((p) => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => applyPreset(p.conf)}
                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 rounded-lg text-[9px] font-retro text-slate-300 hover:text-white transition-all active:scale-95 text-center truncate"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Robe Dye */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 block mb-1">ROBE DYE:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {robeOptions.map((opt) => {
                const isSelected = config.robeColor === opt.color;
                return (
                  <button
                    type="button"
                    key={opt.color}
                    onClick={() => {
                      sound.playStep();
                      onChangeConfig({ ...config, robeColor: opt.color });
                    }}
                    className={`w-7 h-7 rounded-lg transition-transform active:scale-90 border-2 flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.7)]'
                        : 'border-slate-700 hover:scale-105'
                    }`}
                    style={{ backgroundColor: opt.color }}
                    title={opt.label}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Headwear */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 block mb-1">HEADWEAR:</span>
            <div className="grid grid-cols-2 gap-1">
              {hatOptions.map((opt) => {
                const isSelected = config.hatStyle === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => {
                      sound.playStep();
                      onChangeConfig({ ...config, hatStyle: opt.value });
                    }}
                    className={`px-2 py-1 rounded-lg text-[9px] font-retro transition-colors border cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-400 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-2.5 h-2.5 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalyst / Wand */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 block mb-1">CATALYST:</span>
            <div className="grid grid-cols-3 gap-1">
              {wandOptions.map((opt) => {
                const isSelected = config.wandStyle === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => {
                      sound.playStep();
                      onChangeConfig({ ...config, wandStyle: opt.value });
                    }}
                    className={`px-1.5 py-1 rounded-lg text-[8px] font-retro truncate transition-colors border cursor-pointer text-center ${
                      isSelected
                        ? 'bg-cyan-700 text-white border-cyan-400 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accessory */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 block mb-1">ACCESSORY:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {accessoryOptions.map((opt) => {
                const isSelected = config.accessory === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => {
                      sound.playStep();
                      onChangeConfig({ ...config, accessory: opt.value });
                    }}
                    className={`px-1.5 py-1 rounded-lg text-[8px] font-retro truncate transition-colors border cursor-pointer text-center ${
                      isSelected
                        ? 'bg-emerald-700 text-white border-emerald-400 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
