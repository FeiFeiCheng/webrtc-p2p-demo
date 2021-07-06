import React, { useEffect, useState, useRef } from 'react';
import Chat from "./Chat";
import Login from "./Login";
import './App.css';

function App() {
  const [isInMeeting, setIsInMeeting] = useState(false);
  const nickNameRef = useRef(null);

  useEffect(() => {
    const getLocalMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        const oLocalVideo: HTMLVideoElement | null | undefined = document.getElementById("local")?.querySelector('video');

        if (oLocalVideo) {
          oLocalVideo.srcObject = stream
        }
      } catch (err) {
        console.log("get local media error:", err);
      }
    }

    isInMeeting && getLocalMedia();
  }, [isInMeeting]);

  const onJoinMeeting = () => {
    setIsInMeeting(true);
  }

  return (
    <>
      {!isInMeeting ?
        <Login />
        :
        <>
          <div className="meeting">
            <div id="local" className="local">
              <div className="video">
                <video autoPlay></video>
              </div>
              <p>本地</p>
            </div>

            <div className="remote-container">
              <div id="remote" className="remote">
                <div className="video">
                  <video autoPlay></video>
                </div>
                <p>远端</p>
              </div>
            </div>
          </div>
          <Chat />
        </>}
    </>
  );
}

export default App;
