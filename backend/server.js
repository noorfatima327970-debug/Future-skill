require("dotenv").config();

const dns = require("dns");

dns.setServers([
  "8.8.8.8",
  "8.8.4.4",
]);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");

const Admin = require("./models/Admin");

const app = express();

/* =========================================
   MIDDLEWARE
========================================= */

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "5mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "5mb",
  })
);

app.use(cookieParser());

/* =========================================
   DATABASE CONNECTION
========================================= */

let dbPromise;

async function connectDB() {
  if (!dbPromise) {
    dbPromise = (async () => {
      if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is missing");
      }

      await mongoose.connect(process.env.MONGO_URI);

      console.log("MongoDB connected successfully.");

      await syncPrimaryAdmin();
    })().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
}

// Routes chalne se pehle database connect hoga
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Backend startup failed:", error.message);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

/* =========================================
   ROOT API
========================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Future Skill School Management API is running",
  });
});

/* =========================================
   AUTH ROUTES
========================================= */

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

/* =========================================
   DASHBOARD ROUTES
========================================= */

app.use(
  "/api/dashboard",
  require("./routes/dashboardRoutes")
);

/* =========================================
   SCHOOL MANAGEMENT ROUTES
========================================= */

app.use(
  "/api/students",
  require("./routes/studentRoutes")
);

app.use(
  "/api/teachers",
  require("./routes/teacherRoutes")
);

app.use(
  "/api/classes",
  require("./routes/classRoutes")
);

app.use(
  "/api/subjects",
  require("./routes/subjectRoutes")
);

app.use(
  "/api/timetable",
  require("./routes/timetableRoutes")
);

app.use(
  "/api/attendance",
  require("./routes/attendanceRoutes")
);

app.use(
  "/api/fees",
  require("./routes/feeRoutes")
);

app.use(
  "/api/exams",
  require("./routes/examRoutes")
);

app.use(
  "/api/results",
  require("./routes/resultRoutes")
);

/* =========================================
   IT CENTER ROUTES
========================================= */

app.use(
  "/api/it-courses",
  require("./routes/itCourseRoutes")
);

app.use(
  "/api/it-students",
  require("./routes/itStudentRoutes")
);

/* =========================================
   GENERAL ROUTES
========================================= */

app.use(
  "/api/expenses",
  require("./routes/expenseRoutes")
);

app.use(
  "/api/academic-sessions",
  require("./routes/academicSessionRoutes")
);

app.use(
  "/api/admin",
  require("./routes/adminRoutes")
);

app.use(
  "/api/settings",
  require("./routes/settingsRoutes")
);

app.use(
  "/api/notifications",
  require("./routes/notificationRoutes")
);

/* =========================================
   PRIMARY ADMIN SETUP
========================================= */

async function syncPrimaryAdmin() {
  const name = process.env.ADMIN_NAME?.trim();

  const email = process.env.ADMIN_EMAIL
    ?.trim()
    .toLowerCase();

  const password = process.env.ADMIN_PASSWORD;

  const shouldResetPassword =
    process.env.RESET_PRIMARY_ADMIN_PASSWORD === "true";

  let primaryAdmin = await Admin.findOne({
    isPrimaryAdmin: true,
  });

  if (primaryAdmin) {
    if (shouldResetPassword) {
      if (!password || password.length < 6) {
        throw new Error(
          "ADMIN_PASSWORD must be at least 6 characters for password reset."
        );
      }

      primaryAdmin.password = await bcrypt.hash(
        password,
        12
      );

      await primaryAdmin.save();

      console.log(
        "Primary admin password reset successfully from env."
      );
    } else {
      console.log(
        "Primary admin already exists. Existing password was not changed."
      );
    }

    return;
  }

  if (!name || !email || !password) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set"
    );
  }

  if (password.length < 6) {
    throw new Error(
      "ADMIN_PASSWORD must be at least 6 characters"
    );
  }

  const existingAdmin = await Admin.findOne({
    email,
  });

  const hashedPassword = await bcrypt.hash(
    password,
    12
  );

  if (existingAdmin) {
    existingAdmin.name = name;
    existingAdmin.email = email;
    existingAdmin.password = hashedPassword;
    existingAdmin.role = "admin";
    existingAdmin.isActive = true;
    existingAdmin.isPrimaryAdmin = true;

    await existingAdmin.save();

    console.log(
      "Existing admin converted to primary admin successfully."
    );

    return;
  }

  await Admin.create({
    name,
    email,
    password: hashedPassword,
    role: "admin",
    isActive: true,
    isPrimaryAdmin: true,
  });

  console.log(
    "Primary admin account created successfully."
  );
}

/* =========================================
   NOT FOUND HANDLER
========================================= */

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

/* =========================================
   EXPORT AND LOCAL SERVER
========================================= */

module.exports = app;

// Sirf local run par listen karega
if (require.main === module) {
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(
      `Server running on http://localhost:${PORT}`
    );
  });
}
