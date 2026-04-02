(function() {
    console.log("Kinetic Obsidian Logic v2.1 // Active");

    const hostname = window.location.hostname;

    async function handleInternetLogin() {
        chrome.storage.local.get(['internet_user', 'internet_pass'], (res) => {
            const user = res.internet_user;
            const pass = res.internet_pass;
            if (!user || !pass) return;

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
        });
    }

    async function handleMyClassLogin() {
        chrome.storage.local.get(['myclass_user', 'myclass_pass'], (res) => {
            const user = res.myclass_user;
            const pass = res.myclass_pass;
            if (!user || !pass) return;

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
        });
    }

    // Execution Logic
    if (hostname === 'internet.lpu.in' || hostname === '10.10.0.1' || hostname === '172.20.0.66' || hostname === '172.20.0.67' || hostname === 'myaccountinternet.lpu.in') {
        handleInternetLogin();
    } else if (hostname === 'myclass.lpu.in' || hostname === 'lovelyprofessionaluniversity.codetantra.com') {
        handleMyClassLogin();
    }
})();
