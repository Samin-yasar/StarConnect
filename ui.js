(function () {
  function addMessage(content, isOwnMessage, nickname = 'Anonymous') {
    const messages = document.getElementById('messages');
    if (!messages) {
      console.error('Messages container not found');
      return;
    }

    const msg = document.createElement('div');
    msg.classList.add('msg');
    if (isOwnMessage) msg.classList.add('me');

    const nick = document.createElement('span');
    nick.className = 'nickname';
    nick.textContent = nickname.replace(/[<>&"']/g, (m) => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&apos;'
    }[m]));
    msg.appendChild(nick);

    const time = document.createElement('span');
    time.className = 'timestamp';
    time.textContent = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    msg.appendChild(time);

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    if (typeof content === 'string') {
      contentDiv.textContent = content.replace(/[<>&"']/g, (m) => ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;'
      }[m]));
    } else {
      contentDiv.appendChild(content);
    }
    msg.appendChild(contentDiv);

    messages.appendChild(msg);
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
  }

  window.uiModule = {
    addMessage
  };
})();
