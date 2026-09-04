require("dotenv").config();
const path = require("path");
const http = require("http");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const { Server } = require("socket.io");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const connectDB = require("./config/db");
const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/authRoutes");
const complaintRoutes = require("./routes/complaintRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const commentRoutes = require("./routes/commentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");
const { sendSuccess } = require("./utils/apiResponse");
const logger = require("./utils/logger");
const { startSlaNotificationMonitor } = require("./services/slaNotificationService");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const allowedOrigins =
  process.env.CLIENT_URLS?.split(",").map((origin) => origin.trim()) || ["http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS not allowed"), false);
    },
    credentials: true,
  }),
);

app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("dev", {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }),
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
app.set("io", io);

io.on("connection", (socket) => {
  socket.on("auth:register", ({ userId }) => {
    if (!userId) return;
    socket.join(`user:${String(userId)}`);
  });

  socket.on("complaint:join", ({ complaintId }) => {
    if (!complaintId) return;
    socket.join(`complaint:${String(complaintId)}`);
  });
});

const healthHandler = (_req, res) =>
  sendSuccess(res, {
    message: "CampusFix Lite API running.",
    data: { service: "campusfix-lite", timestamp: new Date().toISOString() },
  });

app.get("/api/health", healthHandler);
app.get("/api/v1/health", healthHandler);

app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const registerApiRoutes = (basePath) => {
  app.use(`${basePath}/auth`, authRoutes);
  app.use(`${basePath}/complaints`, complaintRoutes);
  app.use(`${basePath}/comments`, commentRoutes);
  app.use(`${basePath}/notifications`, notificationRoutes);
  app.use(`${basePath}/dashboard`, dashboardRoutes);
  app.use(`${basePath}/admin`, adminRoutes);
};

registerApiRoutes("/api");
registerApiRoutes("/api/v1");

app.use(notFound);
app.use(errorHandler);

const bootstrap = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required.");
    }

    await connectDB();
    startSlaNotificationMonitor(io);
    server.listen(PORT, () => {
      logger.info(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

bootstrap();
