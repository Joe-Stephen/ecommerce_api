export const socketConnection = async (io: any) => {
  // setting up web socket connection
  // Handle incoming connections
  io.on("connection", (socket: any) => {
    console.log("Server 1: new web socket connection");
    console.log("Connection id :", socket.id);
    socket.emit("message", "Welcome to Server 1.");
    socket.emit(
      "message",
      "Your web socket connection with Server 1 is now active."
    );
    socket.on("message", (message: any) => {
      console.log("Server 1 received message:", message);
    });
    socket.on("disconnect", () => {
      console.log("Server 1: web socket connection closed");
    });
    socket.on("close", () => {
      console.log("Server 1 is closing the web socket connection");
      socket.emit(
        "message",
        "Your web socket connection with Server 1 is closing."
      );
      socket.disconnect(true);
    });
  });
};
