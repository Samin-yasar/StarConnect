// main.js
window.onload = () => {
  const nickname = prompt('Enter your nickname:') || 'Me';
  document.getElementById('myNick').textContent = nickname;

  document.getElementById('sendButton').onclick = () => {
    const input = document.getElementById('message');
    const message = input.value.trim();
    if (!message) return;

    try {
      const { box, nonce } = window.encryptMessage(message);
      window.peer.send(JSON.stringify({ box, nonce, nickname }));
      addMessage(message, true, nickname);
      input.value = '';
    } catch (e) {
      console.error('Encryption error:', e.message);
      if (e.message === 'Peer public key not set') {
        alert('Please wait for the peer connection to be established.');
      } else {
        alert('Encryption failed: ' + e.message);
      }
    }
  };
};
