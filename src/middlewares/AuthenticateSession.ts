import { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { JwtAuthPayload } from "../common/types";
import { UserType } from "@prisma/client";
import { UtilsService } from "../utils/common";
import { client } from "../redis.config";
import { allLiveUsers, inSearchingStage } from "../common/utilityVars";

const verifyJWT = (token: string) => {
  return jwt.verify(
    token,
    process.env.JWT_TOKEN_SECRET as Secret
  ) as JwtAuthPayload;
};

const removeCookie = (res: Response) => {
  res.clearCookie("__userAccessToken");
  res.clearCookie("isUserLoggedIn");
  res.status(403).send({ success: false, message: "Forbidden" });
  return;
};

const AuthenticateSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const bearerHeader = req.headers["authorization"] || req.headers["cookie"];

  if (bearerHeader && typeof bearerHeader !== "undefined") {
    const bearer = req.headers["authorization"]
      ? bearerHeader.split(" ")
      : bearerHeader.split(";");

    let bearerToken = null;
    bearer.forEach((b) => {
      if (b.includes("AccessToken")) {
        bearerToken = b.split("=")[1];
      }
    });

    if (bearerToken) {
      try {
        const payload = verifyJWT(bearerToken);
        const token = await client.get(payload.id);

        if (token && token !== bearerToken) {
          return removeCookie(res);
        }
        const userToken = await UtilsService.getUserToken(payload.id);

        if (!userToken) {
          return removeCookie(res);
        }
        req[req.method === "GET" ? "query" : "body"] = {
          ...req[req.method === "GET" ? "query" : "body"],
          ...(payload as JwtAuthPayload),
          token: bearerToken,
        };
        if (
          !inSearchingStage.includes(payload.id) &&
          !allLiveUsers.includes(payload.id)
        ) {
          allLiveUsers.push(payload.id);
        }

        next();
      } catch (err) {
        return removeCookie(res);
      }
    } else {
      return removeCookie(res);
    }
  } else {
    return removeCookie(res);
  }
};

const UserAuthenticateSession = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const bearerHeader = req.headers["authorization"] || req.headers["cookie"];

  if (bearerHeader && typeof bearerHeader !== "undefined") {
    const bearer = req.headers["authorization"]
      ? bearerHeader.split(" ")
      : bearerHeader.split("=");

    const bearerToken = bearer[1];
    try {
      const payload = verifyJWT(bearerToken);

      if (payload.type === UserType.User) {
        req[req.method === "GET" ? "query" : "body"] = {
          ...req[req.method === "GET" ? "query" : "body"],
          ...(payload as JwtAuthPayload),
          token: bearerToken,
        };
        next();
      } else {
        res.status(401).send({ success: false, message: "Unauthorized" });
      }
    } catch (err) {
      res.status(403).send({ success: false, message: "Forbidden" });
      return;
    }
  } else {
    res.status(403).send({ success: false, message: "Forbidden" });
    return;
  }
};

const AdminAuthenticateSession = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const bearerHeader = req.headers["authorization"] || req.headers["cookie"];

  if (bearerHeader && typeof bearerHeader !== "undefined") {
    // const bearer = (bearerHeader as any).split("=");
    const bearer = req.headers["authorization"]
      ? bearerHeader.split(" ")
      : bearerHeader.split("=");

    const bearerToken = bearer[1];
    try {
      const payload = verifyJWT(bearerToken);

      if (payload.type === UserType.Admin) {
        req[req.method === "GET" ? "query" : "body"] = {
          ...req[req.method === "GET" ? "query" : "body"],
          ...(payload as JwtAuthPayload),
          token: bearerToken,
        };
        next();
      } else {
        res.status(401).send({ success: false, message: "Unauthorized" });
      }
    } catch (err) {
      res.status(403).send({ success: false, message: "Forbidden" });
      return;
    }
  } else {
    res.status(403).send({ success: false, message: "Forbidden" });
    return;
  }
};

export {
  AuthenticateSession,
  UserAuthenticateSession,
  AdminAuthenticateSession,
};
