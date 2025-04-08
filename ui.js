function addMessage(content, isOwnMessage, nickname = 'Anonymous') {
  const messages = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.classList.add('msg');
  if (isOwnMessage) msg.classList.add('me');

  const nick = document.createElement('span');
  nick.className = 'nickname';
  nick.textContent = nickname;
  msg.appendChild(nick);

  const time = document.createElement('span');
  time.className = 'timestamp';
  time.textContent = new Date().toLocaleTimeString();
  msg.appendChild(time);

  if (typeof content === 'string') {
    msg.appendChild(document.createTextNode(content));
  } else {
    msg.appendChild(content);
  }

  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}