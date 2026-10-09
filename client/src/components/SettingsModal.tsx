
import React from 'react';
import { ALL_THEMES } from '../types/theme';
import { useUITheme } from '../context/ThemeContext';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentThemeName: string;
    onSetTheme: (name: string) => void;
    volume: { master: number; sfx: number; music: number };
    onSetVolume: (type: 'master' | 'sfx' | 'music', value: number) => void;
    gameOptions: { autoRoll: boolean; confirmMove: boolean };
    onSetGameOption: (option: 'autoRoll' | 'confirmMove', value: boolean) => void;
    // onShowTutorial removed
    isHost?: boolean;
    spectatorOptions?: import('@parchis/shared').GameOptions;
    onUpdateSpectatorOptions?: (options: Partial<import('@parchis/shared').GameOptions>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    currentThemeName,
    onSetTheme,
    volume,
    onSetVolume,
    gameOptions,
    onSetGameOption,
    isHost,
    spectatorOptions,
    onUpdateSpectatorOptions
}) => {
    const { theme, toggleTheme } = useUITheme();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-gray-700 flex justify-between items-center bg-slate-50 dark:bg-gray-900/50">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                        <span>⚙️</span> Settings
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-slate-200 dark:bg-gray-700 text-slate-500 dark:text-gray-400 hover:bg-slate-300 dark:hover:bg-gray-600 hover:text-slate-700 dark:hover:text-white transition-all flex items-center justify-center font-bold"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-gray-600 space-y-8">

                    {/* Appearance Section */}
                    <div className="mb-0">
                        <h4 className="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span>🎨</span> Appearance
                        </h4>

                        <div className="bg-slate-50 dark:bg-gray-800/50 p-4 rounded-xl border border-slate-100 dark:border-gray-700 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-700 dark:text-gray-200 text-sm">Interface Mode</span>
                                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">Switch between light and dark theme</span>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className="px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-600 shadow-sm hover:bg-slate-50 dark:hover:bg-gray-700 transition-all active:scale-95 flex items-center gap-2 font-bold text-xs"
                                >
                                    {theme === 'dark' ? (
                                        <><span>☀️</span> LIGHT MODE</>
                                    ) : (
                                        <><span>🌙</span> DARK MODE</>
                                    )}
                                </button>
                            </div>
                        </div>

                        <h5 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-3">Board Design</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {ALL_THEMES.map(theme => (
                                <button
                                    key={theme.name}
                                    onClick={() => onSetTheme(theme.name)}
                                    className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 overflow-hidden group ${currentThemeName === theme.name
                                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-500/10'
                                        : 'border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 hover:border-yellow-500/50 hover:bg-white dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {/* Preview Circle */}
                                    <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center overflow-hidden relative shadow-lg group-hover:scale-110 transition-transform duration-300"
                                        style={{
                                            backgroundColor: theme.background,
                                            backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : 'none',
                                            backgroundSize: 'cover',
                                            borderColor: theme.borderColor
                                        }}
                                    >
                                        <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-inner" style={{ backgroundColor: theme.playerColors.blue }} />
                                    </div>

                                    {/* Name */}
                                    <span className={`text-sm font-bold ${currentThemeName === theme.name
                                        ? 'text-yellow-600 dark:text-yellow-500'
                                        : 'text-slate-600 dark:text-gray-300'
                                        }`}>
                                        {theme.name}
                                    </span>

                                    {/* Active Badge */}
                                    {currentThemeName === theme.name && (
                                        <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_8px_#eab308]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Game Options Section */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span>🎮</span> Game
                        </h4>
                        <div className="space-y-4 bg-slate-50 dark:bg-gray-800/50 p-4 rounded-xl border border-slate-100 dark:border-gray-700">
                            {/* Auto Roll */}
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-700 dark:text-gray-200 text-sm">Auto-Roll Dice</span>
                                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">Automatically rolls at the start of your turn</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={gameOptions.autoRoll}
                                        onChange={(e) => onSetGameOption('autoRoll', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                                </label>
                            </div>

                            {/* Confirm Move */}
                            <div className="flex items-center justify-between border-t border-slate-100 dark:border-gray-700/50 pt-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-slate-700 dark:text-gray-200 text-sm">Confirm Move</span>
                                    <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">Requires a second click to move a piece</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={gameOptions.confirmMove}
                                        onChange={(e) => onSetGameOption('confirmMove', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-500"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Host Options Section */}
                    {isHost && spectatorOptions && (
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span>🛡️</span> Room Control (Host)
                            </h4>
                            <div className="space-y-4 bg-yellow-500/5 dark:bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20">
                                {/* Allow Spectators */}
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 dark:text-gray-200 text-sm">Allow Spectators</span>
                                        <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">Other users can observe</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={spectatorOptions.allowSpectators}
                                            onChange={(e) => onUpdateSpectatorOptions?.({ allowSpectators: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
                                    </label>
                                </div>

                                {/* Spectator Read Chat */}
                                <div className="flex items-center justify-between border-t border-yellow-500/10 pt-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 dark:text-gray-200 text-sm">Spectators can read chat</span>
                                        <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">Can see messages from players</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={spectatorOptions.spectatorCanReadChat}
                                            onChange={(e) => {
                                                const val = e.target.checked;
                                                const updates: Partial<import('@parchis/shared').GameOptions> = { spectatorCanReadChat: val };
                                                if (!val) {
                                                    updates.spectatorCanWriteChat = false;
                                                }
                                                onUpdateSpectatorOptions?.(updates);
                                            }}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
                                    </label>
                                </div>

                                {/* Spectator Write Chat */}
                                <div className="flex items-center justify-between border-t border-yellow-500/10 pt-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 dark:text-gray-200 text-sm">Spectators can write</span>
                                        <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">Can send messages to the room</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={spectatorOptions.spectatorCanWriteChat}
                                            onChange={(e) => {
                                                const val = e.target.checked;
                                                const updates: Partial<import('@parchis/shared').GameOptions> = { spectatorCanWriteChat: val };
                                                if (val) {
                                                    updates.spectatorCanReadChat = true;
                                                }
                                                onUpdateSpectatorOptions?.(updates);
                                            }}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
                                    </label>
                                </div>

                                {/* Allow Late Join */}
                                <div className="flex items-center justify-between border-t border-yellow-500/10 pt-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-700 dark:text-gray-200 text-sm">Allow late join</span>
                                        <span className="text-[10px] text-slate-400 dark:text-gray-500 font-medium">Players can join if the game has already started</span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={spectatorOptions.allowLateJoin ?? false}
                                            onChange={(e) => onUpdateSpectatorOptions?.({ allowLateJoin: e.target.checked })}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-500"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Sound Section */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span>🔊</span> Sound
                        </h4>

                        <div className="space-y-4 bg-slate-50 dark:bg-gray-800/50 p-4 rounded-xl border border-slate-100 dark:border-gray-700">
                            {/* Master Volume */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-gray-300">
                                    <span>Master Volume</span>
                                    <span>{Math.round(volume.master * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.05"
                                    value={volume.master}
                                    onChange={(e) => onSetVolume('master', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                />
                            </div>

                            {/* SFX Volume */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-gray-300">
                                    <span>Sound Effects</span>
                                    <span>{Math.round(volume.sfx * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.05"
                                    value={volume.sfx}
                                    onChange={(e) => onSetVolume('sfx', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>

                            {/* Music Volume (Placeholder/Extension) */}
                            <div className="flex flex-col gap-2 opacity-50 pointer-events-none grayscale">
                                <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-gray-300">
                                    <span>Music (Soon)</span>
                                    <span>{Math.round(volume.music * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.05"
                                    value={volume.music}
                                    onChange={(e) => onSetVolume('music', parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                                />
                            </div>
                        </div>
                    </div>





                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-gray-900 border-t border-slate-200 dark:border-gray-700 text-center">
                    <p className="text-xs text-slate-400 dark:text-gray-600 font-mono">
                        Parchis Royale v{__APP_VERSION__}
                    </p>
                </div>
            </div>
        </div>
    );
};
