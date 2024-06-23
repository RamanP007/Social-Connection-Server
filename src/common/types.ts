import { UserType } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";

export interface JwtAuthPayload extends JwtPayload {
  id: string;
  type: UserType;
  token: string;
}

export type UsersQueuePayload = {
  id: string;
  socketId: string;
};

export enum Environment {
  DEVELOPMENT = "development",
  PRODUCTION = "production",
}
