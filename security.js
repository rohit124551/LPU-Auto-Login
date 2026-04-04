/**
 * Vault Utility - Secure Encryption for LPU Auto Login
 * Now with IDENTITY BINDING (AAD) to tie credentials to specific User IDs.
 */
const Vault = {
    _key: null,
    _keyName: 'vault_system_key',

    /**
     * Internal: Ensures the encryption key is loaded or generated.
     */
    async _ensureKey() {
        if (this._key) return this._key;

        return new Promise((resolve) => {
            chrome.storage.local.get([this._keyName], async (res) => {
                if (res[this._keyName]) {
                    // Import existing key
                    const keyData = res[this._keyName];
                    this._key = await crypto.subtle.importKey(
                        "jwk",
                        keyData,
                        { name: "AES-GCM", length: 256 },
                        true,
                        ["encrypt", "decrypt"]
                    );
                } else {
                    // Generate new key
                    this._key = await crypto.subtle.generateKey(
                        { name: "AES-GCM", length: 256 },
                        true,
                        ["encrypt", "decrypt"]
                    );
                    const jwk = await crypto.subtle.exportKey("jwk", this._key);
                    chrome.storage.local.set({ [this._keyName]: jwk });
                }
                resolve(this._key);
            });
        });
    },

    /**
     * Encrypt a plain-text string with optional Identity Binding (AAD).
     * @param {string} text - The password to encrypt.
     * @param {string} associatedData - The User ID to bind to.
     */
    async encrypt(text, associatedData = null) {
        if (!text) return text;
        const key = await this._ensureKey();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = new TextEncoder().encode(text);

        const encryptParams = { name: "AES-GCM", iv: iv };
        if (associatedData) {
            encryptParams.additionalData = new TextEncoder().encode(associatedData);
        }

        const ciphertext = await crypto.subtle.encrypt(
            encryptParams,
            key,
            encoded
        );

        // Combine IV + Ciphertext for storage
        const combined = new Uint8Array(iv.length + ciphertext.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(ciphertext), iv.length);

        return btoa(String.fromCharCode.apply(null, combined));
    },

    /**
     * Decrypt a base64 encoded string with optional Identity Binding (AAD).
     * @param {string} encodedData - The encrypted password.
     * @param {string} associatedData - The User ID to verify against.
     */
    async decrypt(encodedData, associatedData = null) {
        if (!encodedData) return encodedData;
        try {
            const key = await this._ensureKey();
            const binary = atob(encodedData);
            const combined = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                combined[i] = binary.charCodeAt(i);
            }

            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);

            const decryptParams = { name: "AES-GCM", iv: iv };
            if (associatedData) {
                decryptParams.additionalData = new TextEncoder().encode(associatedData);
            }

            const decrypted = await crypto.subtle.decrypt(
                decryptParams,
                key,
                ciphertext
            );

            return new TextDecoder().decode(decrypted);
        } catch (e) {
            console.error("Vault Decryption Error:", e);
            // If decryption fails (incorrect ID or key), return a safe error message
            // or the original if it looks like plain text.
            return (encodedData.length > 32) ? "ERR:DECRYPT_FAIL" : encodedData;
        }
    }
};
