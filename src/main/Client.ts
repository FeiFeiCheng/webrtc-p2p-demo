import Emmitter from "../tools/emmitter";
import { ILayout } from "../types/index";
import { DEFAULT_CONFIGURATION } from "../enum/index";

class Client extends Emmitter {
  public socket: WebSocket | null;
  public peer: RTCPeerConnection | null;
  public localUser: ILayout;
  public layout: Map<string, ILayout>;
  public dataChannel: RTCDataChannel | null | undefined;

  constructor(userName: string) {
    super();

    this.socket = null;
    this.peer = null;
    this.dataChannel = null;
    this.localUser = {
      name: userName,
      isLocal: true,
      stream: null,
      userId: "",
    };
    this.layout = new Map();
  }

  // 加入会议
  join() {
    this.createWs();
  }

  // 第一步: 采集本地音视频
  async createLocalStream() {
    try {
      const constraints = { audio: false, video: true };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      this.localUser.stream = stream;

      const localLayout = this.layout.get(this.localUser.userId);

      if (localLayout) {
        localLayout["stream"] = stream;
      } else {
        this.layout.set(this.localUser.userId, {
          userId: this.localUser.userId,
          name: this.localUser.name,
          isLocal: true,
          stream,
        });
      }

      this.emmitLayout();
    } catch (err) {
      console.log("get local media error:", err);
    }
  }
  // 创建ws
  createWs() {
    this.closeSocket();

    this.socket = new WebSocket("ws://localhost:8020");

    this.socket.addEventListener("open", () => {
      console.log("ws 链接成功！");

      this.send({
        type: "call",
        data: {
          name: this.localUser.name,
        },
      });
    });

    this.socket.addEventListener("message", async (e: any) => {
      const result = e.data;

      if (result) {
        const message = JSON.parse(result);

        const data = message.data;

        try {
          switch (message.type) {
            case "connected": {
              const { userId } = data;

              this.localUser.userId = userId;
              break;
            }
            case "userList": {
              const userList = data;

              const listLen = userList.length;

              if (userList[listLen - 1]["userId"] === this.localUser.userId) {
                await this.createLocalStream();

                // 新入会的人需要给会中其他人创建peer连接，发从offer
                this.createPeerConnection();

                if (listLen !== 1) {
                  // 第二步：创建offer， 给对等端发送本地offer
                  this.sendOffer();
                }
              } else {
                this.createPeerConnection();
              }

              for (let i = 0; i < userList.length; i++) {
                const item = userList[i];

                item["local"] = item.userId === this.localUser.userId;

                if (!this.layout.get(item.userId)) {
                  this.layout.set(item.userId, item);
                }
              }
              break;
            }
            case "offer": {
              // 第三步 - 1 进行应答，收到远端offer，setRemoteDescription
              await this.peer?.setRemoteDescription(data);

              // 第三步 - 2 创建answer
              const answer = await this.peer?.createAnswer();

              await this.peer?.setLocalDescription(answer);

              this.send({
                type: "answer",
                data: this.peer?.localDescription,
              });
              break;
            }
            case "answer": {
              // 第四步： 设置对等方的连接信息
              await this.peer?.setRemoteDescription(data);

              break;
            }
            case "candidate": {
              // 第五步： 添加对方打洞的ip:port
              this.peer?.addIceCandidate(data.candidate);
              break;
            }
            case "disconnected": {
              this.emmit("leave", "暂只支持两个人入会");

              break;
            }
          }
        } catch (err) {
          console.log("err:", err);
        }
      }
    });

    this.socket.addEventListener("error", (e: any) => {
      this.closeSocket();
    });

    this.socket.addEventListener("close", (e: any) => {
      this.emmit("leave", "ws连接已断开");
      this.closeSocket();
    });
  }

  // 创建peer, 每两个端有一个peer链接
  createPeerConnection() {
    this.peer = new RTCPeerConnection(DEFAULT_CONFIGURATION);

    this.addStreams();

    this.createDataChannel();

    // 监听本地的ICE候选信息 发送给对等方
    this.peer.onicecandidate = (e: RTCPeerConnectionIceEvent) => {
      if (!e.candidate) {
        return;
      }

      this.send({
        type: "candidate",
        data: {
          candidate: e.candidate,
        },
      });
    };

    // 第六步 播放对方的多媒体流
    this.peer.ontrack = (e: RTCTrackEvent) => {
      const stream = e.streams[0] || {};

      this.layout.forEach((item) => {
        if (item.userId !== this.localUser.userId) {
          const localLayout = this.layout.get(item.userId);
          if (localLayout) {
            localLayout["stream"] = stream;
          }
        }
      });

      this.emmitLayout();
    };

    // ondatachannel
    this.peer.ondatachannel = () => {};

    this.peer.oniceconnectionstatechange = (e: Event) => {
      console.log(
        "peer connection:",
        (e?.target as RTCPeerConnection)?.iceConnectionState
      );
    };
  }

  // 发送本地offer
  async sendOffer() {
    try {
      if (this.peer) {
        const offer: RTCSessionDescriptionInit = await this.peer?.createOffer();

        await this.peer.setLocalDescription(offer);

        this.send({
          type: "offer",
          data: this.peer.localDescription,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  // 将本地stream添加到轨道集，该轨道就会被传输到另一对等方
  addStreams() {
    this.localUser.stream?.getTracks().forEach((track: MediaStreamTrack) => {
      this.peer?.addTrack(track, this.localUser.stream!);
    });

    // this.localUser.stream.getTracks().forEach((track: MediaStreamTrack) => {
    //   this.peer?.addTransceiver(track, {
    //     direction: "sendrecv",
    //     streams: [this.localUser.stream],
    //   });
    // });
  }

  // 聊天
  chat(text: string) {
    if (this.dataChannel?.readyState === "open") {
      this.dataChannel?.send(text);
    }
  }

  // 创建数据通道
  createDataChannel() {
    // 建立通道
    this.dataChannel = this.peer?.createDataChannel("chat", {
      negotiated: true,
      id: 0,
    });

    if (this.dataChannel) {
      this.dataChannel.onmessage = (e) => {
        this.emmit("message", {
          user: {
            userId: this.localUser.userId,
            name: this.localUser.name,
          },
          text: e.data,
        });

        console.log("Got Data Channel Message:", e.data);
      };

      this.dataChannel.onopen = () => {
        console.log("The Data Channle is open");
      };

      this.dataChannel.onclose = () => {
        console.log("The Data Channel is Closed");
      };

      this.dataChannel.onerror = (error) => {
        console.log("Data Channel Error:", error);
      };
    }
  }

  emmitLayout() {
    const list: ILayout[] = [];

    this.layout?.forEach((item) => {
      list.push(item);
    });

    this.emmit("layout", list);
  }

  send(data: any) {
    if (this.socket?.readyState === 1) {
      this.socket.send(JSON.stringify(data));
    }
  }

  closeSocket() {
    this.socket?.close();
    this.socket = null;
  }

  close() {
    this.localUser.stream?.getTracks().forEach((track) => {
      track.stop();
    });

    this.send({
      type: "leave",
      data: {
        userId: this.localUser.userId,
      },
    });

    this.closeSocket();

    if (this.peer) {
      this.peer.close();
      this.peer.onicecandidate = null;
      this.peer.ontrack = null;
    }
  }
}

export default Client;
