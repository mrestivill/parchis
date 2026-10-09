// Dynamic import used to reduce initial bundle size
// import confetti from 'canvas-confetti';

class FXManager {
    private async getConfetti() {
        const module = await import('canvas-confetti');
        return module.default;
    }

    /**
     * Show a circular explosion burst for captures
     * @param x Normalized X coordinate (0-1) or screen X
     * @param y Normalized Y coordinate (0-1) or screen Y
     * @param color The principal color for the particles
     */
    public async showCapture(x: number, y: number, color: string) {
        try {
            const confetti = await this.getConfetti();
            confetti({
                particleCount: 40,
                spread: 360,
                startVelocity: 15,
                origin: { x, y },
                colors: [color, '#ffffff', '#ffd700'],
                shapes: ['circle'],
                ticks: 60,
                gravity: 1.2,
                scalar: 0.7,
                zIndex: 1000,
            });
        } catch (e) {
            console.error("Failed to load confetti", e);
        }
    }

    /**
     * Show celebratory confetti for goal entry
     * @param x Normalized X coordinate (0-1) or screen X
     * @param y Normalized Y coordinate (0-1) or screen Y
     */
    public async showGoal(x: number, y: number) {
        try {
            const confetti = await this.getConfetti();
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { x, y },
                colors: ['#ffd700', '#ffffff', '#ff0000', '#00ff00', '#0000ff'],
                zIndex: 1000,
            });
        } catch (e) {
            console.error("Failed to load confetti", e);
        }
    }

    /**
     * Full screen victory celebration
     */
    public async showVictory() {
        try {
            const confetti = await this.getConfetti();
            const duration = 5 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                // since particles fall down, start a bit higher than random
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        } catch (e) {
            console.error("Failed to load confetti", e);
        }
    }
}

export const fxManager = new FXManager();
