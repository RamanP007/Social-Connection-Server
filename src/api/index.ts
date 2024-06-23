import { Application } from "express";
import UserRouter from "./User/routes";
import AuthRouter from "./Auth/routes";

/**
 * RequestHandler extends app to handle routes using specific express router
 *
 * @param app Application
 * @returns void
 */
const RequestHandler = (app: Application): void => {
  app.use("/user", UserRouter);
  app.use("/auth", AuthRouter);
};

export default RequestHandler;
