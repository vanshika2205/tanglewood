const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

mongoose.connect("mongodb://127.0.0.1:27017/netflixDB")
.then(() => console.log("MongoDB connected"));

app.use("/api/auth", require("./routes/auth"));

app.listen(4000, () => {
  console.log("Server running on port 4000");
});


