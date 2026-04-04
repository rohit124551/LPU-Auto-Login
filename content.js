(function() {
    console.log("Kinetic Obsidian Logic v2.1 // Active");

    const hostname = window.location.hostname;

    async function handleInternetLogin() {
        chrome.runtime.sendMessage({ type: 'GET_VAULT_CREDS', flow: 'internet' }, async (response) => {
            if (response && response.success) {
                const { user, pass } = response;

                const userField = document.querySelector('input[name="username"]') || document.getElementById('username');
                const passField = document.querySelector('input[name="password"]') || document.getElementById('password');
                const terms = document.getElementById('agreepolicy') || document.getElementById('chk_id_1') || document.querySelector('input[type="checkbox"]');
                const loginBtn = document.getElementById('loginbtn') || document.querySelector('button[type="submit"]') || document.querySelector('input[type="submit"]');

                if (userField && passField) {
                    // Fill credentials
                    userField.value = user.split('@')[0]; // Just the ID, the page script appends @lpu.com
                    passField.value = pass;

                    // Handle checkbox (must be clicked to enable the button on some pages)
                    if (terms && !terms.checked) {
                        terms.click();
                    } else if (terms) {
                        terms.checked = true;
                    }

                    // Click login
                    if (loginBtn) {
                        // Slight delay to ensure checkbox event processed
                        setTimeout(() => {
                            if (loginBtn.disabled) loginBtn.disabled = false;
                            loginBtn.click();
                        }, 500);
                    }
                }
            }
        });
    }

    async function handleMyClassLogin() {
        chrome.runtime.sendMessage({ type: 'GET_VAULT_CREDS', flow: 'myclass' }, async (response) => {
            if (response && response.success) {
                const { user, pass } = response;

                const userField = document.querySelector('input[name="i"]');
                const passField = document.querySelector('input[name="p"]');
                const loginBtn = document.querySelector('button[type="submit"]') || document.querySelector('button.ghost-round') || document.querySelector('input[type="submit"]');

                if (userField && passField) {
                    userField.value = user;
                    passField.value = pass;
                    if (loginBtn) {
                        setTimeout(() => loginBtn.click(), 500);
                    }
                }
            }
        });
    }

    async function handleOasLogin() {
        chrome.runtime.sendMessage({ type: 'GET_VAULT_CREDS', flow: 'myclass' }, async (response) => {
            if (response && response.success) {
                const { user, pass } = response;

                const userField = document.getElementById('login-LoginId');
                const passField = document.getElementById('login-Password');
                const loginBtn = document.querySelector('button[type="submit"].btn-success') || document.querySelector('button[type="submit"]');

                if (userField && passField) {
                    userField.value = user;
                    passField.value = pass;
                    if (loginBtn) {
                        setTimeout(() => loginBtn.click(), 500);
                    }
                }
            }
        });
    }

    // ============================================================
    // GATE: Read autologin_enabled FRESH from storage on every
    //       page load. If it is explicitly false → EXIT immediately.
    //       Nothing fires. No messages. No form filling.
    // ============================================================
    chrome.storage.local.get(['autologin_enabled'], (res) => {
        // autologin_enabled === false means user turned it OFF.
        // undefined / true both mean ON (default is ON).
        if (res.autologin_enabled === false) {
            console.log("Kinetic Obsidian // Auto-Login is OFF. Skipping.");
            return; // Hard stop — nothing below runs
        }

        // Toggle is ON — proceed with login
        if (hostname === 'internet.lpu.in' || hostname === '10.10.0.1' || hostname === 'myaccountinternet.lpu.in') {
            handleInternetLogin();
        } else if (hostname === 'myclass.lpu.in' || hostname === 'lovelyprofessionaluniversity.codetantra.com') {
            handleMyClassLogin();
        } else if (hostname === 'oas.lpu.in') {
            handleOasLogin();
        }
    });
})();

