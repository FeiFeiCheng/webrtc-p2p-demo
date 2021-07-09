import React, { useState, useRef, useEffect } from "react";

interface chat {
  isLocal: boolean;
  text: string;
  name?: string;
}

const Chat = ({ client }: { client: any }) => {
  const [chatList, setChatList] = useState<chat[]>([]);
  const textRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    client.on('message', (data: any) => {
      const { user, text } = data;
      const content = {
        isLocal: false,
        name: user.name,
        text
      };
      setChatList((chatList: any) => {
        return [...chatList, content]
      });
    })
    // eslint-disable-next-line
  }, [])

  const sendText = () => {
    const content = {
      isLocal: true,
      text: textRef.current?.value
    }

    client.chat(textRef.current?.value);

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