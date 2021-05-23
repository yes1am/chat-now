import React, { useEffect, useState, useRef } from 'react';
import { io } from "socket.io-client";
import { Button, Modal, Toast } from 'antd-mobile';
import { v4 as uuidv4 } from 'uuid';
import cx from 'classnames'
import { User } from './types';
const STORAGE_KEY = "storage"

function App() {
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState<User>({});
  const [visible, setVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const socket = useRef(null);

  function initSocket(tempUser) {
    const iSocket = io("http://localhost:3001");
    socket.current = iSocket;
    iSocket.on('serverToClient', (msg) => {
      console.log("收到服务端消息", msg);
      setMessages(oldMessages => {
        const newMessages = oldMessages.slice();
        newMessages.push(msg)
        return newMessages
      })
    })
    iSocket.on('connect', () => {
      console.log("链接成功", iSocket.id);
      iSocket.emit('userJoin', tempUser)
    })
  }

  useEffect(() => {
    const storage = sessionStorage.getItem(STORAGE_KEY);
    let tempUser = {};
    if(storage) {
      setUser(JSON.parse(storage))
      tempUser = JSON.parse(storage);
      initSocket(tempUser)
    } else {
      setVisible(true)
    }
  }, [])

  function onChange(e) {
    setValue(e.target.value)
  }

  function onSend() {
    socket.current.emit('clientToServer', value);
    setValue('')
  }

  function onConfirm() {
    if(!userName) {
      Toast.fail("用户名不能为空")
      return
    }
    setVisible(false);
    const user = {
      name: userName,
      id: `User::${uuidv4()}`,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    setUser(user)
    initSocket(user)
  }

  function onUserNameChange(e) {
    setUserName(e.target.value)
  }

  return (
    <div className="App">
      <input value={value} onChange={onChange}  />
      <button onClick={onSend}>发送</button>
      {
        messages.map(m => {
          const text = m.message;
          const isChatMessage = m.type === "chat";
          const userName =  isChatMessage ? (m.user && m.user.name) || "默认用户" : '' ;
          const cls = cx("message", {
            "system_message": m.type === "system",
            "chat_message": isChatMessage,
            "send_message": m.user && m.user.id === user.id,
            "receive_message": m.user && m.user.id !== user.id,
          })
          return <div key={m.msgId} className={cls}>
              {`${userName ? `${userName}:` : ''}`}{text}
          </div>
        })
      }
        <Modal
          visible={visible}
          transparent
          maskClosable={false}
          title="输入用户名"
        >
          <div>
            <input value={userName} onChange={onUserNameChange} type="text" />
            <Button 
              size="small"
              type="primary"
              onClick={onConfirm}
            >
              确认
            </Button>
          </div> 
        </Modal>
    </div>
  );
}

export default App;