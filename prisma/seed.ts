import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.DEMO_SEED_ENABLED !== "true" || process.env.NODE_ENV === "production") {
    throw new Error("Demo seed is disabled. Set DEMO_SEED_ENABLED=true outside production to create demo users.");
  }
  const demoPassword = process.env.DEMO_ACCOUNT_PASSWORD;
  if (!demoPassword || demoPassword.length < 12) {
    throw new Error("Set DEMO_ACCOUNT_PASSWORD to a unique password of at least 12 characters.");
  }
  const password = await hash(demoPassword, 12);

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
