import { useState, useEffect } from 'react';
import { animationQueue } from '../utils/animationQueue';
import type { PendingAnimation } from '../utils/animationQueue';

/**
 * Hook to use animation queue
 * Provides queue state and control functions
 */
export const useAnimationQueue = () => {
    const [queue, setQueue] = useState<PendingAnimation[]>([]);

    useEffect(() => {
        // Subscribe to queue changes
        const unsubscribe = animationQueue.subscribe(setQueue);

        // Initial state
        setQueue(animationQueue.getQueue());

        return unsubscribe;
    }, []);

    return {
        queue,
        enqueue: animationQueue.enqueue.bind(animationQueue),
        confirm: animationQueue.confirm.bind(animationQueue),
        cancel: animationQueue.cancel.bind(animationQueue),
        cancelAll: animationQueue.cancelAll.bind(animationQueue),
        isConfirmed: animationQueue.isConfirmed.bind(animationQueue),
        clear: animationQueue.clear.bind(animationQueue)
    };
};

/**
 * Hook to check if a specific piece should animate
 * Returns true only if the animation is confirmed by server
 */
export const useShouldAnimate = (pieceId: string): boolean => {
    const { queue } = useAnimationQueue();

    // Find pending animation for this piece
    const pendingAnimation = queue.find(
        a => a.pieceId === pieceId && !a.cancelled
    );

    // Only animate if confirmed
    return pendingAnimation?.confirmed ?? true; // Default to true for backward compatibility
};
