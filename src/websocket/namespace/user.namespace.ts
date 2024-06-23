import jwt, { Secret } from "jsonwebtoken";
import { SOCKET_NAMESPACES, SOCKET_ROOMS } from "../../utils/constant";
import { JwtAuthPayload } from "../../common/dto";
import { PrismaClient } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
/**
 *
 *
 * @export
 * @param {import('socket.io').Server} io
 */
const prisma: PrismaClient = new PrismaClient();
export default function (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>
) {
  const namespace = io.of(SOCKET_NAMESPACES.USER);

  // namespace.use(authenticationSocketNamespaceMiddleWare)
  const operator = {
    userId: "",
  };
  namespace.use(async (socket, next) => {
    try {
      const accessToken = socket?.handshake?.headers?.cookie
        ?.split("__userAccessToken=")[1]
        ?.split(";")[0];

      if (!accessToken) {
        return next(new Error("TokenRequiredErrorType"));
      }
      const payload = jwt.verify(
        accessToken,
        process.env.JWT_TOKEN_SECRET as Secret
      ) as JwtAuthPayload;

      const user = await prisma.user.findUnique({
        where: {
          id: payload.id,
        },
      });
      if (!user) {
        return next(new Error("UserNotExistsErrorType"));
      }

      operator.userId = payload.id;

      next();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      return next(err);
    }
  });
  namespace.on(
    "connection",
    (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap>) => {
      socket.join(SOCKET_ROOMS.USER + ":" + operator.userId);
      const accessToken = socket?.handshake?.headers?.cookie
        ?.split("__userAccessToken=")[1]
        ?.split(";")[0];
      if (accessToken) {
        socket.join(SOCKET_ROOMS.USER + ":" + accessToken);
      }
    }
  );
}
