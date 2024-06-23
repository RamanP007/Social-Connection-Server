import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User, UserType } from "@prisma/client";
import { UserService } from "../User";
import * as ErrorResponse from "../../responses";
import { client } from "../../redis.config";
import SocketEmitter from "../../websocket/emitter/socketEmitter";
const usersService: UserService = new UserService();

export type JwtPayload = {
  id: string;
  type: string;
};

export type AuthPayload = {
  accessToken: string;
  type: string;
};

export class AuthService {
  generateSalt(length = 16): string {
    return crypto.randomBytes(length).toString("hex");
  }

  hashPassword(data: string, salt: string, length: number): string {
    return crypto.scryptSync(data, salt, length).toString("hex");
  }

  generateJwt(payload: JwtPayload) {
    return jwt.sign(payload, process.env.JWT_TOKEN_SECRET || "", {
      expiresIn: "2 days",
    });
  }

  async registerToken(userId: string, token: string) {
    return await client.set(userId, token);
  }

  async signup(
    email: string,
    password?: string,
    fullname?: string,
    mobile?: string,
    profileImage?: string,
    type?: UserType,
    googleId?: string,
    facebookId?: string
  ) {
    const isEmailAlreadyExist = await usersService.isEmailAlreadyExist(email);
    if (!googleId && !facebookId) {
      if (isEmailAlreadyExist) {
        throw new Error(ErrorResponse.default.MSG020);
      }
    }

    if (mobile && (await usersService.isMobileAlreadyExist(mobile))) {
      throw new Error(ErrorResponse.default.MSG021);
    }

    let user: User;
    if (googleId) {
      user = await usersService.createOrUpdateByGoogle(
        email,
        googleId,
        fullname,
        profileImage
      );
    } else {
      user = await usersService.create(
        email,
        password,
        fullname,
        mobile,
        profileImage,
        type,
        googleId,
        facebookId
      );
    }

    if (user instanceof Error) throw new Error(user.message);
    const accessToken = this.generateJwt({ id: user.id, type: user.type });
    await this.registerToken(user.id, accessToken);
    return {
      accessToken,
      type: user.type,
    };
  }

  async login(email: string, password: string): Promise<AuthPayload | any> {
    try {
      const user = await usersService.validateCredential(email, password);

      if (user instanceof Error) throw new Error(user.message);

      const accessToken = this.generateJwt({ id: user.id, type: user.type });
      const token = await client.get(user.id);

      if (token) {
        SocketEmitter.sessionAlreadyExist(token);
      }
      await this.registerToken(user.id, accessToken);

      return {
        accessToken,
        type: user.type,
      };
    } catch (error: any) {
      throw new Error(error);
    }
  }
}
