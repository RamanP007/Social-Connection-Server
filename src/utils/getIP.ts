import { Request } from "express";

const getIP = (req: Request): string => {
  const forwardedIpsStr = req.header("x-forwarded-for");

  if (forwardedIpsStr) {
    const forwardedIps = forwardedIpsStr.split(",");
    return forwardedIps[0];
  }

  return req.socket.remoteAddress ? req.socket.remoteAddress : "";
};

export default getIP;
