import { Emitter } from "@socket.io/redis-emitter";
import { client } from "../../redis.config";
import { SOCKET_NAMESPACES, SOCKET_ROOMS } from "../../utils/constant";

const socketEmitter = new Emitter(client);

export default class SocketEmitter {
  static async playerLogout(userId: string) {
    const room = `${SOCKET_ROOMS.USER}:${userId}`;
    socketEmitter.to(room).emit("LOGOUT", "IT IS ONLY FOR YOU");
  }

  static async sessionAlreadyExist(token: string) {
    const room = `${SOCKET_ROOMS.USER}:${token}`;
    socketEmitter
      .of(SOCKET_NAMESPACES.USER)
      .to(room)
      .emit("SESSION_ALREADY_EXIST", "PLAYER_LOGOUT");
  }
}
