"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = void 0;
const express_1 = __importDefault(require("express"));
const userRouter_1 = __importDefault(require("./modules/router/userRouter"));
const adminRouter_1 = __importDefault(require("./modules/router/adminRouter"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
//cluster imports
const cluster_1 = __importDefault(require("cluster"));
const os = require("os");
const numCPUs = os.cpus().length;
require("./modules/services/passport");
//swagger imports
const swaggerUi = require("swagger-ui-express");
const swagger_output_json_1 = __importDefault(require("./swagger-output.json"));
//importing websocket modules
const socket_io_1 = require("socket.io");
const dbRelations_1 = require("./modules/config/dbRelations");
const socket_1 = require("./modules/config/socket");
dotenv_1.default.config();
const PORT = 3000 || process.env.PORT;
//clustering
if (cluster_1.default.isMaster) {
    console.log(`Master process ${process.pid} is running`);
    for (let i = 0; i < numCPUs; i++) {
        cluster_1.default.fork();
    }
    cluster_1.default.on("exit", (worker, code, signal) => {
        console.log(`Worker process ${worker.process.pid} died. Restarting...`);
        cluster_1.default.fork();
    });
}
else {
    const app = (0, express_1.default)();
    //using middlewares
    app.use((0, express_session_1.default)({
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false },
    }));
    app.use(express_1.default.json());
    app.use((0, cors_1.default)());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    //hooking morganBody with express app
    // morganBody(app);
    // setting routers
    app.use("/", userRouter_1.default);
    app.use("/admin", adminRouter_1.default);
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swagger_output_json_1.default));
    //setting up server connection
    exports.server = app.listen(PORT, () => {
        console.log(`Ecommerce Server is running on http://localhost:${PORT}`);
    });
}
(0, dbRelations_1.syncAndConnectDB)();
exports.io = new socket_io_1.Server(exports.server);
(0, socket_1.socketConnection)(exports.io);
// setting up web socket connection
// Handle incoming connections
// io.on("connection", (socket) => {
//   console.log("Server 1: new web socket connection");
//   console.log("Connection id :", socket.id);
//   socket.emit("message", "Welcome to Server 1.");
//   socket.emit(
//     "message",
//     "Your web socket connection with Server 1 is now active."
//   );
//   socket.on("message", (message) => {
//     console.log("Server 1 received message:", message);
//   });
//   socket.on("disconnect", () => {
//     console.log("Server 1: web socket connection closed");
//   });
//   socket.on("close", () => {
//     console.log("Server 1 is closing the web socket connection");
//     socket.emit(
//       "message",
//       "Your web socket connection with Server 1 is closing."
//     );
//     socket.disconnect(true);
//   });
// });
