import type { GameState } from '@parchis/shared';

/**
 * State Synchronization Manager
 * Ensures client state matches server state and detects conflicts
 */

export interface StateConflict {
    type: 'position' | 'status' | 'dice' | 'turn';
    pieceId?: string;
    expected: any;
    actual: any;
    timestamp: number;
}

class StateSyncManager {
    private expectedState: GameState | null = null;
    private conflicts: StateConflict[] = [];
    private listeners: Set<(conflicts: StateConflict[]) => void> = new Set();

    /**
     * Set expected state (optimistic update)
     */
    public setExpectedState(state: GameState): void {
        this.expectedState = state;
    }

    /**
     * Verify server state matches expected state
     */
    public verifyState(serverState: GameState): StateConflict[] {
        if (!this.expectedState) {
            this.expectedState = serverState;
            return [];
        }

        const conflicts: StateConflict[] = [];

        // Check turn
        if (this.expectedState.currentTurn !== serverState.currentTurn) {
            conflicts.push({
                type: 'turn',
                expected: this.expectedState.currentTurn,
                actual: serverState.currentTurn,
                timestamp: Date.now()
            });
        }

        // Check dice
        if (JSON.stringify(this.expectedState.dice) !== JSON.stringify(serverState.dice)) {
            conflicts.push({
                type: 'dice',
                expected: this.expectedState.dice,
                actual: serverState.dice,
                timestamp: Date.now()
            });
        }

        // Check piece positions
        this.expectedState.players.forEach((expectedPlayer, playerIndex) => {
            const serverPlayer = serverState.players[playerIndex];
            if (!serverPlayer) return;

            expectedPlayer.pieces.forEach((expectedPiece, pieceIndex) => {
                const serverPiece = serverPlayer.pieces[pieceIndex];
                if (!serverPiece) return;

                // Check position
                if (expectedPiece.position !== serverPiece.position) {
                    conflicts.push({
                        type: 'position',
                        pieceId: expectedPiece.id,
                        expected: expectedPiece.position,
                        actual: serverPiece.position,
                        timestamp: Date.now()
                    });
                }

                // Check status
                if (expectedPiece.status !== serverPiece.status) {
                    conflicts.push({
                        type: 'status',
                        pieceId: expectedPiece.id,
                        expected: expectedPiece.status,
                        actual: serverPiece.status,
                        timestamp: Date.now()
                    });
                }
            });
        });

        if (conflicts.length > 0) {
            this.conflicts = [...this.conflicts, ...conflicts];
            this.notifyListeners();

            // Auto-resolve by accepting server state
            this.expectedState = serverState;
        }

        return conflicts;
    }

    /**
     * Get all conflicts
     */
    public getConflicts(): StateConflict[] {
        return [...this.conflicts];
    }

    /**
     * Clear conflicts
     */
    public clearConflicts(): void {
        this.conflicts = [];
        this.notifyListeners();
    }

    /**
     * Subscribe to conflict notifications
     */
    public subscribe(listener: (conflicts: StateConflict[]) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify listeners
     */
    private notifyListeners(): void {
        const conflicts = this.getConflicts();
        this.listeners.forEach(listener => listener(conflicts));
    }

    /**
     * Reset manager
     */
    public reset(): void {
        this.expectedState = null;
        this.conflicts = [];
        this.notifyListeners();
    }
}

// Singleton instance
export const stateSync = new StateSyncManager();
