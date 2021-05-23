const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const Chat = require('./chat');

// 设置跨域
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const chat = new Chat(io);
chat.init()

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});


server.listen(3001, () => {
  console.log('listening on *:3001');
});