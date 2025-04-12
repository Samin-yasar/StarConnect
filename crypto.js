(function () {
  let keyPair = null;
  let peerPublicKey = null;

  function checkNaCl() {
    if (!window.nacl || !window.nacl.util) {
      throw new Error('NaCl library (nacl.min.js or nacl-util.js) not loaded.');
    }
  }

  function checkCryptoJS() {
    if (!window.CryptoJS || !window.CryptoJS.AES || !window.CryptoJS.PBKDF2) {
      throw new Error('CryptoJS library (crypto-js.min.js) not loaded.');
    }
  }

  function encryptSecretKey(secretKey, password) {
    checkCryptoJS();
    const salt = window.CryptoJS.lib.WordArray.random(16);
    const key = window.CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 100000
    });
    const iv = window.CryptoJS.lib.WordArray.random(16);
    const encrypted = window.CryptoJS.AES.encrypt(
      window.CryptoJS.enc.Base64.stringify(
        window.CryptoJS.lib.WordArray.create(secretKey)
      ),
      key,
      { iv: iv }
    );
    return {
      encrypted: encrypted.ciphertext.toString(window.CryptoJS.enc.Base64),
      salt: salt.toString(window.CryptoJS.enc.Base64),
      iv: iv.toString(window.CryptoJS.enc.Base64)
    };
  }

  function decryptSecretKey(encryptedData, password) {
    checkCryptoJS();
    try {
      const salt = window.CryptoJS.enc.Base64.parse(encryptedData.salt);
      const iv = window.CryptoJS.enc.Base64.parse(encryptedData.iv);
      const key = window.CryptoJS.PBKDF2(password, salt, {
        keySize: 256 / 32,
        iterations: 100000
      });
      const decrypted = window.CryptoJS.AES.decrypt(
        { ciphertext: window.CryptoJS.enc.Base64.parse(encryptedData.encrypted) },
        key,
        { iv: iv }
      );
      const decoded = window.CryptoJS.enc.Base64.parse(
        decrypted.toString(window.CryptoJS.enc.Utf8)
      );
      const secretKey = new Uint8Array(decoded.words.length * 4);
      for (let i = 0; i < decoded.words.length; i++) {
        secretKey[i * 4] = (decoded.words[i] >>> 24) & 255;
        secretKey[i * 4 + 1] = (decoded.words[i] >>> 16) & 255;
        secretKey[i * 4 + 2] = (decoded.words[i] >>> 8) & 255;
        secretKey[i * 4 + 3] = decoded.words[i] & 255;
      }
      return secretKey;
    } catch (e) {
      throw new Error('Failed to decrypt secret key: ' + e.message);
    }
  }

  function loadOrGenerateKeyPair(password) {
    if (keyPair) return keyPair;

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
          const secretKey = decryptSecretKey(parsed, password);
          if (secretKey.length === 32) {
            keyPair = {
              publicKey: new Uint8Array(parsed.publicKey),
              secretKey: secretKey
            };
            return keyPair;
          }
        }
      } catch (e) {
        console.error('Failed to load key pair:', e);
      }
    }

    checkNaCl();
    keyPair = window.nacl.box.keyPair();
    if (password) {
      const encryptedData = encryptSecretKey(keyPair.secretKey, password);
      localStorage.setItem(
        'chatKeyPair',
        JSON.stringify({
          publicKey: Array.from(keyPair.publicKey),
          encrypted: encryptedData.encrypted,
          salt: encryptedData.salt,
          iv: encryptedData.iv
        })
      );
    }
    return keyPair;
  }

  function encryptMessage(message) {
    checkNaCl();
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

  function decryptMessage({ box, nonce }) {
    checkNaCl();
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

  function setPeerPublicKey(key) {
    if (!(key instanceof Uint8Array) || key.length !== 32) {
      throw new Error('Invalid peer public key: must be a 32-byte Uint8Array');
    }
    peerPublicKey = key;
  }

  window.cryptoModule = {
    encryptMessage,
    decryptMessage,
    getKeyPair: loadOrGenerateKeyPair,
    setPeerPublicKey
  };

  // Deferred dependency check with retries
  function checkDependencies() {
    try {
      checkNaCl();
      checkCryptoJS();
      console.log('Encryption libraries loaded successfully.');
    } catch (e) {
      console.error('Dependency check failed:', e.message);
      alert('Encryption libraries failed to load: ' + e.message + '. Chat disabled.');
      throw e;
    }
  }

  let attempts = 0;
  function tryCheckDependencies() {
    if (attempts < 5) {
      attempts++;
      setTimeout(() => {
        try {
          checkDependencies();
        } catch (e) {
          tryCheckDependencies();
        }
      }, 500);
    } else {
      console.error('Max retry attempts reached for dependency check.');
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', tryCheckDependencies);
  } else {
    tryCheckDependencies();
  }
})();
