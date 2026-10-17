import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();
const demoPassword = "Demo1234!";

async function main() {
  const password = await hash(demoPassword, 10);

  await prisma.user.upsert({
    where: { email: "admin@muranga.go.ke" },
    update: {
      name: "System Administrator",
      password,
      role: "ADMIN",
    },
    create: {
      email: "admin@muranga.go.ke",
      name: "System Administrator",
      password,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "citizen@muranga.go.ke" },
    update: {
      name: "Jane Wanjiku",
      password,
      role: "CITIZEN",
    },
    create: {
      email: "citizen@muranga.go.ke",
      name: "Jane Wanjiku",
      password,
      role: "CITIZEN",
    },
  });

  console.log("Demo administrator and citizen accounts are ready.");
}

main()
  .catch((error: unknown) => {
    console.error("Database seeding failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
