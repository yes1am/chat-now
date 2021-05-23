const User = require('./user')
const { v4: uuidv4 } = require('uuid');

const SYSTEM = "system";
const CHAT = "chat";

class Chat {
  constructor(io) {
    this.io = io;
    this.users = []
  }

  init() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket)
    });
  }

  handleConnection(socket) {
    // 用户加入
    socket.on('userJoin', (msg) => {
      console.log(`userJoin:`, msg);
      const { name, id } = msg;
      const user = new User(name, id, socket);
      this.users.push(user);
      this.handleUserConnection(user);
      // 会发送给所有 socket，包括当前的 socket
      this.io.emit('serverToClient', {
        type: SYSTEM,
        message: `${name} 加入房间`,
        msgId: uuidv4()
      });
      // 只会返回给当前 socket 之外的 sockets
      // socket.broadcast.emit('serverToClient', `服务端返回 ${msg}`)
    });
  }

  handleUserConnection(user) {
    user.socket.on('disconnect', () => {
      console.log(`用户 ${user.name} 断开连接`)
      this.users = this.users.filter(u => u.uid === user.uid)
      this.io.emit('serverToClient', {
        type: SYSTEM,
        message: `${user.name} 离开房间`,
        msgId: uuidv4()
      });
    })
    user.socket.on('clientToServer', (msg) => {
      console.log(`服务端收到消息: ${msg} `);
      // 会发送给所有 socket，包括当前的 socket
      this.io.emit('serverToClient', {
        type: CHAT,
        message: msg,
        // 此消息的发送者 id
        user: {
          id: user.uid,
          name: user.name
        },
        msgId: uuidv4()
      });
    });
  }
}

module.exports = Chat;