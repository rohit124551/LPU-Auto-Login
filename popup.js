document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-editorial');
    const layers = document.querySelectorAll('.layer');
    const statusDiv = document.getElementById('status');
    const saveBtns = document.querySelectorAll('.save-btn');

    // UI Input Selectors
    const inputs = {
        internet: {
            user: document.getElementById('int-user'),
            pass: document.getElementById('int-pass')
        },
        myclass: {
            user: document.getElementById('mc-user'),
            pass: document.getElementById('mc-pass')
        }
    };

    // Kinetic Tab Switching Logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            
            // Switch Tabs
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Switch Layers
            layers.forEach(l => {
                l.classList.remove('active');
                if (l.id === target) l.classList.add('active');
            });
        });
    });

    // Load Saved Credentials
    chrome.storage.local.get(['internet_user', 'internet_pass', 'ums_user', 'ums_pass'], (res) => {
        if (res.internet_user) inputs.internet.user.value = res.internet_user;
        if (res.internet_pass) inputs.internet.pass.value = res.internet_pass;
        
        // MyClass uses UMS credentials
        if (res.ums_user) inputs.myclass.user.value = res.ums_user;
        if (res.ums_pass) inputs.myclass.pass.value = res.ums_pass;
    });

    // Save Logic (Unified for MyClass/UMS)
    saveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const user = inputs[type].user.value.trim();
            const pass = inputs[type].pass.value.trim();

            if (!user || !pass) {
                return showStatus("ERR: EMPTY_FIELDS", "#ff7351");
            }

            const data = {};
            if (type === 'internet') {
                data.internet_user = user;
                data.internet_pass = pass;
            } else {
                // Unified storage for MyClass & UMS
                data.ums_user = user;
                data.ums_pass = pass;
            }

            chrome.storage.local.set(data, () => {
                showStatus("VAULT_SYNC_COMPLETE");
                
                // Visual Spark
                btn.style.transform = "scale(0.95)";
                setTimeout(() => btn.style.transform = "scale(1)", 150);
            });
        });
    });

    function showStatus(text, color = '#f68220') {
        statusDiv.textContent = text;
        statusDiv.style.color = color;
        statusDiv.classList.add('show');
        setTimeout(() => {
            statusDiv.classList.remove('show');
        }, 2000);
    }
});
