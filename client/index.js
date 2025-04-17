const nickname = prompt('請輸入你的暱稱') || '匿名用戶';
const socket = new WebSocket('ws://localhost:3000');
const chatBox = document.getElementById('chat-box');
const input = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const imageInput = document.getElementById('image-input'); // 允許上傳圖片的 input 元素

// 當 WebSocket 連線成功時
socket.addEventListener('open', () => {
  const joinMsg = {
    type: 'system',
    text: `${nickname} 加入了聊天室`,
    nickname: '系統',
    timestamp: new Date().toISOString(),
    user: nickname, // 發送暱稱
  };
  socket.send(JSON.stringify(joinMsg));
});

// 監聽訊息事件
socket.addEventListener('message', async (event) => {
  let text = '';
  if (typeof event.data === 'string') {
    text = event.data;
  } else if (event.data instanceof Blob) {
    text = await event.data.text();
  } else if (event.data instanceof ArrayBuffer) {
    text = new TextDecoder().decode(event.data);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error('無法解析 JSON：', e, text);
    return;
  }

  const fromMe = data.nickname === nickname;

  if (data.type === 'chat') {
    addChatBubble(
      data.nickname,
      data.text,
      formatTimeAgo(data.timestamp),
      fromMe ? 'me' : 'other'
    );
  } else if (data.type === 'system') {
    addSystemMessage(data.text); // 顯示進入或離開訊息
  } else if (data.type === 'image') {
    addImageMessage(
      data.nickname,
      data.text,
      formatTimeAgo(data.timestamp),
      data.imageUrl,
      fromMe ? 'me' : 'other'
    );
  }
});

// 發送訊息
sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendMessage();
});

// 處理圖片上傳
imageInput.addEventListener('change', sendImage);

function sendMessage() {
  const messageText = input.value.trim();
  if (!messageText) return;

  const msg = {
    type: 'chat',
    nickname,
    text: messageText,
    timestamp: new Date().toISOString(),
  };
  socket.send(JSON.stringify(msg));
  input.value = '';
}

function sendImage(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = () => {
      const msg = {
        type: 'image',
        nickname,
        text: '圖片訊息',
        timestamp: new Date().toISOString(),
        imageUrl: reader.result, // 圖片 base64 字串
      };
      socket.send(JSON.stringify(msg));
    };
    reader.readAsDataURL(file); // 將圖片轉換為 base64 格式
  }
}

function addChatBubble(name, text, time, type) {
  const wrapper = document.createElement('div');
  wrapper.className = `message ${type}`;

  const nick = document.createElement('div');
  nick.className = 'nickname';
  nick.textContent = name;

  const msg = document.createElement('div');
  msg.textContent = text;

  const stamp = document.createElement('div');
  stamp.className = 'timestamp';
  stamp.textContent = time;

  wrapper.appendChild(nick);
  wrapper.appendChild(msg);
  wrapper.appendChild(stamp);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addImageMessage(name, text, time, imageUrl, type) {
  const wrapper = document.createElement('div');
  wrapper.className = `message ${type} image`;

  const nick = document.createElement('div');
  nick.className = 'nickname';
  nick.textContent = name;

  const msg = document.createElement('div');
  msg.textContent = text;

  const img = document.createElement('img');
  img.src = imageUrl; // 顯示圖片
  img.className = 'chat-image';

  const stamp = document.createElement('div');
  stamp.className = 'timestamp';
  stamp.textContent = time;

  wrapper.appendChild(nick);
  wrapper.appendChild(msg);
  wrapper.appendChild(img);
  wrapper.appendChild(stamp);
  chatBox.appendChild(wrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function addSystemMessage(text) {
  const p = document.createElement('div');
  p.className = 'system';
  p.textContent = text;
  chatBox.appendChild(p);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function formatTimeAgo(isoTimeStr) {
  const now = new Date();
  const msgTime = new Date(isoTimeStr);
  const diffMs = now - msgTime;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return '剛剛';
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  if (diffHr < 24) return `${diffHr} 小時前`;
  if (diffDay === 1) return '昨天';

  return msgTime.toLocaleDateString();
}
