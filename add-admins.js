const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function addAdmins() {
  const admins = [
    { username: "deme21", password: "deme124" },
    { username: "firo23", password: "firo124" },
    { username: "admin", password: "admin14" },
  ];

  for (const admin of admins) {
    const hashedPassword = await bcrypt.hash(admin.password, 10);

    const existingAdmin = await prisma.user.findUnique({
      where: { username: admin.username },
    });

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          username: admin.username,
          password: hashedPassword,
          role: "ADMIN",
        },
      });
      console.log(`Admin user created. Username: ${admin.username}`);
    } else {
      console.log(`Admin user ${admin.username} already exists.`);
    }
  }
}

addAdmins()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
