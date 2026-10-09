
import { useState, useEffect } from 'react';
import { ALL_THEMES, CLASSIC_THEME } from '../types/theme';
import type { BoardTheme } from '../types/theme';
import { soundManager } from '../utils/soundManager';

interface Settings {
    themeName: string;
    volume: {
        master: number;
        sfx: number;
        music: number;
    };
    game: {
        autoRoll: boolean;
        confirmMove: boolean;
    };
}

interface UseSettingsReturn {
    settings: Settings;
    currentTheme: BoardTheme;
    setThemeName: (name: string) => void;
    setVolume: (type: 'master' | 'sfx' | 'music', value: number) => void;
    setGameOption: (option: 'autoRoll' | 'confirmMove', value: boolean) => void;
}

const DEFAULT_SETTINGS: Settings = {
    themeName: 'Classic',
    volume: {
        master: 0.5,
        sfx: 1.0,
        music: 1.0
    },
    game: {
        autoRoll: false,
        confirmMove: false
    }
};

export const useSettings = (): UseSettingsReturn => {
    // Initialize state from localStorage or default
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const savedTheme = localStorage.getItem('parchis_theme');
            const savedVolume = localStorage.getItem('parchis_volume');
            const savedGame = localStorage.getItem('parchis_game_options');

            return {
                themeName: savedTheme || DEFAULT_SETTINGS.themeName,
                volume: savedVolume ? JSON.parse(savedVolume) : DEFAULT_SETTINGS.volume,
                game: savedGame ? JSON.parse(savedGame) : DEFAULT_SETTINGS.game
            };
        } catch (error) {
            console.error('Error reading settings from localStorage:', error);
            return DEFAULT_SETTINGS;
        }
    });

    // Derived theme object
    const currentTheme = ALL_THEMES.find(t => t.name === settings.themeName) || CLASSIC_THEME;

    // Persist Theme changes
    useEffect(() => {
        localStorage.setItem('parchis_theme', settings.themeName);
    }, [settings.themeName]);

    // Persist Volume changes & Sync with SoundManager
    useEffect(() => {
        localStorage.setItem('parchis_volume', JSON.stringify(settings.volume));

        // Sync sound manager
        soundManager.setVolume('master', settings.volume.master);
        soundManager.setVolume('sfx', settings.volume.sfx);
        soundManager.setVolume('music', settings.volume.music);
    }, [settings.volume]);

    // Persist Game Options
    useEffect(() => {
        localStorage.setItem('parchis_game_options', JSON.stringify(settings.game));
    }, [settings.game]);

    // Initial Sync on Mount
    useEffect(() => {
        soundManager.setVolume('master', settings.volume.master);
        soundManager.setVolume('sfx', settings.volume.sfx);
        soundManager.setVolume('music', settings.volume.music);
    }, []);

    const setThemeName = (name: string) => {
        setSettings(prev => ({ ...prev, themeName: name }));
    };

    const setVolume = (type: 'master' | 'sfx' | 'music', value: number) => {
        setSettings(prev => ({
            ...prev,
            volume: {
                ...prev.volume,
                [type]: value
            }
        }));
    };

    const setGameOption = (option: 'autoRoll' | 'confirmMove', value: boolean) => {
        setSettings(prev => ({
            ...prev,
            game: {
                ...prev.game,
                [option]: value
            }
        }));
    };

    return {
        settings,
        currentTheme,
        setThemeName,
        setVolume,
        setGameOption
    };
};
