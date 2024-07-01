import { DefaultEventsMap } from "socket.io/dist/typed-events";
import userNamespace from "./user.namespace";
import { Server } from "socket.io";

export default function (io: Server<DefaultEventsMap>) {
  io.on("connection", (socket) => {
    socket.on("JOIN_ROOM", (roomId) => {
      console.log("joining a rooom", roomId);
      socket.join(roomId);
      socket.broadcast.to(roomId).emit("user-joined", socket.id);
    });
  });
  userNamespace(io);
}
