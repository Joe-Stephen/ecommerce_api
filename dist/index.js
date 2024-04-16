"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const express_session_1 = __importDefault(require("express-session"));
//clustering imports
const cluster_1 = __importDefault(require("cluster"));
const os_1 = __importDefault(require("os"));
//passport-service imports
require("./modules/services/passport");
//swagger imports
const swaggerUi = require("swagger-ui-express");
const swagger_output_json_1 = __importDefault(require("./swagger-output.json"));
//socket imports
const socket_io_1 = require("socket.io");
const socket_1 = require("./modules/config/socket");
//db config imports
const dbRelations_1 = require("./modules/config/dbRelations");
//router imports
const userRouter_1 = __importDefault(require("./modules/router/userRouter"));
const adminRouter_1 = __importDefault(require("./modules/router/adminRouter"));
//setting up cluster-module
const numCPUs = os_1.default.cpus().length;
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
    //creating express app
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
    // setting default-routers
    app.use("/", userRouter_1.default);
    app.use("/admin", adminRouter_1.default);
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swagger_output_json_1.default));
    //setting up server connection
    exports.server = app.listen(PORT, () => {
        console.log(`Ecommerce Server is running on http://localhost:${PORT}`);
    });
}
//syncing and connecting DB
(0, dbRelations_1.syncAndConnectDB)();
//instantiating and exporting socket-io connecion
exports.io = new socket_io_1.Server(exports.server);
(0, socket_1.socketConnection)(exports.io);
