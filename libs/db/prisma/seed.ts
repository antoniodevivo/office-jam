import { prisma } from "../src/client";

async function main() {
  const office = await prisma.office.upsert({
    where: { id: "default-office" },
    update: {},
    create: {
      id: "default-office",
      name: "Headquarters",
      description: "The main office",
    },
  });

  console.log("Seeded default office:", office.name);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
