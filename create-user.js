const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Tenant Seeding...");
  const email = 'xxxxxx@gamil.com';
  const plainPassword = 'xxxxxxx';
  const shopDomain = process.env.SHOPIFY_STORE_DOMAIN ; 
  
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN ;
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  try {
    const tenant = await prisma.tenant.upsert({
      where: { email: email },
      update: {
        password: hashedPassword,
        shopDomain: shopDomain,
        accessToken: accessToken,
      },
      create: {
        email: email,
        password: hashedPassword,
        shopDomain: shopDomain,
        accessToken: accessToken,
      },
    });

    console.log(`\n✅ Success! Tenant created.`);
    console.log(`   Email: ${tenant.email}`);
    console.log(`   Password: ${plainPassword}`);
    console.log(`   Linked Shop: ${tenant.shopDomain}`);
    
  } catch (e) {
    console.error("❌ Error creating tenant:", e);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });