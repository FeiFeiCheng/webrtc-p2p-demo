import React, { useEffect, useRef, useState } from 'react';
import { message, Button } from 'antd';
import Chat from "./components/Chat";
import Login from "./components/Login";
import Client from './main/Client';
import { ILayout } from "./types/index";

message.config({
  duration: 2,
  maxCount: 1,
  rtl: true,
});

function App() {
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [layout, setLayout] = useState<ILayout[]>([]);
  const client = useRef<any>(null);

  useEffect(() => {

    return () => {
      leave()
    }
  }, [])

  const onJoinMeeting = (userName: string) => {
    try {
      if (!client.current) {
        client.current = new Client(userName);
      }

      client.current.join();

      client.current.on("layout", onHandleLayout);

      client.current.on("leave", onHandleLeave);

      setIsInMeeting(true);
    } catch (err) {
      console.log("join meeting error:", err)
    }
  }

  const onHandleLayout = (layout: ILayout[]) => {
    setLayout(layout);
  }

  const onHandleLeave = (data: string) => {
    setIsInMeeting(false);

    data && message.info(data);
  }

  const leave = () => {
    if (client.current) {
      client.current.close();
      client.current.removeAllListener();
    }

    setIsInMeeting(false);
  }

  return (
    <>
      {!isInMeeting ?
        <Login onJoinMeeting={onJoinMeeting} />
        :
        <div className="container">
          <div className="meeting">
            {
              layout.map((item: ILayout) => {
                return <Video key={item.userId} item={item} />
              })
            }

            <div className="footer">
              <Button type="link" onClick={leave}>离开</Button>
            </div>
          </div>
          <Chat client={client.current} />
        </div>}
    </>
  );
}

const Video = ({ item }: { item: ILayout }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEle = videoRef.current;

    (async () => {
      if (videoEle && !videoEle.srcObject && item.stream) {
        videoEle.srcObject = item.stream;

        if (videoEle.paused) {
          await videoEle.play();
        }
      }

      return () => {
        if (videoEle) {
          videoEle.pause();
          videoEle.srcObject = null;
        }
      }
    })();

  }, [item]);

  return <div className="video-wrapper">
    <div className={`video ${item.isLocal ? 'local-video' : ''}`}>
      <video ref={videoRef} autoPlay></video>
    </div>
    <p>{item.name}{item.isLocal ? "(本地)" : ""}</p>
  </div>
}

export default App;
