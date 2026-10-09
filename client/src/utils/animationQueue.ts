/**
 * Animation Queue Manager
 * Ensures animations execute in order and only after server confirmation
 */

export interface PendingAnimation {
    id: string;
    type: 'move' | 'capture' | 'goal' | 'roll';
    pieceId?: string;
    fromPos?: { position: number; status: string };
    toPos?: { position: number; status: string };
    timestamp: number;
    confirmed: boolean;
    cancelled: boolean;
}

class AnimationQueueManager {
    private queue: PendingAnimation[] = [];
    private executing: boolean = false;
    private listeners: Set<(queue: PendingAnimation[]) => void> = new Set();

    /**
     * Add animation to queue (pending server confirmation)
     */
    public enqueue(animation: Omit<PendingAnimation, 'timestamp' | 'confirmed' | 'cancelled'>): string {
        const pending: PendingAnimation = {
            ...animation,
            timestamp: Date.now(),
            confirmed: false,
            cancelled: false
        };

        this.queue.push(pending);
        this.notifyListeners();
        return pending.id;
    }

    /**
     * Confirm animation from server (allows execution)
     */
    public confirm(animationId: string): void {
        const animation = this.queue.find(a => a.id === animationId);
        if (animation) {
            animation.confirmed = true;
            this.notifyListeners();
            this.processQueue();
        }
    }

    /**
     * Cancel animation (e.g., server rejected move)
     */
    public cancel(animationId: string): void {
        const animation = this.queue.find(a => a.id === animationId);
        if (animation) {
            animation.cancelled = true;
            this.notifyListeners();
            this.processQueue();
        }
    }

    /**
     * Cancel all pending animations
     */
    public cancelAll(): void {
        this.queue.forEach(a => {
            if (!a.confirmed) {
                a.cancelled = true;
            }
        });
        this.notifyListeners();
    }

    /**
     * Process queue - execute confirmed animations
     */
    private async processQueue(): Promise<void> {
        if (this.executing) return;

        // Remove cancelled animations
        this.queue = this.queue.filter(a => !a.cancelled);

        // Find next confirmed animation
        const next = this.queue.find(a => a.confirmed && !a.cancelled);
        if (!next) return;

        this.executing = true;

        // Execute animation (actual execution handled by components)
        // Just wait for typical animation duration
        const duration = this.getAnimationDuration(next);
        await new Promise(resolve => setTimeout(resolve, duration));

        // Remove from queue
        this.queue = this.queue.filter(a => a.id !== next.id);
        this.executing = false;
        this.notifyListeners();

        // Process next
        this.processQueue();
    }

    /**
     * Get estimated animation duration
     */
    private getAnimationDuration(animation: PendingAnimation): number {
        switch (animation.type) {
            case 'move':
                return 1000; // 1 second for moves
            case 'capture':
                return 1500; // 1.5 seconds for captures
            case 'goal':
                return 1200; // 1.2 seconds for goal entry
            case 'roll':
                return 2000; // 2 seconds for dice roll
            default:
                return 1000;
        }
    }

    /**
     * Get current queue state
     */
    public getQueue(): PendingAnimation[] {
        return [...this.queue];
    }

    /**
     * Check if animation is confirmed
     */
    public isConfirmed(animationId: string): boolean {
        const animation = this.queue.find(a => a.id === animationId);
        return animation?.confirmed ?? false;
    }

    /**
     * Subscribe to queue changes
     */
    public subscribe(listener: (queue: PendingAnimation[]) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Notify all listeners
     */
    private notifyListeners(): void {
        const queue = this.getQueue();
        this.listeners.forEach(listener => listener(queue));
    }

    /**
     * Clear all animations (for cleanup)
     */
    public clear(): void {
        this.queue = [];
        this.executing = false;
        this.notifyListeners();
    }
}

// Singleton instance
export const animationQueue = new AnimationQueueManager();
