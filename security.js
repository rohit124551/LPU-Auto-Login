/**
 * Vault Utility - Secure Encryption for LPU Auto Login
 * Now with IDENTITY BINDING (AAD) to tie credentials to specific User IDs.
 */
const Vault = {
    _key: null,
    _keyName: 'vault_system_key',
    _readyPromise: null,

    /**
     * Internal: Ensures the encryption key is loaded or generated.
     */
    async _ensureKey() {
        if (this._key) return this._key;
        if (this._readyPromise) return this._readyPromise;

        this._readyPromise = new Promise((resolve, reject) => {
            chrome.storage.local.get([this._keyName], async (res) => {
                try {
                    if (res[this._keyName]) {
                        const keyData = res[this._keyName];
                        this._key = await crypto.subtle.importKey(
                            "jwk",
                            keyData,
                            { name: "AES-GCM", length: 256 },
                            true,
                            ["encrypt", "decrypt"]
                        );
                    } else {
                        this._key = await crypto.subtle.generateKey(
                            { name: "AES-GCM", length: 256 },
                            true,
                            ["encrypt", "decrypt"]
                        );
                        const jwk = await crypto.subtle.exportKey("jwk", this._key);
                        chrome.storage.local.set({ [this._keyName]: jwk });
                    }
                    resolve(this._key);
                } catch (e) {
                    this._readyPromise = null;
                    reject(e);
                }
            });
        });

        return this._readyPromise;
    },

    /**
     * Internal: Robust Base64 utilities
     */
    _uint8ArrayToBase64(uint8Array) {
        let binary = '';
        uint8Array.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
    },

    _base64ToUint8Array(base64) {
        const binary = atob(base64);
        const uint8Array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            uint8Array[i] = binary.charCodeAt(i);
        }
        return uint8Array;
    },

    /**
     * Encrypt a plain-text string with optional Identity Binding (AAD).
     * @param {string} text - The password to encrypt.
     * @param {string} associatedData - The User ID to bind to.
     */
    async encrypt(text, associatedData = null) {
        if (!text) return text;
        try {
            const key = await this._ensureKey();
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const encoded = new TextEncoder().encode(text);

            const encryptParams = { name: "AES-GCM", iv: iv };
            if (associatedData) {
                encryptParams.additionalData = new TextEncoder().encode(associatedData);
            }

            const ciphertext = await crypto.subtle.encrypt(encryptParams, key, encoded);

            const combined = new Uint8Array(iv.length + ciphertext.byteLength);
            combined.set(iv);
            combined.set(new Uint8Array(ciphertext), iv.length);

            return this._uint8ArrayToBase64(combined);
        } catch (e) {
            console.error("Vault Encryption Error:", e);
            return text;
        }
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
            
            // 1. Basic validation: is it a plausible base64 string?
            let combined;
            try {
                combined = this._base64ToUint8Array(encodedData);
            } catch (e) {
                // If it's not base64, it's likely plain-text from a legacy migration
                return (encodedData.length > 50) ? "ERR:DECRYPT_FAIL" : encodedData;
            }

            // 2. Encryption Format Validation: Must be at least IV(12) + Tag(16)
            if (combined.length < 28) return encodedData;

            const iv = combined.slice(0, 12);
            const ciphertext = combined.slice(12);

            // 3. Attempt Decryption with associatedData (AAD)
            try {
                const decryptParams = { name: "AES-GCM", iv: iv };
                if (associatedData) {
                    decryptParams.additionalData = new TextEncoder().encode(associatedData);
                }

                const decrypted = await crypto.subtle.decrypt(decryptParams, key, ciphertext);
                return new TextDecoder().decode(decrypted);
            } catch (e) {
                // 4. FALLBACK: If with-AAD fails, try WITHOUT AAD
                // This resolves issues where a password was saved before "Identity Binding" was added.
                if (associatedData) {
                    try {
                        const fallbackParams = { name: "AES-GCM", iv: iv };
                        const decrypted = await crypto.subtle.decrypt(fallbackParams, key, ciphertext);
                        return new TextDecoder().decode(decrypted);
                    } catch (innerE) {
                        throw innerE; // Both failed
                    }
                }
                throw e;
            }
        } catch (e) {
            console.error("Vault Decryption Error:", e);
            // Safety: If it looks like plain text despite errors, just return as is
            // Otherwise show decryption failure
            return (encodedData.length > 32) ? "ERR:DECRYPT_FAIL" : encodedData;
        }
    }
};
