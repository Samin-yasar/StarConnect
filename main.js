const nickname = prompt('Enter your nickname:') || 'Me';
document.getElementById('myNick').textContent = nickname;

document.getElementById('sendButton').onclick = () => {
  const input = document.getElementById('message');
  const message = input.value.trim();
  if (!message) return;

  const { box, nonce } = window.encryptMessage(message); // 👈
  peer.send(JSON.stringify({ box, nonce, nickname }));
  addMessage(message, true, nickname);
  input.value = '';
};
