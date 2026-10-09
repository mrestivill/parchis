import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EMOTES } from '@parchis/shared';
import type { EmoteId } from '@parchis/shared';

interface FloatingEmoteProps {
    emoteId: EmoteId;
    startTop?: string | number;
    endTop?: string | number;
    onComplete?: () => void;
}

export const FloatingEmote: React.FC<FloatingEmoteProps> = ({ emoteId, startTop = '50%', endTop = '0%' }) => {
    const emote = EMOTES.find(e => e.id === emoteId);

    if (!emote) {
        console.warn('FloatingEmote: Emote not found:', emoteId);
        return null;
    }

    // Determine if we're rendering an emoji or an image
    const isAnimated = !!(emote.animated && emote.image);
    const content = isAnimated ? emote.image : (emote.emoji || '❓');

    console.log('FloatingEmote rendering:', { emoteId, isAnimated, content });

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={`${emoteId}-${Date.now()}`}
                initial={{ opacity: 0, scale: 0.5, top: startTop }}
                animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0.5, 1.2, 1, 0.8],
                    top: endTop
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, times: [0, 0.1, 0.8, 1] }}
                className="absolute left-1/2 -translate-x-1/2 pointer-events-none drop-shadow-md z-[60]"
            >
                {isAnimated ? (
                    <img
                        src={content}
                        alt={emoteId}
                        crossOrigin="anonymous"
                        className="w-16 h-16 object-contain block"
                        style={{ display: 'block', minWidth: '64px', minHeight: '64px' }}
                        onError={(e) => {
                            console.error('Failed to load animated emote:', content);
                            e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                            console.log('Animated emote loaded successfully:', content);
                        }}
                    />
                ) : (
                    <span className="text-4xl">{content}</span>
                )}
            </motion.div>
        </AnimatePresence>
    );
};
