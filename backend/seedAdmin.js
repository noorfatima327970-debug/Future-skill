const dns = require("dns");

// MongoDB Atlas SRV DNS resolution
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const Admin = require("./models/Admin");

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected");

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "Future Skill Admin";

    if (!adminEmail || !adminPassword) {
      console.error(
        "❌ ADMIN_EMAIL and ADMIN_PASSWORD must be added to .env"
      );
      process.exit(1);
    }

    const existingAdmin = await Admin.findOne({
      email: adminEmail.toLowerCase().trim(),
    });

    if (existingAdmin) {
      console.log("⚠️ Admin with this email already exists.");
      await mongoose.connection.close();
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await Admin.create({
      name: adminName,
      email: adminEmail.toLowerCase().trim(),
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log("=================================");
    console.log("✅ Admin created successfully");
    console.log(`📧 Email: ${adminEmail}`);
    console.log("🔐 Password: [hidden]");
    console.log("=================================");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Admin creation failed");
    console.error(error.message);

    await mongoose.connection.close();
    process.exit(1);
  }
};

createAdmin();