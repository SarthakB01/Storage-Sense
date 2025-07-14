const { PrismaClient } = require("@prisma/client")

async function setupCloudDatabase() {
  const prisma = new PrismaClient()

  try {
    console.log("🚀 Setting up Storage Sense cloud database...")

    // Test database connection
    console.log("🔌 Connecting to cloud database...")
    await prisma.$connect()
    console.log("✅ Cloud database connected successfully")

    // Test database operations
    console.log("🧪 Testing database operations...")

    // Try to query users table (this will create it if it doesn't exist via Prisma)
    const userCount = await prisma.user.count()
    console.log(`✅ Database operational - Found ${userCount} users`)

    // Create a test user if none exist (for development)
    if (userCount === 0 && process.env.NODE_ENV !== "production") {
      console.log("👤 Creating test user for development...")
      const bcrypt = require("bcryptjs")

      const testUser = await prisma.user.create({
        data: {
          name: "Test User",
          email: "test@example.com",
          password: await bcrypt.hash("password123", 12),
          settings: {
            create: {
              emailNotifications: true,
              pushNotifications: false,
              uploadNotifications: true,
              conversionNotifications: true,
            },
          },
        },
      })
      console.log("✅ Test user created:", testUser.email)
      console.log("🔑 Login with: test@example.com / password123")
    }

    console.log("🎉 Cloud database setup complete!")
    console.log("📝 Next steps:")
    console.log("   1. Deploy to Vercel: vercel --prod")
    console.log("   2. Your app will be available at your Vercel domain")
    console.log("   3. Files will be stored in Vercel Blob")
    console.log("   4. Database is hosted on Neon PostgreSQL")
  } catch (error) {
    console.error("❌ Cloud database setup failed:", error)

    if (error.code === "P1001") {
      console.log("💡 Tip: Make sure your DATABASE_URL is correct in .env file")
      console.log("💡 Get a free PostgreSQL database at: https://neon.tech")
    }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Handle process termination gracefully
process.on("SIGINT", async () => {
  console.log("\n🛑 Setup interrupted")
  process.exit(0)
})

process.on("SIGTERM", async () => {
  console.log("\n🛑 Setup terminated")
  process.exit(0)
})

setupCloudDatabase()
