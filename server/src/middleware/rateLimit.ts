interface RateLimitData {
    count: number;
    resetTime: number;
}

const usage = new Map<string, RateLimitData>();

const LIMIT = 10; // Max events per second
const WINDOW_MS = 1000; // 1 second window

/**
 * Checks if a socket ID has exceeded the rate limit.
 * Uses a fixed window counter algorithm which is more memory efficient
 * than creating a timeout for every single event.
 * 
 * @param socketId The socket ID to check
 * @returns true if allowed, false if limit exceeded
 */
export const rateLimit = (socketId: string): boolean => {
    const now = Date.now();
    let data = usage.get(socketId);

    // If no data or window expired, reset
    if (!data || now > data.resetTime) {
        data = { count: 0, resetTime: now + WINDOW_MS };
        usage.set(socketId, data);
    }

    if (data.count >= LIMIT) {
        return false;
    }

    data.count++;
    return true;
};

/**
 * Cleans up rate limit data for a disconnected socket.
 * @param socketId The socket ID to clean up
 */
export const clearRateLimit = (socketId: string) => {
    usage.delete(socketId);
};
