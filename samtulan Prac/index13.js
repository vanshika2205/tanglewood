const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use("/videos", express.static("uploads"));

// Storage setup
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Upload API
app.post("/upload", upload.single("video"), (req, res) => {
  res.json({ file: req.file.filename });
});

// Get all videos
const fs = require("fs");
app.get("/videos", (req, res) => {
  const files = fs.readdirSync("./uploads");
  res.json(files);
});

app.listen(5000, () => console.log("Server running on port 5000"));