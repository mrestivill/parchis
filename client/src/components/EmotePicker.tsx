import React from 'react';
import { EMOTES } from '@parchis/shared';
import type { EmoteId } from '@parchis/shared';

interface EmotePickerProps {
    onSelect: (emoteId: EmoteId) => void;
    onClose: () => void;
}

export const EmotePicker: React.FC<EmotePickerProps> = ({ onSelect, onClose }) => {
    return (
        <>
            {/* Backdrop for outside click closing - Fixed to viewport */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Picker Container */}
            <div className="relative z-50 bg-gray-800/95 backdrop-blur-xl rounded-2xl p-4 lg:p-6 border border-white/10 shadow-2xl w-max max-w-[90vw]">
                <div className="grid grid-cols-4 gap-3 lg:gap-4">
                    {EMOTES.map((emote) => {
                        const isAnimated = emote.animated && emote.image;
                        const content = isAnimated ? emote.image : emote.emoji;

                        return (
                            <button
                                key={emote.id}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onSelect(emote.id);
                                    onClose();
                                }}
                                className="w-16 h-16 lg:w-20 lg:h-20 flex items-center justify-center bg-gray-700/30 hover:bg-white/10 rounded-xl lg:rounded-2xl transition-all hover:scale-110 active:scale-90 select-none cursor-pointer border border-gray-600/30"
                            >
                                {isAnimated ? (
                                    <img
                                        src={content}
                                        alt={emote.id}
                                        className="w-10 h-10 lg:w-12 lg:h-12 object-contain"
                                    />
                                ) : (
                                    <span className="text-3xl lg:text-4xl">{content}</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
};
