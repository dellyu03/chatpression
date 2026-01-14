// 배포 환경용 서버 (프로덕션 최적화)
const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정 (프로덕션)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS 정책에 의해 차단되었습니다."));
      }
    },
    credentials: true,
  })
);

// 보안 헤더 설정
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  next();
});

// 정적 파일 캐싱 설정
const cacheTime = 86400000; // 1일
app.use(
  "/CSS",
  express.static(path.join(__dirname, "CSS"), {
    maxAge: cacheTime,
    etag: true,
  })
);
app.use(
  "/JS",
  express.static(path.join(__dirname, "JS"), {
    maxAge: cacheTime,
    etag: true,
  })
);
app.use(
  "/HTML",
  express.static(path.join(__dirname, "HTML"), {
    maxAge: cacheTime,
    etag: true,
  })
);

// Gzip 압축 (프로덕션 환경에서 권장)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 루트 경로
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "HTML", "index.html"));
});

// HTML 라우팅
app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "HTML", "login.html"));
});

app.get("/onboarding", (req, res) => {
  res.sendFile(path.join(__dirname, "HTML", "onboarding.html"));
});

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "HTML", "chat.html"));
});

// Health check 엔드포인트 (모니터링용)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// 404 처리
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "HTML", "index.html"));
});

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
  console.error("서버 에러:", err.stack);
  res.status(500).json({
    error: "서버 내부 오류가 발생했습니다.",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 서버 시작
const server = app.listen(PORT, () => {
  console.log("\n🚀 ChatPression 프로덕션 서버 시작!");
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🌍 환경: ${process.env.NODE_ENV || "production"}`);
  console.log(`📂 정적 파일 디렉토리: ${__dirname}`);
  console.log("\n💡 Ctrl+C로 서버 종료\n");
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n⚠️  SIGTERM 신호 수신. 서버 종료 중...");
  server.close(() => {
    console.log("✅ 서버가 정상적으로 종료되었습니다.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n⚠️  SIGINT 신호 수신. 서버 종료 중...");
  server.close(() => {
    console.log("✅ 서버가 정상적으로 종료되었습니다.");
    process.exit(0);
  });
});

// 예외 처리
process.on("uncaughtException", (err) => {
  console.error("❌ 예상치 못한 에러:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ 처리되지 않은 Promise 거부:", reason);
  process.exit(1);
});
