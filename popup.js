// popup.js — Popup UI logic
document.addEventListener('DOMContentLoaded', () => {

    // --- DOM refs ---
    const tabs         = document.querySelectorAll('.tab-editorial');
    const layers       = document.querySelectorAll('.layer');
    const statusDiv    = document.getElementById('status');
    const saveBtns     = document.querySelectorAll('.save-btn');
    const settingsBtn  = document.getElementById('settings-btn');
    const backBtns     = document.querySelectorAll('.back-btn');
    const gatewayStatus = document.getElementById('gateway-status');
    const statusOrb    = document.getElementById('status-orb');
    const powerChip    = document.getElementById('power-chip');
    const powerLabel   = document.getElementById('power-label');
    const disabledBanner = document.getElementById('disabled-banner');

    let isAutoLoginEnabled = true;
    let lastActiveTab = 'internet';

    const toggles = {
        network: document.getElementById('set-network'),
        weather: document.getElementById('set-weather')
    };

    const inputs = {
        internet: {
            user: document.getElementById('int-user'), pass: document.getElementById('int-pass'),
            badge: document.getElementById('int-pass-badge'), hint: document.getElementById('int-change-hint'),
            eye: document.getElementById('int-eye'), eyeOpen: document.getElementById('int-eye-open'), eyeClosed: document.getElementById('int-eye-closed')
        },
        myclass: {
            user: document.getElementById('mc-user'), pass: document.getElementById('mc-pass'),
            badge: document.getElementById('mc-pass-badge'), hint: document.getElementById('mc-change-hint'),
            eye: document.getElementById('mc-eye'), eyeOpen: document.getElementById('mc-eye-open'), eyeClosed: document.getElementById('mc-eye-closed')
        }
    };

    // --- Saved state ---
    function showSavedState(type) {
        const { pass, badge, hint, eye, eyeOpen, eyeClosed } = inputs[type];
        pass.value = '';
        pass.placeholder = '••••••••';
        pass.type = 'password';
        badge.classList.add('visible');
        hint.classList.add('visible');
        eye.classList.remove('visible');
        eyeOpen.style.display  = '';
        eyeClosed.style.display = 'none';
    }

    function clearSavedState(type) {
        const { badge, hint, eye, pass } = inputs[type];
        badge.classList.remove('visible');
        hint.classList.remove('visible');
        pass.placeholder = 'Enter password';
        eye.classList.add('visible');
    }

    // --- Eye toggle ---
    function setupEyeToggle(type) {
        const { pass, eye, eyeOpen, eyeClosed } = inputs[type];
        eye.addEventListener('click', () => {
            const hidden = pass.type === 'password';
            pass.type = hidden ? 'text' : 'password';
            eyeOpen.style.display  = hidden ? 'none' : '';
            eyeClosed.style.display = hidden ? '' : 'none';
        });
    }

    inputs.internet.pass.addEventListener('input', () => clearSavedState('internet'));
    inputs.myclass.pass.addEventListener('input', () => clearSavedState('myclass'));
    setupEyeToggle('internet');
    setupEyeToggle('myclass');

    // --- Theme ---
    // Aura theme removed per user request, defaulting to orange
    const root = document.documentElement;
    root.style.setProperty('--primary', '#f68220');
    root.style.setProperty('--primary-container', '#ff923f');
    root.style.setProperty('--aura-hue', '0deg');

    // --- IP alternator ---
    let publicIp = '';
    let statusIntervalId = null;
    let currentMode   = 'status';
    let currentStatus = 'SYSTEM READY';

    function fadeStatus(text) {
        gatewayStatus.style.opacity   = 0;
        gatewayStatus.style.transform = 'translateY(-4px)';
        setTimeout(() => {
            gatewayStatus.textContent      = text;
            gatewayStatus.style.transform  = 'translateY(4px)';
            gatewayStatus.offsetHeight;
            gatewayStatus.style.opacity    = 1;
            gatewayStatus.style.transform  = 'translateY(0)';
        }, 250);
    }

    function startAlternator() {
        if (statusIntervalId) return;
        statusIntervalId = setInterval(() => {
            if (!publicIp || currentStatus !== 'ONLINE' || !toggles.network.checked || !isAutoLoginEnabled) {
                stopAlternator(); return;
            }
            currentMode = currentMode === 'status' ? 'ip' : 'status';
            fadeStatus(currentMode === 'ip' ? `IP: ${publicIp}` : currentStatus);
        }, 2000);
    }

    function stopAlternator() {
        clearInterval(statusIntervalId);
        statusIntervalId = null;
        currentMode = 'status';
    }

    function setStatus(text, color, online = false) {
        currentStatus = text;
        gatewayStatus.style.color = color;
        if (!online) {
            stopAlternator();
            gatewayStatus.textContent     = text;
            gatewayStatus.style.opacity   = 1;
            gatewayStatus.style.transform = 'translateY(0)';
            return;
        }
        if (publicIp) {
            gatewayStatus.textContent     = currentMode === 'ip' ? `IP: ${publicIp}` : text;
            gatewayStatus.style.opacity   = 1;
            gatewayStatus.style.transform = 'translateY(0)';
            startAlternator();
        } else {
            stopAlternator();
            gatewayStatus.textContent     = text;
            gatewayStatus.style.opacity   = 1;
            gatewayStatus.style.transform = 'translateY(0)';
        }
    }

    // --- Power ---
    function applyPowerState(enabled, save = true) {
        isAutoLoginEnabled = enabled;
        if (enabled) {
            powerChip.classList.remove('off');
            powerLabel.textContent = 'ON';
            disabledBanner.classList.remove('show');
            setStatus('READY', 'var(--primary)', false);
            statusOrb.style.background = 'var(--primary)';
            statusOrb.style.boxShadow  = '0 0 10px var(--primary)';
            if (toggles.network?.checked) checkGateway();
        } else {
            powerChip.classList.add('off');
            powerLabel.textContent = 'OFF';
            disabledBanner.classList.add('show');
            setStatus('DISABLED', '#555', false);
            statusOrb.style.background = '#333';
            statusOrb.style.boxShadow  = 'none';
        }
        if (save) chrome.storage.local.set({ autologin_enabled: enabled }, () => {
            if (chrome.runtime.lastError) console.error('power save:', chrome.runtime.lastError.message);
        });
    }

    powerChip.addEventListener('click', () => {
        applyPowerState(!isAutoLoginEnabled);
        showToast(isAutoLoginEnabled ? 'AUTO-LOGIN ACTIVATED' : 'AUTO-LOGIN DISABLED', isAutoLoginEnabled ? 'var(--primary)' : '#555');
    });

    // --- Network monitor ---
    let isChecking = false;
    let monitorIntervalId = null;

    async function checkGateway() {
        if (!toggles.network.checked) { setStatus('MONITOR OFF', 'var(--on-surface-variant)', false); return; }
        if (isChecking) return;
        isChecking = true;
        setStatus('CHECKING...', 'var(--on-surface-variant)', false);

        try {
            const ctrl = new AbortController();
            const tid  = setTimeout(() => ctrl.abort(), 3000);
            const res  = await fetch('https://internet.lpu.in', { method: 'HEAD', signal: ctrl.signal, cache: 'no-store' });
            clearTimeout(tid);

            if (res.ok || res.status === 301 || res.status === 302) {
                statusOrb.style.background = 'var(--primary)';
                statusOrb.style.boxShadow  = '0 0 10px var(--primary)';
                if (!publicIp) {
                    try {
                        const ip = await fetch('https://api.ipify.org?format=json');
                        if (ip.ok) publicIp = (await ip.json()).ip;
                    } catch (_) {}
                }
                setStatus('ONLINE', 'var(--primary)', true);
            } else {
                statusOrb.style.background = '#ffb347';
                statusOrb.style.boxShadow  = '0 0 10px #ffb347';
                setStatus(`ERR ${res.status}`, '#ffb347', false);
            }
        } catch (e) {
            publicIp = '';
            statusOrb.style.background = '#ff7351';
            statusOrb.style.boxShadow  = '0 0 10px #ff7351';
            setStatus(e.name === 'AbortError' ? 'TIMEOUT' : 'OFFLINE', '#ff7351', false);
        } finally {
            isChecking = false;
        }
    }

    // --- Weather Widget ---
    async function fetchWeather() {
        const tempEl = document.getElementById('weather-temp');
        const descEl = document.getElementById('weather-desc');
        
        try {
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=31.224&longitude=75.7708&current_weather=true');
            if (!res.ok) throw new Error('Weather API failed');
            const data = await res.json();
            
            // Map basic weather codes to descriptions
            const code = data.current_weather.weathercode;
            let desc = 'Clear'; let icon = '☀️';
            if (code > 0 && code <= 3) { desc = 'Partly cloudy'; icon = '⛅'; }
            if (code >= 45 && code <= 48) { desc = 'Foggy'; icon = '🌫️'; }
            if (code >= 51 && code <= 67) { desc = 'Rain'; icon = '🌧️'; }
            if (code >= 71 && code <= 77) { desc = 'Snow'; icon = '❄️'; }
            if (code >= 95) { desc = 'Thunderstorm'; icon = '⛈️'; }
            
            const svg = document.querySelector('.weather-widget svg');
            if (svg) svg.style.display = 'none';

            tempEl.textContent = `${icon} ${Math.round(data.current_weather.temperature)}°C`;
            descEl.textContent = desc;
        } catch (e) {
            tempEl.textContent = '--°C';
            descEl.textContent = 'Weather unavailable';
        }
    }

    // --- Quick Links ---
    const DEFAULT_QUICK_LINKS = [
        { id: 'l4', name: 'Internet', url: 'https://myaccountinternet.lpu.in/', iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z"/></svg>' },
        { id: 'l5', name: 'UMS', url: 'https://ums.lpu.in/lpuums', iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' },
        { id: 'l1', name: 'MyClass', url: 'https://myclass.lpu.in', iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9z"/></svg>' },
        { id: 'l2', name: 'OAS', url: 'https://oas.lpu.in', iconSvg: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93z"/></svg>' },
        { id: 'l3', name: 'Library', url: 'https://library.lpu.in', iconSvg: '<svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>' }
    ];
    let customQuickLinks = [];

    function saveQuickLinks() {
        chrome.storage.local.set({ quick_links: customQuickLinks }, () => {
            renderQuickLinks();
            renderManageLinks();
        });
    }

    function getHashedGradient(name) {
        const gradients = [
            'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)', // Orange Peach
            'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', // Purple Blue
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Mint Green
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Pink Yellow
            'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', // Red
            'linear-gradient(135deg, #b06ab3 0%, #4568dc 100%)'  // Deep Purple
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return gradients[Math.abs(hash) % gradients.length];
    }

    function getFallbackIcon(name) {
        const bg = getHashedGradient(name);
        return `<div style="font-weight:700;font-size:11px;display:flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:4px;background:${bg};color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.3);box-shadow:inset 0 0 0 0.5px rgba(255,255,255,0.2);">${name.charAt(0).toUpperCase()}</div>`;
    }

    function getFaviconHtml(link) {
        if (link.iconSvg) return link.iconSvg;
        try {
            let domain = new URL(link.url).hostname;
            // PRO UX: Map internal LPU portals (like ums.lpu.in) to the root domain so they get the official LPU seal!
            if (domain.endsWith('.lpu.in')) domain = 'lpu.in';
            
            const fallback = getFallbackIcon(link.name).replace(/"/g, '&quot;');
            // DuckDuckGo API is vastly superior to Google's and triggers onerror properly if not found
            return `<img src="https://icons.duckduckgo.com/ip3/${domain}.ico" alt="${link.name}" style="width:16px;height:16px;border-radius:4px;" onerror="this.outerHTML='${fallback}'">`;
        } catch(e) {
            return getFallbackIcon(link.name);
        }
    }

    function renderQuickLinks() {
        const container = document.getElementById('quick-links-container');
        container.innerHTML = '';
        
        // Show up to 4 custom links on the main row
        const toShow = customQuickLinks.slice(0, 4);

        toShow.forEach(link => {
            const a = document.createElement('a');
            a.href = link.url;
            a.target = '_blank';
            a.className = 'ql-btn';
            a.title = link.name;
            
            a.innerHTML = getFaviconHtml(link) + `<span>${link.name}</span>`;
            
            a.addEventListener('click', (e) => {
                e.preventDefault();
                chrome.tabs.create({ url: link.url });
            });
            container.appendChild(a);
        });

        // Always show an action button at the end
        const actionBtn = document.createElement('button');
        actionBtn.className = 'ql-btn';
        if (customQuickLinks.length < 4) {
            actionBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg><span>Add</span>`;
        } else if (customQuickLinks.length === 4) {
            actionBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></svg><span>Edit</span>`;
        } else {
            actionBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg><span>All (${customQuickLinks.length})</span>`;
        }
        actionBtn.addEventListener('click', () => switchLayer('manage-links'));
        container.appendChild(actionBtn);
    }

    let draggedIdx = null;

    function renderManageLinks() {
        const list = document.getElementById('links-list-container');
        list.innerHTML = '';
        customQuickLinks.forEach((link, idx) => {
            const item = document.createElement('div');
            item.className = 'ml-item';
            item.draggable = true;
            
            // Drag and drop events
            item.addEventListener('dragstart', (e) => {
                draggedIdx = idx;
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => item.classList.add('dragging'), 0);
            });
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const bounding = item.getBoundingClientRect();
                const offset = e.clientY - bounding.top;
                if (offset > bounding.height / 2) {
                    item.classList.remove('drag-over-top');
                    item.classList.add('drag-over-bottom');
                } else {
                    item.classList.remove('drag-over-bottom');
                    item.classList.add('drag-over-top');
                }
            });
            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over-top', 'drag-over-bottom');
            });
            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
                list.querySelectorAll('.ml-item').forEach(el => el.classList.remove('drag-over-top', 'drag-over-bottom'));
            });
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('drag-over-top', 'drag-over-bottom');
                if (draggedIdx === null || draggedIdx === idx) return;

                const bounding = item.getBoundingClientRect();
                const offset = e.clientY - bounding.top;
                let insertIdx = idx;
                if (offset > bounding.height / 2) insertIdx++;

                const draggedItem = customQuickLinks.splice(draggedIdx, 1)[0];
                if (insertIdx > draggedIdx) insertIdx--; 
                customQuickLinks.splice(insertIdx, 0, draggedItem);
                
                saveQuickLinks();
            });
            
            const icon = document.createElement('div');
            icon.className = 'ml-item-icon';
            icon.innerHTML = getFaviconHtml(link);

            const info = document.createElement('div');
            info.className = 'ml-item-info';
            info.innerHTML = `<span class="ml-item-name">${link.name}</span><span class="ml-item-url">${link.url}</span>`;

            const actions = document.createElement('div');
            actions.className = 'ml-actions';

            const dragHandle = document.createElement('div');
            dragHandle.className = 'ml-drag-handle';
            dragHandle.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14"><path d="M20 9H4v2h16V9zM4 15h16v-2H4v2z"/></svg>`;
            actions.appendChild(dragHandle);

            const del = document.createElement('button');
            del.className = 'ml-btn delete';
            del.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`;
            del.onclick = () => {
                item.style.opacity = '0';
                item.style.transform = 'scale(0.9) translateX(-10px)';
                item.style.marginBottom = `-${item.offsetHeight}px`;
                setTimeout(() => {
                    customQuickLinks.splice(idx, 1);
                    saveQuickLinks();
                }, 300);
            };
            actions.appendChild(del);

            item.appendChild(icon);
            item.appendChild(info);
            item.appendChild(actions);
            list.appendChild(item);
        });
    }

    document.getElementById('add-link-btn').addEventListener('click', () => {
        const nameInput = document.getElementById('new-link-name');
        const urlInput = document.getElementById('new-link-url');
        const name = nameInput.value.trim();
        let url = urlInput.value.trim();
        
        if (!name || !url) return showToast('ERR: NAME & URL REQUIRED', '#ff7351');
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

        customQuickLinks.push({
            id: 'l_' + Date.now(),
            name,
            url,
            iconSvg: ''
        });
        nameInput.value = '';
        urlInput.value = '';
        saveQuickLinks();
        showToast('LINK ADDED');
    });

    // --- Navigation ---
    function switchLayer(id) {
        layers.forEach(l => { l.classList.remove('active'); if (l.id === id) l.classList.add('active'); });
        const tabsContainer = document.querySelector('.tabs-container');
        const inModal = id === 'settings' || id === 'manage-links';
        tabsContainer.style.opacity       = inModal ? '0' : '1';
        tabsContainer.style.pointerEvents = inModal ? 'none' : 'all';
    }

    settingsBtn.addEventListener('click', () => switchLayer('settings'));
    backBtns.forEach(btn => btn.addEventListener('click', () => switchLayer(lastActiveTab)));

    tabs.forEach(tab => tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        lastActiveTab = target;
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        switchLayer(target);
    }));

    // --- Settings ---
    function saveSettings() {
        const settings = { 
            network_enabled: toggles.network.checked,
            weather_enabled: toggles.weather.checked
        };
        chrome.storage.local.set({ feature_settings: settings }, () => {
            if (chrome.runtime.lastError) console.error('settings save:', chrome.runtime.lastError.message);
        });

        const weatherWidget = document.getElementById('weather-widget');
        if (weatherWidget) weatherWidget.style.display = settings.weather_enabled ? 'flex' : 'none';

        if (!settings.network_enabled) setStatus('READY', 'var(--on-surface-variant)', false);
        else checkGateway();
    }

    Object.values(toggles).forEach(t => t.addEventListener('change', saveSettings));

    document.getElementById('factory-reset-btn').addEventListener('click', () => {
        if (confirm("Are you sure you want to wipe all saved passwords and custom links? This cannot be undone.")) {
            chrome.storage.local.clear(() => {
                showToast("VAULT WIPED", "var(--error)");
                setTimeout(() => window.close(), 1000);
            });
        }
    });

    // --- Save credentials ---
    saveBtns.forEach(btn => btn.addEventListener('click', async () => {
        const type = btn.dataset.type;
        const user = inputs[type].user.value.trim();
        const pass = inputs[type].pass.value.trim();

        if (!user) return showToast('ERR: ID REQUIRED', '#ff7351');
        if (!/^\d+$/.test(user)) return showToast('ERR: NUMBERS ONLY', '#ff7351');
        if (!pass) return showToast('ERR: PASSWORD REQUIRED', '#ff7351');

        const enc  = await Vault.encrypt(pass, user);
        const data = type === 'internet'
            ? { internet_user: user, internet_pass: enc }
            : { myclass_user:  user, myclass_pass:  enc };

        chrome.storage.local.set(data, () => {
            if (chrome.runtime.lastError) { showToast('ERR: STORAGE FAIL', '#ff7351'); return; }
            showToast('VAULT SYNCED');
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => btn.style.transform = 'scale(1)', 150);
            showSavedState(type);
        });
    }));

    // --- Toast ---
    function showToast(text, color = 'var(--primary)') {
        statusDiv.textContent = text;
        statusDiv.style.color = color;
        statusDiv.classList.add('show');
        setTimeout(() => statusDiv.classList.remove('show'), 2000);
    }

    // --- External links ---
    document.querySelectorAll('.dev-link').forEach(link => link.addEventListener('click', () => {
        const url = link.dataset.url;
        if (!url) return;
        if (url.startsWith('mailto:')) { window.open(url, '_blank'); return; }
        chrome.tabs.create({ url }, (tab) => {
            if (chrome.runtime.lastError) console.error('tab open:', chrome.runtime.lastError.message);
        });
    }));

    // --- Init ---
    chrome.storage.local.get(
        ['internet_user', 'internet_pass', 'myclass_user', 'myclass_pass', 'ums_user', 'ums_pass', 'selected_aura', 'feature_settings', 'autologin_enabled', 'quick_links'],
        async (res) => {
            if (chrome.runtime.lastError) { console.error('init load:', chrome.runtime.lastError.message); return; }

            // Version
            const { version } = chrome.runtime.getManifest();
            const vd = document.getElementById('version-display');
            if (vd) vd.textContent = `LPU Auto Login v${version} • Rohit Kumar Ranjan`;

            // Power
            applyPowerState(res.autologin_enabled !== false, false);

            // Settings
            if (res.feature_settings) {
                toggles.network.checked = res.feature_settings.network_enabled !== false;
                toggles.weather.checked = res.feature_settings.weather_enabled !== false;
            } else {
                toggles.network.checked = true;
                toggles.weather.checked = true;
            }

            const weatherWidget = document.getElementById('weather-widget');
            if (weatherWidget) weatherWidget.style.display = toggles.weather.checked ? 'flex' : 'none';

            // Credentials
            if (res.internet_user) {
                inputs.internet.user.value = res.internet_user;
                if (res.internet_pass) showSavedState('internet');
            }
            const mcUser = res.myclass_user || res.ums_user;
            const mcPass = res.myclass_pass || res.ums_pass;
            if (mcUser) {
                inputs.myclass.user.value = mcUser;
                if (mcPass) showSavedState('myclass');
            }

            // Monitor
            if (toggles.network.checked) {
                checkGateway();
                if (monitorIntervalId) clearInterval(monitorIntervalId);
                monitorIntervalId = setInterval(checkGateway, 15000);
            }

            // Weather Widget
            fetchWeather();

            // Quick Links
            if (res.quick_links && Array.isArray(res.quick_links)) {
                customQuickLinks = res.quick_links;
            } else {
                customQuickLinks = [...DEFAULT_QUICK_LINKS];
                saveQuickLinks();
            }
            renderQuickLinks();
            renderManageLinks();
        }
    );
});
