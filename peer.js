const peer = new SimplePeer({ initiator: location.hash === '#init', trickle: false });

peer.on('signal', data => {
  document.getElementById('mySignal').value = JSON.stringify(data);
});

peer.on('connect', () => {
  alert('Secure connection established!');
});

peer.on('data', rawData => {
  const msg = JSON.parse(rawData);
  const plain = decryptMessage(msg);
  if (!plain) return alert('Failed to decrypt message!');
  addMessage(plain, false, msg.nickname);
});