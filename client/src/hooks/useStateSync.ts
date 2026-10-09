import { useState, useEffect } from 'react';
import { stateSync } from '../utils/stateSync';
import type { StateConflict } from '../utils/stateSync';
import type { GameState } from '@parchis/shared';

/**
 * Hook to manage state synchronization
 * Detects and reports conflicts between client and server state
 */
export const useStateSync = () => {
    const [conflicts, setConflicts] = useState<StateConflict[]>([]);

    useEffect(() => {
        // Subscribe to conflict notifications
        const unsubscribe = stateSync.subscribe(setConflicts);

        // Initial state
        setConflicts(stateSync.getConflicts());

        return unsubscribe;
    }, []);

    return {
        conflicts,
        verifyState: (serverState: GameState) => stateSync.verifyState(serverState),
        setExpectedState: (state: GameState) => stateSync.setExpectedState(state),
        clearConflicts: () => stateSync.clearConflicts(),
        reset: () => stateSync.reset()
    };
};

/**
 * Hook to detect if there are active conflicts
 */
export const useHasConflicts = (): boolean => {
    const { conflicts } = useStateSync();
    return conflicts.length > 0;
};

/**
 * Hook to get conflicts for a specific piece
 */
export const usePieceConflicts = (pieceId: string): StateConflict[] => {
    const { conflicts } = useStateSync();
    return conflicts.filter(c => c.pieceId === pieceId);
};
