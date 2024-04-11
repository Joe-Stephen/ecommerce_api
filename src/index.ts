import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import morganBody from "morgan-body";
import passport from "passport";
import session from "express-session";

//clustering imports
import cluster from "cluster";
import os from "os";

//passport-service imports
require("./modules/services/passport");

//swagger imports
const swaggerUi = require("swagger-ui-express");
import swaggerOutput from "./swagger-output.json";

//socket imports
import { Server } from "socket.io";
import { socketConnection } from "./modules/config/socket";

//db config imports
import { syncAndConnectDB } from "./modules/config/dbRelations";

//router imports
import userRouter from "./modules/router/userRouter";
import adminRouter from "./modules/router/adminRouter";

//setting up cluster-module
const numCPUs = os.cpus().length;

dotenv.config();

const PORT = 3000 || process.env.PORT;
export let server!: any;
//clustering
if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker process ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  //creating express app
  const app: Application = express();
  //using middlewares
  app.use(
    session({
      secret: process.env.JWT_SECRET as string,
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false },
    })
  );
  app.use(express.json());
  app.use(cors());
  app.use(express.urlencoded({ extended: true }));
  app.use(passport.initialize());
  app.use(passport.session());
  //hooking morganBody with express app
  morganBody(app);
  // setting default-routers
  app.use("/", userRouter);
  app.use("/admin", adminRouter);
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerOutput));
  //setting up server connection
  server = app.listen(PORT, () => {
    console.log(`Ecommerce Server is running on http://localhost:${PORT}`);
  });
}

//syncing and connecting DB
syncAndConnectDB();

//instantiating and exporting socket-io connecion
export const io = new Server(server);
socketConnection(io);
