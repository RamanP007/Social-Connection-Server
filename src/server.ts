import express, { Application } from "express";
import cors from "cors";
import RequestHandler from "./api";
import "reflect-metadata";
import "es6-shim";
import listEndpoints from "express-list-endpoints";
import "./db.config";
import { globalErrorHandler } from "./middlewares/Error";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import socketServer from "./websocket";

const app: Application = express();

const CorsOptions = {
  credentials: true,
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type"],
};
app.use(cors(CorsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

RequestHandler(app);
app.use(globalErrorHandler);
console.log(listEndpoints(app as express.Express));

const httpServer = createServer(app);
socketServer.attach(httpServer);

httpServer.listen(process.env.PORT || 9001, () => {
  console.log(`🚀️ Server is running on port ${process.env.PORT || 9001}`);
});
