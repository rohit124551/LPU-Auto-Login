(function() {
    console.log("Kinetic Obsidian Logic v2.1 // Active");

    const hostname = window.location.hostname;

    async function handleInternetLogin() {
        chrome.storage.local.get(['internet_user', 'internet_pass'], (res) => {
            const user = res.internet_user;
            const pass = res.internet_pass;
            if (!user || !pass) return;

            const userField = document.getElementById('username') || document.querySelector('input[name="username"]');
            const passField = document.getElementById('password') || document.querySelector('input[name="password"]');
            const loginBtn = document.querySelector('input[type="submit"]') || document.querySelector('button[type="submit"]');

            if (userField && passField) {
                let finalUser = user;
                if (hostname === 'myaccountinternet.lpu.in' && !user.includes('@')) {
                    finalUser += '@lpu.com';
                }

                userField.value = finalUser;
                passField.value = pass;

                const terms = document.getElementById('chk_id_1') || document.querySelector('input[type="checkbox"]');
                if (terms) terms.checked = true;

                if (loginBtn) {
                    setTimeout(() => loginBtn.click(), 500);
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
            const loginBtn = document.querySelector('button.login-btn') || document.querySelector('input[type="submit"]');

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
    if (hostname === 'internet.lpu.in' || hostname === '10.10.0.1' || hostname === 'myaccountinternet.lpu.in') {
        handleInternetLogin();
    } else if (hostname === 'myclass.lpu.in') {
        handleMyClassLogin();
    }
})();
