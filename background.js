/**
 * LPU Auto Login | Kinetic Obsidian
 * Background Service Worker
 * Handles extension lifecycle, post-installation redirects, and secure decryption.
 */

// Import security utility for centralized decryption (Extension Side)
importScripts('security.js');

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // Redirect user to the Thank You / Getting Started page
        chrome.tabs.create({
            url: "https://rohitkumarranjan.in/LPU-Auto-Login/thankyou"
        });
        
        console.log("Welcome! Redirecting to Thank You page...");
    }
});

// --- Secure Credential Bridge ---
// Listens for requests from Content Scripts and returns plain-text credentials
// after decrypting them "Extension side" (in the background process).
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_VAULT_CREDS') {
        const fieldMap = {
            'internet': ['internet_user', 'internet_pass'],
            'myclass': ['myclass_user', 'myclass_pass']
        };

        const keys = fieldMap[request.flow];
        if (!keys) return false;

        // Strictly check if auto-login is enabled
        chrome.storage.local.get(['autologin_enabled', ...keys], async (res) => {
            try {
                // If toggle is OFF, abort immediately
                if (res.autologin_enabled === false) {
                    sendResponse({ success: false, error: 'AUTOLOGIN_DISABLED' });
                    return;
                }
                const user = res[keys[0]];
                const encryptedPass = res[keys[1]];

                if (user && encryptedPass) {
                    const decryptedPass = await Vault.decrypt(encryptedPass, user);
                    sendResponse({ 
                        success: true, 
                        user: user, 
                        pass: decryptedPass 
                    });
                } else {
                    sendResponse({ success: false, error: 'NO_CREDS' });
                }
            } catch (error) {
                console.error("Background Decryption Error:", error);
                sendResponse({ success: false, error: 'DECRYPTION_FAILED' });
            }
        });

        return true; // Keep message channel open for async response
    }
});
