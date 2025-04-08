if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/Private-Wave/sw.js')
    .then(reg => console.log('SW registered:', reg.scope))
    .catch(err => console.error('SW registration failed:', err));
}

const nickname = prompt('Enter your nickname:') || 'Me';
document.getElementById('myNick').textContent = nickname;

document.getElementById('sendButton').onclick = () => {
  const input = document.getElementById('message');
  const message = input.value.trim();
  if (!message) return;

  const { box, nonce } = encryptMessage(message);
  peer.send(JSON.stringify({ box, nonce, nickname }));
  addMessage(message, true, nickname);
  input.value = '';
};

document.getElementById('copySignal').onclick = () => {
  navigator.clipboard.writeText(document.getElementById('mySignal').value)
    .then(() => alert('Signal copied!'));
};