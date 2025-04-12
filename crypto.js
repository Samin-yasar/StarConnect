(function () {
  // Private module variables
  let keyPair = null;
  let peerPublicKey = null;

  // Check for NaCl dependency
  function checkNaCl() {
    if (!window.nacl || !window.nacl.util) {
      throw new Error('NaCl library not loaded. Please include TweetNaCl.');
    }
  }

  // Encrypt secret key with user password
  function encryptSecretKey(secretKey, password) {
    if (!window.CryptoJS) {
      throw new Error('CryptoJS not loaded for key encryption');
    }
    const salt = CryptoJS.lib.WordArray.random(16);
    const key = CryptoJS.PBKDF2(password, salt, { keySize: 256 / 32, iterations: 100000 });
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(
      CryptoJS.enc.Base64.stringify(CryptoJS.lib.WordArray.create(secretKey)),
      key,
      { iv: iv }
    );
    return {
      encrypted: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
      salt: salt.toString(CryptoJS.enc.Base64),
      iv: iv.toString(CryptoJS.enc.Base64),
    };
  }

  // Decrypt secret key with user password
  function decryptSecretKey(encryptedData, password) {
    if (!window.CryptoJS) {
      throw new Error('CryptoJS not loaded for key decryption');
    }
    try {
      const salt = CryptoJS.enc.Base64.parse(encryptedData.salt);
      const iv = CryptoJS.enc.Base64.parse(encryptedData.iv);
      const key = CryptoJS.PBKDF2(password, salt, { keySize: 256 / 32, iterations: 100000 });
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: CryptoJS.enc.Base64.parse(encryptedData.encrypted) },
        key,
        { iv: iv }
      );
      return new Uint8Array(CryptoJS.enc.Base64.parse(decrypted.toString(CryptoJS.enc.Utf8)).words);
    } catch (e) {
      throw new Error('Failed to decrypt secret key: invalid password or corrupted data');
    }
  }

  // Load or generate key pair
  function loadOrGenerateKeyPair(password) {
    if (keyPair) return keyPair;

    // Try to load from localStorage
    const stored = localStorage.getItem('chatKeyPair');
    if (stored && password) {
      try {
        const parsed = JSON.parse(stored);
        if (
          Array.isArray(parsed.publicKey) &&
          parsed.publicKey.length === 32 &&
          parsed.encrypted &&
          parsed.salt &&
          parsed.iv
        ) {
          const secretKey = decryptSecretKey(
            {
              encrypted: parsed.encrypted,
              salt: parsed.salt,
              iv: parsed.iv,
            },
            password
          );
          if (secretKey.length === 32) {
            keyPair = {
              publicKey: new Uint8Array(parsed.publicKey),
              secretKey: secretKey,
            };
            return keyPair;
          }
        }
      } catch (e) {
        console.error('Failed to load key pair:', e);
      }
    }

    // Generate new key pair
    checkNaCl();
    keyPair = window.nacl.box.keyPair();
    if (password) {
      // Store in localStorage with encrypted secret key
      const encryptedData = encryptSecretKey(keyPair.secretKey, password);
      localStorage.setItem(
        'chatKeyPair',
        JSON.stringify({
          publicKey: Array.from(keyPair.publicKey),
          encrypted: encryptedData.encrypted,
          salt: encryptedData.salt,
          iv: encryptedData.iv,
        })
      );
    }
    return keyPair;
  }

  // Encrypt a message
  function encryptMessage(message) {
    checkNaCl();
    if (!keyPair) {
      throw new Error('Key pair not initialized. Call getKeyPair first.');
    }
    if (!peerPublicKey) {
      throw new Error('Peer public key not set');
    }
    const nonce = window.nacl.randomBytes(window.nacl.box.nonceLength);
    const encodedMsg =
      typeof message === 'string'
        ? window.nacl.util.decodeUTF8(message)
        : message;
    const box = window.nacl.box(
      encodedMsg,
      nonce,
      peerPublicKey,
      keyPair.secretKey
    );
    return { box, nonce };
  }

  // Decrypt a message
  function decryptMessage({ box, nonce }) {
    checkNaCl();
    if (!keyPair) {
      throw new Error('Key pair not initialized. Call getKeyPair first.');
    }
    if (!peerPublicKey) {
      throw new Error('Peer public key not set');
    }
    if (!(box instanceof Uint8Array) || !(nonce instanceof Uint8Array)) {
      throw new Error('Invalid box or nonce: must be Uint8Array');
    }
    const decrypted = window.nacl.box.open(
      box,
      nonce,
      peerPublicKey,
      keyPair.secretKey
    );
    if (!decrypted) {
      throw new Error('Decryption failed: invalid box, nonce, or key');
    }
    return window.nacl.util.encodeUTF8(decrypted);
  }

  // Set peer public key with validation
  function setPeerPublicKey(key) {
    if (!(key instanceof Uint8Array) || key.length !== 32) {
      throw new Error('Invalid peer public key: must be a 32-byte Uint8Array');
    }
    peerPublicKey = key;
  }

  // Expose public API
  window.cryptoModule = {
    encryptMessage,
    decryptMessage,
    getKeyPair: loadOrGenerateKeyPair,
    setPeerPublicKey,
  };

  // Initial NaCl check
  window.addEventListener('load', () => {
    try {
      checkNaCl();
    } catch (e) {
      console.error(e.message);
      alert('Encryption library failed to load. Chat functionality is disabled.');
    }
  });
})();
