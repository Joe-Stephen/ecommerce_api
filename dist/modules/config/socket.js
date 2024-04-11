"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketConnection = void 0;
const socketConnection = (io) => __awaiter(void 0, void 0, void 0, function* () {
    // setting up web socket connection
    // Handle incoming connections
    io.on("connection", (socket) => {
        console.log("Server 1: new web socket connection");
        console.log("Connection id :", socket.id);
        socket.emit("message", "Welcome to Server 1.");
        socket.emit("message", "Your web socket connection with Server 1 is now active.");
        socket.on("message", (message) => {
            console.log("Server 1 received message:", message);
        });
        socket.on("disconnect", () => {
            console.log("Server 1: web socket connection closed");
        });
        socket.on("close", () => {
            console.log("Server 1 is closing the web socket connection");
            socket.emit("message", "Your web socket connection with Server 1 is closing.");
            socket.disconnect(true);
        });
    });
});
exports.socketConnection = socketConnection;
