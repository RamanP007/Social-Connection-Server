import { UserType } from "@prisma/client";
import { UtilsService } from "../../utils/common";
import { PrismaClient } from "@prisma/client";
import { client } from "../../redis.config";
import _ from "lodash";
import SocketEmitter from "../../websocket/emitter/socketEmitter";

const prisma: PrismaClient = new PrismaClient();
const utilsService: UtilsService = new UtilsService();

type ActiveUserPayload = {
  userId: string;
  socketId: string;
};

export class UserService {
  async endSession(userId: string) {
    const _activeUsers = await client.get("ActiveUsers");
    if (_activeUsers) {
      const activeUsers = JSON.parse(_activeUsers);
      const userIndex = _.findIndex(activeUsers, [userId, userId]);
      if (userIndex !== -1) {
        const user: ActiveUserPayload = activeUsers[userIndex];
        const socketId = user.socketId;
        SocketEmitter.playerLogout(socketId);
      }
    }
  }

  async getByEmail(email: string) {
    return await prisma.user.findUniqueOrThrow({
      include: { UserMeta: true },
      where: { email: email.toLowerCase() },
    });
  }

  async getById(id: string) {
    return await prisma.user.findUniqueOrThrow({
      where: { id },
    });
  }

  async getMetaById(userId: string) {
    return await prisma.userMeta.findUniqueOrThrow({
      where: { userId },
    });
  }

  async isEmailAlreadyExist(email: string, id?: string) {
    return (
      (await prisma.user.count({
        where: {
          email: email.toLowerCase(),
          NOT: {
            id,
          },
        },
      })) !== 0
    );
  }

  async isMobileAlreadyExist(mobile: string, id?: string) {
    return (
      (await prisma.user.count({
        where: {
          mobile,
          NOT: {
            id,
          },
        },
      })) !== 0
    );
  }

  async create(
    email: string,
    password?: string,
    fullname?: string,
    mobile?: string,
    profileImage?: string,
    type?: UserType,
    googleId?: string,
    facebookId?: string
  ) {
    let passwordHash, passwordMeta;
    if (password) {
      const { salt, hash } = utilsService.hashPassword(password, 10);
      passwordHash = hash;
      passwordMeta = salt;
    }
    return await prisma.user.create({
      data: {
        email,
        fullname,
        mobile,
        profileImage,
        type,
        UserMeta: {
          create: {
            passwordHash,
            passwordMeta,
            isEmailVerified: googleId || facebookId ? true : false,
            googleId,
            facebookId,
          },
        },
      },
    });
  }

  async createOrUpdateByGoogle(
    email: string,
    googleId: string,
    fullname?: string,
    profileImage?: string
  ) {
    if (await this.isEmailAlreadyExist(email)) {
      const user = await this.getByEmail(email);
      await prisma.userMeta.update({
        data: { googleId },
        where: {
          userId: user.id,
        },
      });
      return user;
    } else {
      return await this.create(
        email,
        undefined,
        fullname,
        undefined,
        profileImage,
        UserType.User,
        googleId
      );
    }
  }

  async validateCredential(email: string, password: string) {
    const user = await this.getByEmail(email);
    if (user instanceof Error) {
      throw new Error(user.message);
    }

    const userMeta = await this.getMetaById(user.id);

    if (userMeta instanceof Error) {
      throw new Error(userMeta.message);
    }

    if (
      !utilsService.comparePassword(
        password,
        userMeta.passwordHash || "",
        userMeta.passwordMeta || ""
      )
    ) {
      throw new Error("Incorrect Password");
    }
    return user;
  }

  async getMe(id: string) {
    const user = await this.getById(id);
    return { sessionAlreadyExist: false, user };
  }

  async endUserSession(id: string) {
    const userToken = await UtilsService.getUserToken(id);
    if (userToken) {
      return await this.endSession(id);
    }
    return;
  }
}
