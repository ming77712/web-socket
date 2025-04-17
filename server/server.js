const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (ws) => {
  let userNickname = ''; // 用來儲存該用戶的暱稱

  // 當收到訊息時
  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error('無法解析訊息:', e);
      return;
    }

    if (data.type === 'system' && data.user) {
      // 保存暱稱
      userNickname = data.user;

      // 廣播進入聊天室的訊息
      const joinMsg = {
        type: 'system',
        text: `${userNickname} 加入了聊天室`,
        nickname: '系統',
        timestamp: new Date().toISOString(),
      };

      broadcast(joinMsg);
      console.log(`${userNickname} 加入了聊天室`);
    } else if (data.type === 'chat' || data.type === 'image') {
      // 處理普通訊息或圖片訊息，直接廣播
      broadcast(data);
    }
  });

  // 當客戶端斷線時
  ws.on('close', () => {
    if (userNickname) {
      // 廣播離開聊天室的訊息
      const leaveMsg = {
        type: 'system',
        text: `${userNickname} 離開了聊天室`,
        nickname: '系統',
        timestamp: new Date().toISOString(),
      };
      broadcast(leaveMsg);
      console.log(`${userNickname} 離開了聊天室`);
    }
  });
});

// 廣播函式，將訊息發送給所有連線的用戶
function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}
