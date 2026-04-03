document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab-editorial');
    const layers = document.querySelectorAll('.layer');
    const statusDiv = document.getElementById('status');
    const saveBtns = document.querySelectorAll('.save-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const backBtn = document.querySelector('.back-btn');
    const gatewayStatus = document.getElementById('gateway-status');
    const statusOrb = document.getElementById('status-orb');

    // Settings Selectors
    const toggles = {
        network: document.getElementById('set-network'),
        aura: document.getElementById('set-aura')
    };

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

    // --- Aura Theme Engine ---
    const AURAS = {
        orange: { primary: '#f68220', container: '#ff923f', hue: '0deg' },
        blue: { primary: '#2196f3', container: '#64b5f6', hue: '200deg' },
        green: { primary: '#4caf50', container: '#81c784', hue: '90deg' },
        purple: { primary: '#9c27b0', container: '#ba68c8', hue: '280deg' }
    };

    const auraDots = document.querySelectorAll('.aura-dot');
    const auraPicker = document.querySelector('.aura-picker');

    function applyAura(name, save = true) {
        const aura = AURAS[name] || AURAS.orange;
        const root = document.documentElement;
        
        root.style.setProperty('--primary', aura.primary);
        root.style.setProperty('--primary-container', aura.container);
        root.style.setProperty('--aura-hue', aura.hue);

        auraDots.forEach(dot => {
            dot.classList.remove('active');
            if (dot.dataset.aura === name) dot.classList.add('active');
        });

        if (save) chrome.storage.local.set({ selected_aura: name });
    }

    // --- Network Monitor ---
    async function checkGatewayStatus() {
        if (!toggles.network.checked) {
            gatewayStatus.textContent = "MONITOR OFF";
            gatewayStatus.style.color = "var(--on-surface-variant)";
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            await fetch('https://internet.lpu.in', { 
                method: 'HEAD', 
                mode: 'no-cors',
                signal: controller.signal 
            });
            
            clearTimeout(timeoutId);
            gatewayStatus.textContent = "GATEWAY ONLINE";
            gatewayStatus.style.color = "var(--primary)";
            statusOrb.style.background = "var(--primary)";
            statusOrb.style.boxShadow = "0 0 10px var(--primary)";
        } catch (e) {
            gatewayStatus.textContent = "GATEWAY OFFLINE";
            gatewayStatus.style.color = "#ff7351";
            statusOrb.style.background = "#ff7351";
            statusOrb.style.boxShadow = "0 0 10px #ff7351";
        }
    }

    // --- Navigation ---
    function switchLayer(targetId) {
        layers.forEach(l => {
            l.classList.remove('active');
            if (l.id === targetId) l.classList.add('active');
        });
        
        const tabsContainer = document.querySelector('.tabs-container');
        if (targetId === 'settings') {
            tabsContainer.style.opacity = '0';
            tabsContainer.style.pointerEvents = 'none';
        } else {
            tabsContainer.style.opacity = '1';
            tabsContainer.style.pointerEvents = 'all';
        }
    }

    settingsBtn.addEventListener('click', () => switchLayer('settings'));
    backBtn.addEventListener('click', () => switchLayer('internet'));

    // --- Settings Persistence ---
    function saveSettings() {
        const settings = {
            network_enabled: toggles.network.checked,
            aura_enabled: toggles.aura.checked
        };
        chrome.storage.local.set({ feature_settings: settings });

        auraPicker.style.display = settings.aura_enabled ? 'flex' : 'none';
        if (!settings.network_enabled) {
            gatewayStatus.textContent = "SYSTEM READY";
            gatewayStatus.style.color = "var(--on-surface-variant)";
        } else {
            checkGatewayStatus();
        }
    }

    Object.values(toggles).forEach(t => t.addEventListener('change', saveSettings));

    // --- Initialization ---
    chrome.storage.local.get([
        'internet_user', 'internet_pass', 
        'myclass_user', 'myclass_pass', 
        'ums_user', 'ums_pass',
        'selected_aura', 'feature_settings'
    ], (res) => {
        // Load Feature Settings
        if (res.feature_settings) {
            toggles.network.checked = res.feature_settings.network_enabled;
            toggles.aura.checked = res.feature_settings.aura_enabled;
            auraPicker.style.display = toggles.aura.checked ? 'flex' : 'none';
        }

        // Apply Theme
        if (res.selected_aura) applyAura(res.selected_aura, false);

        // Load Credentials
        if (res.internet_user) inputs.internet.user.value = res.internet_user;
        if (res.internet_pass) inputs.internet.pass.value = res.internet_pass;
        
        if (res.myclass_user) {
            inputs.myclass.user.value = res.myclass_user;
        } else if (res.ums_user) {
            inputs.myclass.user.value = res.ums_user;
        }

        if (res.myclass_pass) {
            inputs.myclass.pass.value = res.myclass_pass;
        } else if (res.ums_pass) {
            inputs.myclass.pass.value = res.ums_pass;
        }

        // Run Monitor
        if (toggles.network.checked) {
            checkGatewayStatus();
            setInterval(checkGatewayStatus, 15000);
        }
    });

    auraDots.forEach(dot => {
        dot.addEventListener('click', () => applyAura(dot.dataset.aura));
    });

    // --- Interaction Logic ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            switchLayer(target);
        });
    });

    saveBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const user = inputs[type].user.value.trim();
            const pass = inputs[type].pass.value.trim();

            if (!user || !pass) return showStatus("ERR: EMPTY_FIELDS", "#ff7351");

            const data = {};
            if (type === 'internet') {
                data.internet_user = user;
                data.internet_pass = pass;
            } else {
                data.myclass_user = user;
                data.myclass_pass = pass;
            }

            chrome.storage.local.set(data, () => {
                showStatus("VAULT_SYNC_COMPLETE");
                btn.style.transform = "scale(0.95)";
                setTimeout(() => btn.style.transform = "scale(1)", 150);
            });
        });
    });

    function showStatus(text, color = 'var(--primary)') {
        statusDiv.textContent = text;
        statusDiv.style.color = color;
        statusDiv.classList.add('show');
        setTimeout(() => statusDiv.classList.remove('show'), 2000);
    }

    // --- External Links ---
    document.querySelectorAll('.dev-link').forEach(link => {
        link.addEventListener('click', () => {
            const url = link.dataset.url;
            if (url.startsWith('mailto:')) {
                window.open(url, '_blank');
            } else {
                chrome.tabs.create({ url: url });
            }
        });
    });
});
