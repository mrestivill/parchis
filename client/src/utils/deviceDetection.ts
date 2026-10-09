/**
 * Device Detection Utilities
 * 
 * Detects mobile devices and low-end GPUs to optimize rendering performance.
 */

/**
 * Detects if the current device is a mobile device based on user agent.
 */
export const isMobileDevice = (): boolean => {
    // Basic User Agent check
    const ua = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    // Check for touch points (common in tablets/phones even when UA is missing mobile keywords)
    const hasTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || ('ontouchstart' in window);

    return isMobileUA || (hasTouch && /Macintosh/i.test(ua)); // iPad Pro often reports as Macintosh
};

/**
 * Specifically detects if the device is a tablet based on screen size and touch capability.
 */
export const isTabletDevice = (): boolean => {
    const isMobile = isMobileDevice();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const maxDim = Math.max(width, height);
    const minDim = Math.min(width, height);

    // Typical tablet ranges: 768px to 1366px (iPad Pro 12.9)
    // and must have touch support
    const hasTouch = (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || ('ontouchstart' in window);

    // If it's reported as mobile but has a large enough screen, it's a tablet
    // Or if it's "Desktop" but has touch and tablet-like dimensions
    return hasTouch && (
        (isMobile && minDim >= 600) ||
        (!isMobile && maxDim >= 1024 && maxDim <= 1366)
    );
};

/**
 * Detects if the device has a low-end GPU that may struggle with heavy SVG filters.
 * Uses WebGL renderer detection when available, falls back to mobile detection.
 */
export const isLowEndDevice = (): boolean => {
    // First check: Try WebGL detection
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;

        if (!gl) {
            // No WebGL support = definitely low-end
            return true;
        }

        // Try to get GPU info (skip on Firefox to avoid deprecation warning)
        const isFirefox = /Firefox/i.test(navigator.userAgent);
        if (!isFirefox) {
            try {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

                    // List of known low-end GPU families
                    const lowEndGPUs = [
                        /Mali-4/i,        // ARM Mali 400 series (very old)
                        /Adreno 3/i,      // Qualcomm Adreno 300 series
                        /PowerVR SGX/i,   // Imagination PowerVR SGX (old)
                        /Adreno \(TM\) 4/i, // Adreno 400 series (low-mid range)
                    ];

                    const isLowEndGPU = lowEndGPUs.some(pattern => pattern.test(renderer));
                    if (isLowEndGPU) {
                        console.log('[Device Detection] Low-end GPU detected:', renderer);
                        return true;
                    }
                }
            } catch (e) {
                // Silently ignore if extension is not available
            }
        }

        // Check for low memory (< 2GB typically indicates low-end)
        if ('deviceMemory' in navigator) {
            const memory = (navigator as any).deviceMemory;
            if (memory && memory < 2) {
                console.log('[Device Detection] Low memory detected:', memory, 'GB');
                return true;
            }
        }

        // Check hardware concurrency (< 4 cores typically indicates low-end)
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            console.log('[Device Detection] Low CPU cores detected:', navigator.hardwareConcurrency);
            return true;
        }

    } catch (error) {
        console.warn('[Device Detection] WebGL detection failed:', error);
        // If detection fails, assume low-end for safety
        return true;
    }

    // Fallback: If mobile, assume low-end for conservative optimization
    const isMobile = isMobileDevice();
    if (isMobile) {
        console.log('[Device Detection] Mobile device detected, using optimized rendering');
    }
    return isMobile;
};

/**
 * Gets a performance tier for the device (1 = low, 2 = medium, 3 = high)
 */
export const getDevicePerformanceTier = (): 1 | 2 | 3 => {
    if (isLowEndDevice()) return 1;

    // Check for high-end indicators
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;

        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

                // High-end GPU patterns
                const highEndGPUs = [
                    /NVIDIA/i,
                    /AMD/i,
                    /Radeon/i,
                    /GeForce/i,
                    /Adreno \(TM\) [6-9]/i, // Adreno 600+ series
                    /Mali-G/i,              // ARM Mali G series (modern)
                    /Apple GPU/i,           // Apple Silicon
                ];

                const isHighEnd = highEndGPUs.some(pattern => pattern.test(renderer));
                if (isHighEnd) {
                    return 3;
                }
            }
        }

        // Check for high memory (>= 8GB)
        if ('deviceMemory' in navigator) {
            const memory = (navigator as any).deviceMemory;
            if (memory && memory >= 8) {
                return 3;
            }
        }
    } catch (error) {
        // Ignore errors
    }

    // Default to medium tier
    return 2;
};
