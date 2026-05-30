const mongoose = require("mongoose");
const fs = require("fs");
const env = fs.readFileSync(".env.local", "utf8");
const uri = env.split("\n").reverse().find(l => l.startsWith("MONGODB_URI=")).substring(12).replace(/"/g, "").trim();

(async () => {
    await mongoose.connect(uri);
    const Video = mongoose.connection.collection("videos");
    const docs = await Video.find({}).toArray();
    console.log("Total videos:", docs.length);
    console.log("Statuses:", docs.map(d => d.status));
    process.exit(0);
})();
