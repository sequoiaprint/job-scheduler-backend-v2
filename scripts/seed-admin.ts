import { z } from "zod";
import { prisma } from "../src/config/prisma.config.js";
import { register } from "../src/features/auth/services/auth.service.js";
import { AppError } from "../src/utils/app-error.utils.js";

// Creates the first user from ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD in .env.
// Safe to run again: if the user already exists nothing changes.
// Usage: npm run seed:admin

const AdminSchema = z.object({
  ADMIN_USERNAME: z.string().trim().min(3),
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(8),
});

const main = async () => {
  const admin = AdminSchema.parse(process.env);
  try {
    const user = await register({
      username: admin.ADMIN_USERNAME,
      email: admin.ADMIN_EMAIL,
      password: admin.ADMIN_PASSWORD,
    });
    console.log(`Created admin user "${user.username}" (${user.email}).`);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 409) {
      console.log(`Admin user "${admin.ADMIN_USERNAME}" (or its email) already exists; nothing to do.`);
      return;
    }
    throw error;
  }
};

main()
  .catch((error) => {
    console.error("Seeding the admin user failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
