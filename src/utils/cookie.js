'use client'
export const CookieUtils = {
    // Set a cookie
    setCookie: (name, value, days = 7) => {
        if (typeof document === 'undefined') return;

        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        const cookieValue = typeof value === 'object' ? JSON.stringify(value) : value;
        document.cookie = `${name}=${encodeURIComponent(cookieValue)}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict`;
    },

    // Get a cookie
    getCookie: (name) => {
        if (typeof document === 'undefined') return;

        const cookieArr = document.cookie.split('; ');
        const cookie = cookieArr.find(row => row.startsWith(`${name}=`));
        if (!cookie) return null;

        const value = cookie.split('=')[1];
        try {
            return JSON.parse(decodeURIComponent(value));
        } catch {
            return decodeURIComponent(value);
        }
    },

    // Delete a cookie
    deleteCookie: (name) => {
        if (typeof document === 'undefined') return;

        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
    },

    // Check if cookie exists
    hasCookie: (name) => {
        if (typeof document === 'undefined') return;
        return document.cookie.split('; ').some(row => row.startsWith(`${name}=`));
    },

    // Get all cookies as an object
    getAllCookies: () => {
        if (typeof document === 'undefined') return;

        const cookies = {};
        document.cookie.split('; ').forEach(cookie => {
            const [name, value] = cookie.split('=');
            try {
                cookies[name] = JSON.parse(decodeURIComponent(value));
            } catch {
                cookies[name] = decodeURIComponent(value);
            }
        });
        return cookies;
    },

    // Clear all cookies
    clearAllCookies: () => {
        if (typeof document === 'undefined') return;

        document.cookie.split('; ').forEach(cookie => {
            const name = cookie.split('=')[0];
            CookieUtils.deleteCookie(name);
        });
    }
};
