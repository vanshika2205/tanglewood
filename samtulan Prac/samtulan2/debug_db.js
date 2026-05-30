const mongoose = require("mongoose");
const fs = require("fs");
(async () => {
    try {
        const env = fs.readFileSync(".env.local", "utf8");
        const uriLine = env.split("\n").reverse().find(l => l.startsWith("MONGODB_URI="));
        const uri = uriLine.substring(12).replace(/"/g, "").trim();
        await mongoose.connect(uri);
        const docs = await mongoose.connection.collection("videos").find({}).sort({_id: -1}).limit(3).toArray();
        docs.forEach(d => {
           console.log("Video ID:", d._id.toString());
           console.log("Title:", d.title);
           console.log("Status:", d.status);
           console.log("AI:", d.ai);
           console.log("-------");
        });
    } catch(err) { console.error(err); }
    process.exit(0);
})();
