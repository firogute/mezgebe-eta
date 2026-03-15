const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const password = "password123"; // Tell user to change this
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingAdmin = await prisma.user.findUnique({
    where: { username }
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: "ADMIN"
      }
    });
    console.log(`Admin user seeded. Username: ${username}, Password: ${password}`);
  } else {
    console.log("Admin user already exists.");
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
