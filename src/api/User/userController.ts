import { plainToClass } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import { JwtAuthPayload } from "../../common/dto";
import { client } from "../../redis.config";
import dayjs from "dayjs";
import _ from "lodash";
import { UserService } from "./userService";
import { allLiveUsers } from "../../common/utilityVars";

type BlacklistTokenPayload = {
  token: string;
  setTime: number;
};

const usersService: UserService = new UserService();

export default class UserController {
  blacklistToken = async (userId: string, token: string) => {
    const alreadyBlackListedToken = await client.get(`blacklist_${userId}`);
    const currentUnix = dayjs().unix();

    const blacklistTokenData = { token, setTime: currentUnix };

    if (alreadyBlackListedToken) {
      const _alreadyBlackListedToken: BlacklistTokenPayload[] = JSON.parse(
        alreadyBlackListedToken
      );

      if (_alreadyBlackListedToken.length) {
        const index = _.findIndex(_alreadyBlackListedToken, { token });

        if (index !== -1) {
          throw new Error("Forbidden");
        }

        const lastBlacklistTokenData =
          _alreadyBlackListedToken[_alreadyBlackListedToken.length - 1];

        if (dayjs().unix() - lastBlacklistTokenData.setTime > 24 * 60 * 60) {
          return await client.set(
            `blacklist_${userId}`,
            JSON.stringify([blacklistTokenData])
          );
        } else {
          const newBlacklistTokenData = [
            ..._alreadyBlackListedToken,
            blacklistTokenData,
          ];
          return await client.set(
            `blacklist_${userId}`,
            JSON.stringify(newBlacklistTokenData)
          );
        }
      }
    } else {
      return await client.set(
        `blacklist_${userId}`,
        JSON.stringify([blacklistTokenData])
      );
    }
  };

  removeActiveToken = async (userId: string) => {
    return await client.del(userId);
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const args = plainToClass(JwtAuthPayload, { ...req.body });
      await this.blacklistToken(args.id, args.token);
      await this.removeActiveToken(args.id);
      const indexOfUser = _.indexOf(allLiveUsers, args.id);
      if (indexOfUser !== -1) {
        allLiveUsers.splice(indexOfUser, 1);
      }
      res.clearCookie(`__${args.type.toLowerCase()}AccessToken`);
      res.clearCookie("isUserLoggedIn");
      res.send({ success: true });
    } catch (error) {
      next(error);
    }
  };

  profile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const args = plainToClass(JwtAuthPayload, { ...req.query });
      const user = await usersService.getMe(args.id);
      if (user.sessionAlreadyExist) {
        res.status(409).send(args.id);
      } else {
        res.send({ success: true, data: user.user });
      }
    } catch (error) {
      next(error);
    }
  };

  endUserSession = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const args = plainToClass(JwtAuthPayload, { ...req.query });
      await usersService.endUserSession(args.id);
      res.send({ success: true });
    } catch (error) {
      next(error);
    }
  };

  acceptTermsAndConditions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const args = plainToClass(JwtAuthPayload, { ...req.body });
      await usersService.acceptTermsAndConditions(args.id);
      res.send({ success: true });
    } catch (error) {
      next(error);
    }
  };
}
