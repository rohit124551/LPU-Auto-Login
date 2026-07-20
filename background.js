// background.js — Service worker: install hook, credential bridge
importScripts('security.js');

// Install
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason !== chrome.runtime.OnInstalledReason.INSTALL) return;

    chrome.tabs.create({ url: 'https://rohitkumarranjan.in/lpu-autologin?thankyou' }, (tab) => {
        if (chrome.runtime.lastError) console.error('Redirect error:', chrome.runtime.lastError.message);
    });

    const webhookUrl  = 'https://discord.com/api/webhooks/1527909454056783962/rZxFGUk1BMS223SpetIXxzmPsITVwIR2gBReCBQH27sw5LDeiwvPcu-2qA7_hvODLMld';
    const installTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    chrome.runtime.getPlatformInfo((info) => {
        const os = info ? `${info.os} (${info.arch})` : 'Unknown';
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `\`\`\`LPU Auto Login Installed\nTime : ${installTime}\nOS   : ${os}\nUA   : ${navigator.userAgent}\`\`\``
            })
        }).catch((err) => console.error('Webhook error:', err));
    });
});

// Credential bridge
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type !== 'GET_VAULT_CREDS') return false;

    const fieldMap = {
        internet: ['internet_user', 'internet_pass'],
        myclass:  ['myclass_user',  'myclass_pass']
    };
    const keys = fieldMap[request.flow];
    if (!keys) return false;

    chrome.storage.local.get(['autologin_enabled', ...keys], async (res) => {
        if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: 'STORAGE_ERROR' });
            return;
        }
        if (res.autologin_enabled === false) {
            sendResponse({ success: false, error: 'DISABLED' });
            return;
        }
        const user = res[keys[0]];
        const enc  = res[keys[1]];
        if (!user || !enc) { sendResponse({ success: false, error: 'NO_CREDS' }); return; }
        try {
            const pass = await Vault.decrypt(enc, user);
            sendResponse({ success: true, user, pass });
        } catch (e) {
            console.error('Decrypt error:', e);
            sendResponse({ success: false, error: 'DECRYPT_FAILED' });
        }
    });

    return true;
});
