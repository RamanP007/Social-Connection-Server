import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

(async () => {
  prisma
    .$connect()
    .then(() => {
      console.log("🛸 Database Connected Successfully");
    })
    .catch((err: Error) => {
      console.error(`Database connection error: ${err}`);
    });
})();
