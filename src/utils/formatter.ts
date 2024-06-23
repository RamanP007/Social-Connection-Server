import { plainToInstance } from "class-transformer";
import { ValidationError, validateSync } from "class-validator";
import { Request } from "express";

export const GetRequestArgsAndCtx = <T>(
  req: Request,
  cls: new (...args: any) => T
) => {
  return [plainToInstance(cls, { ...req.params, ...req.query, ...req.body })];
};

export const validate = (dataObject: object) => {
  const errors = validateSync(dataObject, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    return errors
      .map((error) => Object.values(error?.constraints || {}))
      .join("\n");
  }
};
