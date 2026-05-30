const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/videos", express.static("uploads"));

let users = [];

const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// LOGIN
app.post("/login", (req, res) => {
  const { username } = req.body;
  users.push(username);
  res.json({ message: "Logged in" });
});

// UPLOAD
app.post("/upload", upload.single("video"), (req, res) => {
  res.json({ file: req.file.filename });
});

// GET VIDEOS
app.get("/videos", (req, res) => {
  const files = fs.readdirSync("./uploads");
  res.json(files.reverse());
});

app.listen(5000, () => console.log("Server running on 5000"));