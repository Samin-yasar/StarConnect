// crypto.js
let keyPair;
let peerPublicKey;

function ensureInitialized() {
  if (!window.nacl || !window.nacl.util) {
    throw new Error('NaCl libraries not loaded yet');
  }
  if (!keyPair) {
    keyPair = window.nacl.box.keyPair();
  }
}

function encryptMessage(message) {
  ensureInitialized();
  if (!peerPublicKey) {
    throw new Error('Peer public key not set');
  }
  const nonce = window.nacl.randomBytes(window.nacl.box.nonceLength);
  const encodedMsg = typeof message === 'string' ? window.nacl.util.decodeUTF8(message) : message;
  const box = window.nacl.box(encodedMsg, nonce, peerPublicKey, keyPair.secretKey);
  return { box, nonce };
}

function decryptMessage({ box, nonce }) {
  ensureInitialized();
  if (!peerPublicKey) {
    throw new Error('Peer public key not set');
  }
  const decrypted = window.nacl.box.open(box, nonce, peerPublicKey, keyPair.secretKey);
  if (!decrypted) return null;
  return window.nacl.util.encodeUTF8(decrypted);
}

window.encryptMessage = encryptMessage;
window.decryptMessage = decryptMessage;
window.getKeyPair = () => {
  ensureInitialized();
  return keyPair;
};
window.setPeerPublicKey = (key) => peerPublicKey = key;
