// import { Server } from "socket.io";
// import { DefaultEventsMap } from "socket.io/dist/typed-events";
// import { UtilsService } from "../../utils/common";
// import { UsersQueuePayload } from "../../common/types";
// import _ from "lodash";
// import { SOCKET_ROOMS } from "../../utils/constant";
// import SocketEmitter from "../emitter/socketEmitter";

// const utilsService: UtilsService = new UtilsService();

// type UserPayload = {
//   id: string;
//   fullname: string;
//   email: string;
// };

// export const SocialConnection = (
//   io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>,
//   usersQueue: UsersQueuePayload[]
// ) => {
//   io.on("connection", (socket) => {
//     console.log("a user connected", socket.id);
//     socket.on("user", async (user: UserPayload) => {
//       // socket.join(`${SOCKET_ROOMS.USER}-${user.id}`);
//       // console.log("rommmsdfsd", socket.rooms);
//       // await SocketEmitter.playerLogout(user.id);
//       const indexOfUser = _.findIndex(usersQueue, { id: user.id });
//       if (indexOfUser > -1) {
//         usersQueue[indexOfUser].socketId = socket.id;
//       } else {
//         usersQueue.push({
//           id: user.id,
//           socketId: socket.id,
//         });
//       }
//     });

//     socket.on("chat message", (msg) => {
//       console.log("message: " + msg);
//       socket.broadcast.emit("chat message", msg);
//     });

//     socket.on("disconnect", (reason) => {
//       console.log("reason", reason, usersQueue);
//     });

//     socket.on("session-already-exist", async (userId) => {
//       const userToken = await UtilsService.getUserToken(userId);
//       console.log("userToken", userToken, socket.id);
//     });
//   });
// };
