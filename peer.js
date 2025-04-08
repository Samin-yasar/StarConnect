// Initialize the peer connection, deciding if this peer is the initiator based on the URL hash
const peer = new SimplePeer({ initiator: location.hash === '#init', trickle: false });

// Signal exchange handler
peer.on('signal', data => {
  // Send signal data (this should be passed to the other peer)
  document.getElementById('mySignal').value = JSON.stringify(data);
});

// Connect event (peer connection established)
peer.on('connect', () => {
  alert('Secure connection established!');
  // You can now send encrypted messages
});

// Data reception handler
peer.on('data', rawData => {
  // Decrypt received data
  const msg = JSON.parse(rawData);
  const plain = decryptMessage(msg.encryptedMessage, msg.key); // Decrypt the message
  if (!plain) return alert('Failed to decrypt message!');
  
  // Process the decrypted message (add it to the chat, etc.)
  addMessage(plain, false, msg.nickname);
});

// Example message sending (you can modify this as per your UI/logic)
function sendMessage() {
  const message = document.getElementById('message').value;
  const encrypted = encryptMessage(message, encryptionKey); // Encrypt the message
  peer.send(JSON.stringify({ encryptedMessage: encrypted, key: encryptionKey, nickname: "UserNickname" }));
  document.getElementById('message').value = ''; // Clear the message input field
}
