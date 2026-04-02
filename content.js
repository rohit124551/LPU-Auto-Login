(function() {
    console.log("Kinetic Obsidian Logic v2.0 // Active");

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
        chrome.storage.local.get(['ums_user', 'ums_pass'], (res) => {
            const user = res.ums_user;
            const pass = res.ums_pass;
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

    async function handleUMSPortalLogin() {
        chrome.storage.local.get(['ums_user', 'ums_pass'], (res) => {
            const user = res.ums_user;
            const pass = res.ums_pass;
            if (!user || !pass) return;

            // Selector for the Registration Number field
            const userField = document.getElementById('txtU') || document.querySelector('input[placeholder="User ID"]');
            
            if (userField) {
                // Step 1: Fill User ID
                userField.value = user;
                
                // Step 2: Trigger the site's verification system
                userField.dispatchEvent(new Event('input', { bubbles: true }));
                userField.dispatchEvent(new Event('change', { bubbles: true }));
                userField.dispatchEvent(new Event('blur', { bubbles: true }));

                console.log("VAULT: Registration ID filled. Waiting for verification...");

                // Step 3: Wait for Password field to appear/be enabled
                const checkInterval = setInterval(() => {
                    const passField = document.querySelector('input[type="password"]') || document.querySelector('input[placeholder="Password"]');
                    
                    // If password field exists and is visible/enabled
                    if (passField && !passField.disabled && passField.offsetParent !== null) {
                        passField.value = pass;
                        console.log("VAULT: Verification successful. Password field filled.");
                        clearInterval(checkInterval);
                        
                        // Pulse the fields to show automation
                        userField.style.transition = "box-shadow 0.5s";
                        passField.style.transition = "box-shadow 0.5s";
                        userField.style.boxShadow = "0 0 10px #f68220";
                        passField.style.boxShadow = "0 0 10px #f68220";
                    }
                }, 500);

                // Timeout after 12 seconds
                setTimeout(() => clearInterval(checkInterval), 12000);
            }
        });
    }

    // Execution Logic
    if (hostname === 'internet.lpu.in' || hostname === '10.10.0.1' || hostname === 'myaccountinternet.lpu.in') {
        handleInternetLogin();
    } else if (hostname === 'myclass.lpu.in') {
        handleMyClassLogin();
    } else if (hostname === 'ums.lpu.in') {
        handleUMSPortalLogin();
    }
})();
