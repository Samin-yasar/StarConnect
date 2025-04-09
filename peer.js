// peer.js
const peer = new SimplePeer({ initiator: location.hash === '#init', trickle: false });

peer.on('signal', data => {
  document.getElementById('mySignal').value = JSON.stringify(data);
});

peer.on('connect', () => {
  alert('Secure connection established!');
  // Exchange public keys after connection
  const myPublicKey = window.getKeyPair().publicKey;
  peer.send(JSON.stringify({ type: 'publicKey', publicKey: myPublicKey }));
});

peer.on('data', rawData => {
  const msg = JSON.parse(rawData);
  
  if (msg.type === 'publicKey') {
    // Set the peer's public key
    window.setPeerPublicKey(msg.publicKey);
    console.log('Peer public key received and set');
    return;
  }

  // Decrypt the message
  const plain = window.decryptMessage({ box: msg.box, nonce: msg.nonce });
  if (!plain) return alert('Failed to decrypt message!');
  
  addMessage(plain, false, msg.nickname);
});

// Expose peer globally
window.peer = peer;
