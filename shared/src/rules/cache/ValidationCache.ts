import { MoveResult } from '../../types';

/**
 * Cache for move validation results to avoid redundant calculations
 * Cache is scoped to a single turn and invalidated on state changes
 */
export class ValidationCache {
    private cache: Map<string, MoveResult> = new Map();
    private turnId: string = '';
    private stateHash: string = '';
    private hits: number = 0;
    private misses: number = 0;

    /**
     * Get cached validation result
     */
    get(pieceId: string, dieValue: number): MoveResult | null {
        const key = this.getCacheKey(pieceId, dieValue);
        const result = this.cache.get(key) || null;

        if (result) {
            this.hits++;
        } else {
            this.misses++;
        }

        return result;
    }

    /**
     * Store validation result in cache
     */
    set(pieceId: string, dieValue: number, result: MoveResult): void {
        const key = this.getCacheKey(pieceId, dieValue);
        this.cache.set(key, result);
    }

    /**
     * Update turn context and clear cache if changed
     */
    updateContext(turnId: string, stateHash: string): void {
        if (this.turnId !== turnId || this.stateHash !== stateHash) {
            this.clear();
            this.turnId = turnId;
            this.stateHash = stateHash;
        }
    }

    /**
     * Clear all cached results
     */
    clear(): void {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Get cache statistics for debugging
     */
    getStats() {
        const total = this.hits + this.misses;
        return {
            size: this.cache.size,
            turnId: this.turnId,
            stateHash: this.stateHash,
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? this.hits / total : 0
        };
    }

    private getCacheKey(pieceId: string, dieValue: number): string {
        return `${this.turnId}:${pieceId}:${dieValue}:${this.stateHash}`;
    }
}
