import { UserType } from "@prisma/client";
import { UtilsService } from "../../utils/common";
import { PrismaClient } from "@prisma/client";
import { client } from "../../redis.config";
import _ from "lodash";
import SocketEmitter from "../../websocket/emitter/socketEmitter";
import { allLiveUsers, inSearchingStage } from "../../common/utilityVars";

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
    allLiveUsers.push(user.id);
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

  getKeysWithoutBlacklist = async (): Promise<string[]> => {
    const pattern = "*";
    const blacklistPattern = "blacklist";
    let cursor = "0";
    const keys: string[] = [];

    do {
      const reply: [string, string[]] = await new Promise((resolve, reject) => {
        client.scan(cursor, "MATCH", pattern, "COUNT", 100, (err, res) => {
          if (err) {
            return reject(err);
          }
          resolve(res as [string, string[]]);
        });
      });

      cursor = reply[0];
      const foundKeys = reply[1].filter(
        (key) => !key.includes(blacklistPattern)
      );
      keys.push(...foundKeys);
    } while (cursor !== "0");

    return keys;
  };

  async acceptTermsAndConditions(id: string) {
    //TODO: add record of accepting
    const indexOfUser = _.indexOf(allLiveUsers, id);
    if (indexOfUser !== -1) {
      allLiveUsers.splice(indexOfUser, 1);
    }
    if (!inSearchingStage.includes(id)) {
      inSearchingStage.push(id);
    }
    // const getAllLiveUsers = await this.getKeysWithoutBlacklist();
    // console.log("getAllLiveUsers", getAllLiveUsers);

    //TODO: Matching two people and join room

    console.log("inSearchingStageinSearchingStage", inSearchingStage);

    let roomPartnerId = null;
    if (inSearchingStage.length > 1) {
      while (roomPartnerId === id || roomPartnerId === null) {
        const shuffledSearchingStage = _.shuffle(inSearchingStage);

        if (shuffledSearchingStage.length) {
          roomPartnerId =
            shuffledSearchingStage[shuffledSearchingStage.length - 1];
        }
      }

      if (roomPartnerId) {
        SocketEmitter.publishRoomIdToUsers(id, roomPartnerId);
      }
      return;
    } else {
      // SocketEmitter.publishRoomIdToUsers(id, id);
      return;
    }
  }
}
