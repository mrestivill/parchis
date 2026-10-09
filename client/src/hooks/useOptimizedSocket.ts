import React, { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';

/**
 * Hook to manage socket event listeners with automatic cleanup
 * Prevents memory leaks from accumulated event listeners
 */
export const useOptimizedSocket = (
    socket: Socket | null,
    eventHandlers: Record<string, (...args: any[]) => void>
) => {
    const handlersRef = useRef(eventHandlers);

    // Update handlers ref when they change
    useEffect(() => {
        handlersRef.current = eventHandlers;
    }, [eventHandlers]);

    useEffect(() => {
        if (!socket) return;

        // Register all event handlers
        const registeredEvents = Object.keys(handlersRef.current);

        registeredEvents.forEach(event => {
            const handler = handlersRef.current[event];
            socket.on(event, handler);
        });

        // Cleanup: Remove all event listeners
        return () => {
            registeredEvents.forEach(event => {
                const handler = handlersRef.current[event];
                socket.off(event, handler);
            });
        };
    }, [socket]); // Only re-run if socket instance changes
};

/**
 * Hook to debounce rapid state updates
 * Useful for preventing excessive re-renders
 */
export const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

/**
 * Hook to limit the frequency of function calls
 * Useful for expensive operations like validation
 */
export const useThrottle = <T extends (...args: any[]) => any>(
    callback: T,
    delay: number
): T => {
    const lastRun = React.useRef(Date.now());

    return React.useCallback(
        ((...args) => {
            const now = Date.now();
            if (now - lastRun.current >= delay) {
                lastRun.current = now;
                return callback(...args);
            }
        }) as T,
        [callback, delay]
    );
};
