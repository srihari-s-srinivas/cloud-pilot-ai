import 'dotenv/config';

const REQUIRED_ENV_VARS = ['JWT_SECRET', 'GEMINI_API_KEY'];
const missingVars = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
if (missingVars.length > 0) {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('FATAL ERROR: Missing required environment variables:');
  missingVars.forEach(v => console.error(`  ❌ ${v}`));
  console.error('Server cannot start. Set these in your .env file.');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.warn('⚠️ MONGO_URI is not set. The app will use an in-memory MongoDB fallback for development.');
}

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import { connectDB } from "./backend/config/db.ts";

/**
 * Main server entry point
 */
async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Connect to MongoDB (Non-blocking to ensure fast startup)
  connectDB().catch(err => console.error("Database initialization failed:", err));

  // Security Middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Set to false to prevent disrupting development preview frames if restrictive
    crossOriginEmbedderPolicy: false
  }));
  app.use(cors({
    origin: process.env.APP_URL || 'http://localhost:5173',
    credentials: true
  }));

  // Body parser middleware with strict size limit to prevent DoS attacks
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Log all incoming requests and payloads safely with masking
  app.use((req, res, next) => {
    // Only log API requests to avoid performance issues and spamming on static assets
    if (!req.url.startsWith('/api')) {
      return next();
    }

    const logFile = path.join(process.cwd(), "backend", "error.log");
    const timestamp = new Date().toISOString();
    const cleanBody = { ...req.body };
    
    // Mask sensitive credentials in request bodies
    if (cleanBody.password) cleanBody.password = "********";
    if (cleanBody.secretAccessKey) cleanBody.secretAccessKey = "********";
    if (cleanBody.accessKeyId) {
      const ak = String(cleanBody.accessKeyId);
      cleanBody.accessKeyId = ak.substring(0, 4) + "****";
    }
    if (cleanBody.token) cleanBody.token = "********";
    
    // Mask sensitive headers to prevent credential leakage in logs
    const cleanHeaders = { ...req.headers };
    if (cleanHeaders.authorization) {
      cleanHeaders.authorization = "Bearer ********";
    }
    if (cleanHeaders.cookie) {
      cleanHeaders.cookie = "********";
    }
    
    const requestLog = `[${timestamp}] [REQUEST] ${req.method} ${req.url}\nHeaders: ${JSON.stringify(cleanHeaders)}\nBody: ${JSON.stringify(cleanBody)}\n----------------------------------------\n`;
    try {
      fs.appendFileSync(logFile, requestLog);
    } catch (e) {
      console.error("Failed to write to request log file", e);
    }

    // Capture response details safely
    const originalSend = res.send;
    res.send = function (body) {
      const responseLog = `[${timestamp}] [RESPONSE] ${req.method} ${req.url} - Status: ${res.statusCode}\nBody: ${typeof body === 'string' ? body.substring(0, 1000) : JSON.stringify(body)}\n========================================\n`;
      try {
        fs.appendFileSync(logFile, responseLog);
      } catch (e) {
        console.error("Failed to write to response log file", e);
      }
      return originalSend.apply(this, arguments as any);
    };

    next();
  });

  // API Routes
  const [{ default: authRoutes }, { default: awsRoutes }, { default: scanRoutes }, { default: resourceRoutes }, { default: auditLogRoutes }, { default: notificationRoutes }, { default: reportRoutes }, { default: dashboardRoutes }] = await Promise.all([
    import("./backend/routes/authRoutes.ts"),
    import("./backend/routes/awsRoutes.ts"),
    import("./backend/routes/scanRoutes.ts"),
    import("./backend/routes/resourceRoutes.ts"),
    import("./backend/routes/auditLogRoutes.ts"),
    import("./backend/routes/notificationRoutes.ts"),
    import("./backend/routes/reportRoutes.ts"),
    import("./backend/routes/dashboardRoutes.ts"),
  ]);

  app.use("/api/auth", authRoutes);
  app.use("/api/aws", awsRoutes);
  app.use("/api/scans", scanRoutes);
  app.use("/api/resources", resourceRoutes);
  app.use("/api/audit-logs", auditLogRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api", dashboardRoutes); // This will handle /api/dashboard/summary, /api/security/findings etc.

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Global Error Handler Middleware - Fix for unhandled expressing stack traces
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global Error Intercepted:", err);
    res.status(err.status || 500).json({
      message: 'Internal server error'
    });
  });

  // Handle Vite middleware for development or serve static files for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful Shutdown - Fix: Trap SIGTERM & SIGINT to drain requests and safely close connection
  const gracefulShutdown = (signal: string) => {
    console.log(`📡 Process received ${signal}. Starting shutdown sequence...`);
    
    server.close(async () => {
      console.log('HTTP Connections drained. Closing DB clients...');
      
      try {
        if (mongoose.connection.readyState === 1) {
          await mongoose.connection.close();
          console.log('MongoDB connection closed cleanly.');
        }
      } catch (err) {
        console.error('Error during MongoDB connection close:', err);
      }
      
      console.log('Graceful shutdown complete. Server offline.');
      process.exit(0);
    });

    // Timeout fallback backstop
    setTimeout(() => {
      console.warn('Graceful shutdown timeout exceeded. Force exiting...');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch(err => {
  console.error("Critical server startup failure:", err);
  const app = express();
  app.get("/api/health", (req, res) => {
    res.status(500).json({ error: "Server in broken state", details: 'Internal server error' });
  });
  app.listen(3000, "0.0.0.0", () => {
    console.log("Fallback crisis-mode server running on port 3000");
  });
});
