/* eslint-disable @typescript-eslint/no-explicit-any */
import { CookieOptions, NextFunction, Request, Response } from "express";
import { AuthPayload, AuthService } from "./authService";
import { LoginUserDTO, RegisterUserDTO } from "./dto";
import { plainToClass } from "class-transformer";
import { validate } from "../../utils/formatter";
import axios from "axios";
import { UserType } from "@prisma/client";
import { UtilsService } from "../../utils/common";

export type GoogleAuthPayload = {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
};

const authService: AuthService = new AuthService();
const utilsService: UtilsService = new UtilsService();

export default class AuthController {
  setCookie(
    res: Response,
    key: string,
    value: string,
    options?: CookieOptions
  ): void {
    res.cookie(key, value, {
      domain: utilsService.isProduction() ? options?.domain : "localhost",
      expires: options?.expires
        ? options.expires
        : new Date(Date.now() + 86400000),
      httpOnly: options?.httpOnly || false,
    });
  }
  signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const args = plainToClass(RegisterUserDTO, {
        ...req.params,
        ...req.query,
        ...req.body,
      });
      const errors: unknown = validate(args);

      if (errors instanceof Array || typeof errors === "string") {
        throw new Error(errors as any);
      } else {
        const user: AuthPayload = await authService
          .signup(args.email, args.password, args.fullname, args.mobile)
          .catch((err) => err);

        if (user instanceof Error) {
          throw new Error(user.message);
        } else {
          this.setCookie(
            res,
            `__${user.type.toLowerCase()}AccessToken`,
            user.accessToken,
            {
              httpOnly: true,
            }
          );
          this.setCookie(res, "isUserLoggedIn", "true", {
            httpOnly: false,
          });
          res.status(200).send({ success: true });
          return;
        }
      }
    } catch (error) {
      next(error);
    }
  };

  signIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const args = plainToClass(LoginUserDTO, {
        ...req.params,
        ...req.query,
        ...req.body,
      });

      const errors: unknown = validate(args);

      if (errors instanceof Array || typeof errors === "string") {
        throw new Error(errors as any);
      } else {
        const user: AuthPayload = await authService.login(
          args.email,
          args.password
        );
        this.setCookie(
          res,
          `__${user.type.toLowerCase()}AccessToken`,
          user.accessToken,
          {
            httpOnly: true,
          }
        );
        this.setCookie(res, "isUserLoggedIn", "true", {
          httpOnly: false,
        });
        res.status(200).send({ success: true });

        return;
      }
    } catch (error) {
      next(error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async googleAuth(req: Request, res: Response, next: NextFunction) {
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=profile email`;
    res.redirect(url);
  }

  async googleLogin(req: Request, res: Response, next: NextFunction) {
    const { code } = req.query;

    try {
      // Exchange authorization code for access token
      const { data: _data } = await axios.post(
        "https://oauth2.googleapis.com/token",
        {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code,
          redirect_uri: process.env.REDIRECT_URI,
          grant_type: "authorization_code",
        }
      );

      const { access_token } = _data;

      // Use access_token or id_token to fetch user profile
      const { data } = await axios.get(
        "https://www.googleapis.com/oauth2/v1/userinfo",
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      const profile = data as GoogleAuthPayload;

      const user: AuthPayload = await authService
        .signup(
          profile.email,
          undefined,
          profile.name,
          undefined,
          profile.picture,
          UserType.User,
          profile.id
        )
        .catch((err) => err);

      if (user instanceof Error) {
        throw new Error(user.message);
      } else {
        this.setCookie(
          res,
          `__${user.type.toLowerCase()}AccessToken`,
          user.accessToken,
          {
            httpOnly: true,
          }
        );
        this.setCookie(res, "isUserLoggedIn", "true", {
          httpOnly: false,
        });
        res.status(200).send({ success: true });

        return;
      }
    } catch (error) {
      next(error);
    }
  }
}
