import React, { useState, useRef } from "react";
import "./App.css";

interface chat {
  isLocal: boolean;
  text: string;
  name?: string;
}

const Chat = () => {

  const [chatList, setChatList] = useState<chat[]>([]);
  const textRef = useRef<HTMLInputElement>(null);

  const sendText = () => {
    const content = {
      isLocal: true,
      text: textRef.current?.value
    }

    setChatList((chatList: any) => {
      return [...chatList, content]
    });

    if (textRef.current) {
      textRef.current.value = ""
    }
  }

  return <div className="chat">
    <div className="chat-content">
      {
        chatList.map((item, index) => {
          return <div className={`chat-item ${item.isLocal ? 'right' : ''}`} key={index}>
            {!item.isLocal && <div>{item.name}</div>}
            <span>{item.text}</span>
          </div>
        })
      }
    </div>
    <div className="chat-input">
      <input type="text" ref={textRef} />
      <div className="button" onClick={sendText}>发送</div>
    </div>
  </div>
}

export default Chat;