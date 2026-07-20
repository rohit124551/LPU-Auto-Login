# 🚀 LPU Auto Login | v2.6

[![License: MIT](https://img.shields.io/badge/License-MIT-f68220.svg)](https://opensource.org/licenses/MIT)
[![LPU](https://img.shields.io/badge/LPU-Student_Project-blue.svg)](https://www.lpu.in)

**LPU Auto Login** is a lightning-fast, highly secure, offline-ready Chrome Extension that automates the login process for Lovely Professional University's major portals. Stop typing your Registration ID and Password every time you connect to the campus Wi-Fi or check your grades.

Set it up once, and the extension will automatically log you in the moment you visit an LPU portal.

---

## ✨ Features

- 🔐 **AES-GCM 256-bit Vault:** Your passwords never leave your device. They are mathematically encrypted locally using a unique key generated for your browser.
- ⚡ **Zero-Click Logins:** Instantly logs you into the **Internet Gateway**, **MyClass / UMS**, and **OAS** portals without any manual clicks.
- 🌐 **Real-time Network Monitor:** A live orb constantly checks the campus gateway status. If the gateway goes offline, you'll know instantly.
- 🔗 **Smart Quick Links (Drag & Drop):** A built-in grid of your most-used websites. Easily drag and drop to reorder them.
- 🎨 **Smart Favicons:** The extension automatically fetches the real logo for any custom link you add. If a website has no logo, it generates a beautiful, Apple-style colored initial specifically for that link.
- ⛅ **Campus Weather:** A built-in, completely free, no-setup weather widget that shows the live temperature in Phagwara right inside the extension header.
- 🔒 **Master Power Switch:** Turn off auto-logins with a single click without having to delete your saved passwords.
- 🧹 **Factory Reset:** A dedicated danger button to instantly wipe all passwords, settings, and custom links from the extension's memory.

---

## 📥 Installation (Chrome Web Store)

The easiest way to install LPU Auto Login is directly from the Google Chrome Web Store.

1. Visit the **Chrome Web Store** page for LPU Auto Login.
2. Click **"Add to Chrome"**.
3. Pin the extension to your toolbar.
4. Click the extension icon, enter your credentials, and click **Save**. You're done!

---

## 🛠️ Manual Installation (Developer Mode)

If you want to install the extension from the source code, follow these steps:

1. Download or clone this repository to your computer:
   ```bash
   git clone https://github.com/rohit124551/LPU-Auto-Login.git
   ```
2. Open Google Chrome and go to `chrome://extensions/`
3. Turn on **Developer mode** (toggle switch in the top right corner).
4. Click **Load unpacked** in the top left corner.
5. Select the `LPU-Auto-Login` folder you just downloaded.
6. The extension is now installed! Click the puzzle icon in Chrome to pin it.

---

## 🔒 Privacy & Security

Your privacy is our absolute priority. This extension is designed with a **Zero-Backend Architecture**.

- **No Servers:** We do not own any servers, databases, or APIs. 
- **100% Local:** Your Registration ID and encrypted passwords are saved strictly within your browser's private local storage (`chrome.storage.local`).
- **Identity Binding:** The encrypted password is mathematically bound to your Registration ID. It is impossible to decrypt the password without the matching ID.
- **No Analytics:** There are zero tracking scripts, cookies, or third-party analytics embedded in the extension.

For full details, please read our [Privacy Policy](https://rohitkumarranjan.in/lpu-autologin/privacy.html).

---

## 🧑‍💻 Supported Portals

LPU Auto Login natively supports the following campus portals:
- **Internet Gateway:** `internet.lpu.in` & `10.10.0.1`
- **UMS / MyClass:** `myclass.lpu.in` (including Codetantra redirects)
- **OAS Portal:** `oas.lpu.in`

---

## 📄 Changelog

### v2.6 (Major Update)
- **Quick Links Upgrade:** Added full Drag & Drop support to reorder custom links.
- **Smart Icons:** Implemented DuckDuckGo Favicon API + Smart Color-Hashed Initials for custom links that lack logos.
- **LPU Branding:** Internal LPU links (`ums.lpu.in`, `oas.lpu.in`) now automatically inherit the official LPU Orange Crest logo.
- **Weather Widget:** Integrated Open-Meteo API for 100% free, out-of-the-box weather updates (removed API key requirements).
- **Settings Menu:** Added toggles to disable the Network Monitor or Weather Widget, plus a Factory Reset button.
- **Code Optimization:** Removed unused `tabs` permissions for seamless Chrome Web Store approval.
- **UI Polish:** Replaced "Kinetic Obsidian" codename with official "LPU Auto Login" branding in the UI footer.

---

*Developed with ❤️ by Rohit Kumar Ranjan (rohit124551)*  
*LPU CSE Student*
