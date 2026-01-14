// 개발 환경용 서버 (핫 리로드 지원)
const express = require("express");
const path = require("path");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 설정 (개발 환경)
app.use(cors());

// 정적 파일 제공
app.use("/CSS", express.static(path.join(__dirname, "CSS")));
app.use("/JS", express.static(path.join(__dirname, "JS")));
app.use("/HTML", express.static(path.join(__dirname, "HTML")));

// 루트 경로 - index.html로 리다이렉트
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

// 404 처리
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "HTML", "index.html"));
});

// 서버 시작
app.listen(PORT, () => {
  console.log("\n🚀 ChatPression 개발 서버 시작!");
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📂 정적 파일 디렉토리: ${__dirname}`);
  console.log("\n💡 Ctrl+C로 서버 종료\n");
});

// 에러 핸들링
process.on("uncaughtException", (err) => {
  console.error("❌ 예상치 못한 에러:", err);
  process.exit(1);
});
