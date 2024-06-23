import { DefaultEventsMap } from "socket.io/dist/typed-events";
import userNamespace from "./user.namespace";
import { Server } from "socket.io";

export default function (io: Server<DefaultEventsMap>) {
  userNamespace(io);
}
