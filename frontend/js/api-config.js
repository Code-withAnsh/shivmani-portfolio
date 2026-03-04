/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *   SHIVMANI SINGH — API CONFIGURATION
 *   Centralized source of truth for API endpoints
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const API_CONFIG = (() => {
    const isLocal = window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === "" ||
        window.location.protocol === 'file:';

    const BASE_URL = isLocal
        ? 'http://localhost:5001/api'
        : 'https://www.shivmanisingh.in/api';

    console.log(`[CONFIG] Environment: ${isLocal ? 'Development' : 'Production'}`);
    console.log(`[CONFIG] API Base: ${BASE_URL}`);

    return {
        BASE_URL,
        isLocal
    };
})();

// Export for global use
window.API_BASE = API_CONFIG.BASE_URL;
