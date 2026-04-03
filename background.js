/**
 * LPU Auto Login | Kinetic Obsidian
 * Background Service Worker
 * Handles extension lifecycle and post-installation redirects.
 */

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        // Redirect user to the Thank You / Getting Started page
        chrome.tabs.create({
            url: "https://rohitkumarranjan.in/LPU-Auto-Login/thankyou"
        });
        
        console.log("Welcome! Redirecting to Thank You page...");
    }
});
