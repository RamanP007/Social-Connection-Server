import { createAdapter } from "@socket.io/redis-adapter";
import { Server } from "socket.io";
import { pubClient, subClient } from "../redis.config";
import namespaces from "./namespace";

const socketServer = new Server();
socketServer.on("new_namespace", (namespace) => {
  namespace.use((socket, next) => {
    socket.on("error", (error) => {
      console.log("error", error);
    });

    next();
  });
});

socketServer.adapter(createAdapter(pubClient, subClient));
namespaces(socketServer);

export default socketServer;
