# 🛡️ Privacy Policy | LPU Auto Login

**Last Updated: April 4, 2026**

Your privacy is our priority. This Privacy Policy explains how **LPU Auto Login** handles your data.

### 1. 📂 Data Storage (Local Only)
LPU Auto Login does **NOT** collect, transmit, or share any personally identifiable information (PII) to external servers. All user data, including Registration IDs and Passwords, is stored **exclusively** on your local device within the browser's private storage (`chrome.storage.local`).

### 2. 🎯 Purpose of Data
The stored data is used solely for the purpose of automating the login process on LPU portals:
- `internet.lpu.in` (Internet Gateway)
- `myclass.lpu.in` (UMS / MyClass)
- `oas.lpu.in` (OAS Portal)
- `lovelyprofessionaluniversity.codetantra.com` (Codetantra sessions)

The extension does **not** track browsing history, analyze user behavior, or interact with any non-LPU websites.

### 3. 🔒 Data Security & Encryption
We implement a multi-layered security system to protect your credentials:
- **AES-GCM Encryption**: All sensitive data is encrypted using the industry-standard **AES-GCM (256-bit)** protocol.
- **Unique Dynamic Key**: Each installation generates its own **unique, random encryption key** locally. No two students share the same key.
- **Identity Binding (AAD)**: Encrypted passwords are mathematically "locked" to your specific User ID. Even if the encrypted data and your private key are stolen, the password cannot be decrypted without your matching Registration ID.
- **Extension-Side Decryption**: Decryption logic is isolated from the portal pages within the extension's background process.

### 4. 🚫 Third-Party Services
The extension does **not** use third-party analytics, advertisements, or tracking scripts. No trackers or cookies are embedded in the extension.

### 5. 📧 Contact
If you have any questions about this policy, please contact the developer at:
- **Support**: hello@rohitkumarranjan.in
- **Portfolio**: [rohitkumarranjan.in](https://rohitkumarranjan.in)

---

Developed by **rohit124551**, LPU CSE Student.
