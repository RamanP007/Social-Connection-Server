import socketServer from "..";

socketServer.on("connection", (socket) => {
  socket.on("JOIN_ROOM", (roomId) => {
    console.log("joining a rooom", roomId);
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("join_peer_connection", (roomID, peer) => {
    socket.join(roomID);
    socket.to(roomID).emit("peer", peer);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});
