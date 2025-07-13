const { PrismaClient } = require("@prisma/client")
const fs = require("fs")
const path = require("path")

async function setupDatabase() {
  const prisma = new PrismaClient()

  try {
    console.log("🚀 Setting up FileVault database and directories...")

    // First, create upload directories
    const uploadDir = path.join(process.cwd(), "uploads")
    const conversionsDir = path.join(uploadDir, "conversions")

    console.log("📁 Creating upload directories...")

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
      console.log("✅ Created uploads directory:", uploadDir)
    } else {
      console.log("✅ Uploads directory already exists")
    }

    if (!fs.existsSync(conversionsDir)) {
      fs.mkdirSync(conversionsDir, { recursive: true })
      console.log("✅ Created conversions directory:", conversionsDir)
    } else {
      console.log("✅ Conversions directory already exists")
    }

    // Test database connection
    console.log("🔌 Connecting to database...")
    await prisma.$connect()
    console.log("✅ Database connected successfully")

    // Test database operations
    console.log("🧪 Testing database operations...")

    // Try to query users table (this will create it if it doesn't exist)
    const userCount = await prisma.user.count()
    console.log(`✅ Database operational - Found ${userCount} users`)

    // Create a test user if none exist (for development)
    if (userCount === 0) {
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

    console.log("🎉 Database setup complete!")
    console.log("📝 Next steps:")
    console.log("   1. Run 'npm run dev' to start the development server")
    console.log("   2. Open http://localhost:3000 in your browser")
    console.log("   3. Register a new account or use test@example.com / password123")
  } catch (error) {
    console.error("❌ Database setup failed:", error)

    if (error.code === "P1001") {
      console.log("💡 Tip: Make sure your DATABASE_URL is correct in .env file")
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

setupDatabase()
