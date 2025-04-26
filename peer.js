import { SignalProtocolManager } from './crypto.js';

let signalManager;
let nickname = localStorage.getItem('chatNickname') || 'Anonymous';

const peer = new SimplePeer({
  initiator: location.hash === '#init',
  trickle: false,
  config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
});

// Initialize the Signal Protocol
async function initializeSignalProtocol() {
  try {
    signalManager = new SignalProtocolManager();
    const userId = generateUserId();
    const userKeys = await signalManager.initializeUser(userId);
    
    // Store user ID and keys for identification
    window.userId = userId;
    window.userKeys = userKeys;
    
    console.log('Signal Protocol initialized successfully');
    return { userId, userKeys };
  } catch (error) {
    console.error('Failed to initialize Signal Protocol:', error);
    alert('Encryption setup failed: ' + error.message);
    throw error;
  }
}

// Helper function to generate a random user ID
function generateUserId() {
  return 'user_' + Math.random().toString(36).substr(2, 9);
}

window.addEventListener('load', async () => {
  if (!localStorage.getItem('chatNickname')) {
    nickname = prompt('Enter your nickname:') || 'Anonymous';
    localStorage.setItem('chatNickname', nickname);
  }
  window.nickname = nickname;
  
  try {
    await initializeSignalProtocol();
  } catch (e) {
    console.error('Failed to initialize encryption:', e);
  }
});

peer.on('signal', (data) => {
  const signalInput = document.getElementById('mySignal');
  if (signalInput) {
    signalInput.value = JSON.stringify(data);
  }
});

peer.on('connect', async () => {
  alert('Connection established! Setting up secure encryption...');
  try {
    // Send our user ID and prekey bundle to the peer
    peer.send(JSON.stringify({
      type: 'keyExchange',
      userId: window.userId,
      preKeyBundle: window.userKeys,
      nickname: window.nickname
    }));
  } catch (e) {
    console.error('Failed to send encryption keys:', e);
    alert('Key exchange failed: ' + e.message);
  }
});

peer.on('data', async (rawData) => {
  try {
    const msg = JSON.parse(rawData);
    
    // Handle key exchange
    if (msg.type === 'keyExchange') {
      window.peerUserId = msg.userId;
      window.peerNickname = msg.nickname;
      
      // Create a session with the peer using their prekey bundle
      await signalManager.createSession(
        msg.userId,
        1, // assuming deviceId = 1
        msg.preKeyBundle
      );
      
      console.log('Secure session established with peer');
      
      // If we haven't sent our keys yet, do it now
      if (!peer.sentKeys) {
        peer.send(JSON.stringify({
          type: 'keyExchange',
          userId: window.userId,
          preKeyBundle: window.userKeys,
          nickname: window.nickname
        }));
        peer.sentKeys = true;
      }
      
      return;
    }
    
    // Handle encrypted messages
    if (msg.type === 'signalMessage') {
      // Decrypt the message using Signal Protocol
      const plaintext = await signalManager.decryptMessage(
        window.peerUserId,
        1, // assuming deviceId = 1
        msg.encryptedMessage
      );
      
      // Display the message
      window.uiModule.addMessage(plaintext, false, msg.nickname);
    }
  } catch (e) {
    console.error('Message processing failed:', e);
    alert('Failed to process message: ' + e.message);
  }
});

peer.on('error', (err) => {
  console.error('Peer error:', err);
  alert('Connection error: ' + err.message);
});

async function sendMessage(message) {
  if (!peer.connected) {
    alert('Not connected to peer.');
    return;
  }
  
  if (!window.peerUserId) {
    alert('Secure connection not yet established. Please wait.');
    return;
  }
  
  try {
    // Encrypt the message using Signal Protocol
    const encryptedMessage = await signalManager.encryptMessage(
      window.peerUserId,
      1, // assuming deviceId = 1
      message
    );
    
    // Send the encrypted message
    peer.send(JSON.stringify({
      type: 'signalMessage',
      encryptedMessage,
      nickname: window.nickname
    }));
    
    // Display our own message
    window.uiModule.addMessage(message, true, window.nickname);
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
