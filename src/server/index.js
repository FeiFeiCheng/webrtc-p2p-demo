const WebSocket = require("ws");

const wsServer = new WebSocket.Server({
  port: 8020,
});

let clientMap = {};

const getUserList = (clientMap) => {
  let userList = [];

  for (let key in clientMap) {
    let user = clientMap[key];

    userList.push({
      userId: user.id,
      name: user.name,
      loginTime: user.loginTime,
    });
  }
  return userList;
};

const broadcast = (data, local) => {
  wsServer.clients.forEach((client) => {
    if (client !== local && client.readyState === WebSocket.OPEN) {
      client.sendData(data);
    }
  });
};

let msgHandler = {
  call(data, client) {
    const { name } = data;
    let userId = new Date().valueOf();

    clientMap[userId] = {
      id: userId,
      name,
      loginTime: Date.now(),
      client: client,
    };

    if (Object.keys(clientMap).length > 2) {
      client.sendData({
        type: "disconnected",
        data: {
          code: "1001",
        },
      });
    } else {
      client.sendData({
        type: "connected",
        data: {
          name,
          userId,
        },
      });

      broadcast(
        {
          type: "userList",
          data: getUserList(clientMap),
        },
        true
      );
    }
  },

  leave(data, client) {
    const { userId } = data;

    if (clientMap[userId]) {
      console.log(`${userId} is leaving......`);

      clientMap[userId].client.terminate();

      delete clientMap[userId];
    }

    broadcast({
      type: "userList",
      data: getUserList(clientMap),
    });
  },

  candidate(data, client) {
    broadcast(
      {
        type: "candidate",
        data: {
          candidate: data.candidate,
        },
      },
      client
    );
  },

  offer(data, client) {
    broadcast(
      {
        type: "offer",
        data,
      },
      client
    );
  },
  answer(data, client) {
    broadcast(
      {
        type: "answer",
        data,
      },
      client
    );
  },
};

function noop() {}

function heartbeat() {
  this.isAlive = true;
}

const interval = setInterval(function ping() {
  wsServer.clients.forEach(function each(ws) {
    if (ws.isAlive === false) return ws.terminate();

    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);

wsServer.on("connection", (client, request) => {
  client.isAlive = true;
  client.on("pong", heartbeat);

  client.sendData = (data) => {
    client.send(JSON.stringify(data));
  };

  client.on("message", (msg) => {
    let data = null;

    try {
      data = JSON.parse(msg);
    } catch (e) {
      console.error(e);
      return;
    }

    if (typeof msgHandler[data.type] === "function") {
      try {
        msgHandler[data.type](data.data, client);
      } catch (e) {
        console.error(e);
      }
    } else {
      return;
    }
  });

  client.on("close", () => {
    clearInterval(interval);
  });
});
