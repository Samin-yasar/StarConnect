const peer = new SimplePeer({
  initiator: location.hash === '#init',
  trickle: false,
  config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
});

let nickname = localStorage.getItem('chatNickname') || 'Anonymous';
let password = null;

function initializeKeyPair(attempt = 1, maxAttempts = 30, startTime = Date.now()) {
  const timeoutMs = 15000; // 15 seconds
  if (Date.now() - startTime > timeoutMs) {
    console.error('Key pair initialization timed out after', timeoutMs, 'ms');
    alert('Encryption setup timed out. Please refresh and try again.');
    return;
  }
  try {
    if (!window.CryptoJS || !window.nacl || !window.nacl.util) {
      throw new Error('Encryption libraries (CryptoJS or NaCl) not loaded');
    }
    window.cryptoModule.getKeyPair(password);
    console.log('Key pair initialized successfully');
  } catch (e) {
    console.error('Key pair initialization failed (attempt ' + attempt + '):', e);
    if (attempt < maxAttempts) {
      setTimeout(() => initializeKeyPair(attempt + 1, maxAttempts, startTime), 1000);
    } else {
      alert('Encryption setup failed after ' + maxAttempts + ' attempts: ' + e.message + '. Please refresh.');
    }
  }
}

window.addEventListener('load', () => {
  if (!localStorage.getItem('chatNickname')) {
    nickname = prompt('Enter your nickname:') || 'Anonymous';
    localStorage.setItem('chatNickname', nickname);
  }

  password = prompt('Enter a password for encryption key:');
  if (!password) {
    alert('No password provided. Using temporary key.');
  }

  initializeKeyPair();
});

peer.on('signal', (data) => {
  const signalInput = document.getElementById('mySignal');
  if (signalInput) {
    signalInput.value = JSON.stringify(data);
  }
});

peer.on('connect', () => {
  alert('Secure connection established!');
  try {
    const myPublicKey = window.cryptoModule.getKeyPair(password).publicKey;
    peer.send(
      JSON.stringify({
        type: 'publicKey',
        publicKey: Array.from(myPublicKey)
      })
    );
  } catch (e) {
    console.error('Failed to send public key:', e);
    alert('Key exchange failed: ' + e.message);
  }
});

peer.on('data', (rawData) => {
  try {
    const msg = JSON.parse(rawData);
    if (msg.type === 'publicKey') {
      const publicKey = new Uint8Array(msg.publicKey);
      window.cryptoModule.setPeerPublicKey(publicKey);
      console.log('Peer public key set');
      return;
    }
    const box = new Uint8Array(msg.box);
    const nonce = new Uint8Array(msg.nonce);
    const plain = window.cryptoModule.decryptMessage({ box, nonce });
    window.uiModule.addMessage(plain, false, msg.nickname);
  } catch (e) {
    console.error('Message processing failed:', e);
    alert('Failed to decrypt message: ' + e.message);
  }
});

peer.on('error', (err) => {
  console.error('Peer error:', err);
  alert('Connection error: ' + err.message);
});

function sendMessage(message) {
  if (!peer.connected) {
    alert('Not connected to peer.');
    return;
  }
  try {
    const { box, nonce } = window.cryptoModule.encryptMessage(message);
    peer.send(
      JSON.stringify({
        type: 'message',
        box: Array.from(box),
        nonce: Array.from(nonce),
        nickname
      })
    );
    window.uiModule.addMessage(message, true, nickname);
  } catch (e) {
    console.error('Send message failed:', e);
    alert('Failed to encrypt message: ' + e.message);
  }
}

document.getElementById('connectForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const theirSignal = document.getElementById('theirSignal')?.value;
  if (theirSignal) {
    try {
      peer.signal(JSON.parse(theirSignal));
    } catch (err) {
      alert('Invalid signal data.');
    }
  }
});

document.getElementById('messageForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('messageInput');
  if (input && input.value.trim()) {
    sendMessage(input.value.trim());
    input.value = '';
  }
});

window.peer = peer;
window.sendMessage = sendMessage;
