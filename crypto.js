const naclUtil = nacl.util;
const keyPair = nacl.box.keyPair();
const encoder = naclUtil;
let peerPublicKey;

function encryptMessage(message) {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encodedMsg = typeof message === 'string' ? encoder.decodeUTF8(message) : message;
  const box = nacl.box(encodedMsg, nonce, peerPublicKey, keyPair.secretKey);
  return { box, nonce };
}

function decryptMessage({ box, nonce }) {
  const decrypted = nacl.box.open(box, nonce, peerPublicKey, keyPair.secretKey);
  if (!decrypted) return null;
  return encoder.encodeUTF8(decrypted);
}