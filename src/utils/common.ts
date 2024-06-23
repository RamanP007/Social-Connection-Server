import * as crypto from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { Environment } from "../common/types";
import { client } from "../redis.config";

export class UtilsService {
  generateSalt = (length?: number) => {
    return crypto.randomBytes(length || 10).toString("hex");
  };

  generateHash = (salt: string, password: string, length?: number) => {
    return crypto.scryptSync(password, salt, length || 10).toString("hex");
  };

  hashPassword = (password: string, length?: number) => {
    const salt = this.generateSalt(length);
    const hash = this.generateHash(salt, password, length);
    return { salt, hash };
  };

  comparePassword = (
    password: string,
    passwordHash: string,
    passwordSalt: string
  ) => {
    const hash = this.generateHash(passwordSalt, password);

    if (hash === passwordHash) {
      return true;
    } else {
      return false;
    }
  };

  generateRandomUuid = () => {
    return uuidv4();
  };

  isProduction = () => {
    return process.env.ENVIRONMENT === Environment.PRODUCTION;
  };

  static getUserToken = async (userId: string) => {
    const token = await client.get(userId);
    return token ? true : false;
  };
}
