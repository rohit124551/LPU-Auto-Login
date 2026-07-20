// content.js — Auto-fill logic for LPU portals
(function() {
    const { version } = chrome.runtime.getManifest();
    console.log(
        `Kinetic Obsidian v${version} // Active\nMade by Rohit Kumar Ranjan\nPortfolio: https://rohitkumarranjan.in\nGitHub: https://github.com/rohit124551`
    );

    const hostname = window.location.hostname;

    // Internet Gateway
    function handleInternetLogin() {
        chrome.runtime.sendMessage({ type: 'GET_VAULT_CREDS', flow: 'internet' }, (res) => {
            if (chrome.runtime.lastError) return;
            if (!res?.success) return;

            const userField = document.querySelector('input[name="username"]') || document.getElementById('username');
            const passField = document.querySelector('input[name="password"]') || document.getElementById('password');
            const terms     = document.getElementById('agreepolicy') || document.getElementById('chk_id_1') || document.querySelector('input[type="checkbox"]');
            const btn       = document.getElementById('loginbtn') || document.querySelector('button[type="submit"]') || document.querySelector('input[type="submit"]');

            if (!userField || !passField) return;
            userField.value = res.user.split('@')[0];
            passField.value = res.pass;
            if (terms && !terms.checked) terms.click();
            if (btn) setTimeout(() => { if (btn.disabled) btn.disabled = false; btn.click(); }, 500);
        });
    }

    // MyClass / CodeTantra
    function handleMyClassLogin() {
        chrome.runtime.sendMessage({ type: 'GET_VAULT_CREDS', flow: 'myclass' }, (res) => {
            if (chrome.runtime.lastError) return;
            if (!res?.success) return;

            const userField = document.querySelector('input[name="i"]');
            const passField = document.querySelector('input[name="p"]');
            const btn       = document.querySelector('button[type="submit"]') || document.querySelector('button.ghost-round') || document.querySelector('input[type="submit"]');

            if (!userField || !passField) return;
            userField.value = res.user;
            passField.value = res.pass;
            if (btn) setTimeout(() => btn.click(), 500);
        });
    }

    // OAS — same SSO credentials as MyClass (LPU unified auth)
    function handleOasLogin() {
        chrome.runtime.sendMessage({ type: 'GET_VAULT_CREDS', flow: 'myclass' }, (res) => {
            if (chrome.runtime.lastError) return;
            if (!res?.success) return;

            const userField = document.getElementById('login-LoginId');
            const passField = document.getElementById('login-Password');
            const btn       = document.querySelector('button[type="submit"].btn-success') || document.querySelector('button[type="submit"]');

            if (!userField || !passField) return;
            userField.value = res.user;
            passField.value = res.pass;
            if (btn) setTimeout(() => btn.click(), 500);
        });
    }

    // Gate: read toggle state before doing anything
    chrome.storage.local.get(['autologin_enabled', 'feature_settings'], (res) => {
        if (chrome.runtime.lastError) return;
        if (res.autologin_enabled === false) return;

        if (['internet.lpu.in', '10.10.0.1', 'myaccountinternet.lpu.in'].includes(hostname)) {
            handleInternetLogin();
        } else if (['myclass.lpu.in', 'lovelyprofessionaluniversity.codetantra.com'].includes(hostname)) {
            handleMyClassLogin();
        } else if (hostname === 'oas.lpu.in') {
            handleOasLogin();
        }
    });
})();
