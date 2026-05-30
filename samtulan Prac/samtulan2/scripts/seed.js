const fs = require('fs');
const mongoose = require('mongoose');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const lines = envContent.split('\n').reverse(); // Get the last defined one
const mongoLine = lines.find(line => line.startsWith('MONGODB_URI='));
const MONGODB_URI = mongoLine ? mongoLine.split('=').slice(1).join('=').trim() : null;

if (!MONGODB_URI || MONGODB_URI.includes('USERNAME:PASSWORD')) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const DEMO_VIDEOS = [
  { title:"Python Seekhein — Bilkul Shuruaat se", uploaderName:"CodeWithPriya", views:234891, likes:18000, category:"Education", duration:"18:42", color:0, verified:true, status: "approved" },
  { title:"Ghar pe Pizza Banao — Easy Recipe",   uploaderName:"KitchenKing",   views:510000, likes:41000, category:"Cooking",   duration:"12:15", color:1, verified:true, status: "approved" },
  { title:"Space aur Planets ki Duniya",         uploaderName:"ScienceWala",   views:870000, likes:62000, category:"Science",   duration:"24:00", color:2, verified:true, status: "approved" },
  { title:"Bacchon ke liye Fun Drawing",         uploaderName:"ArtForKids",    views:120000, likes:9800,  category:"Kids",      duration:"9:30",  color:3, verified:false, status: "approved" },
  { title:"Guitar Basics — Pehla Lesson",        uploaderName:"MusicMaestro",  views:340000, likes:27000, category:"Music",     duration:"15:20", color:4, verified:true, status: "approved" },
  { title:"Minecraft Survival Guide S3",         uploaderName:"GamersAdda",    views:990000, likes:88000, category:"Gaming",    duration:"32:10", color:5, verified:true, status: "approved" },
  { title:"Subah Ki Yoga — 10 Min Routine",      uploaderName:"FitFamily",     views:450000, likes:36000, category:"Sports",    duration:"10:05", color:6, verified:true, status: "approved" },
  { title:"DIY Bookshelf — Wood Workshop",       uploaderName:"MakeItYourself",views:180000, likes:14000, category:"DIY",       duration:"22:44", color:7, verified:false, status: "approved" },
  { title:"JavaScript Tips for Developers",      uploaderName:"DevDuniya",     views:620000, likes:49000, category:"Tech",      duration:"28:10", color:0, verified:true, status: "approved" },
  { title:"Comedy Sketch — Wifi Band Ho Jaye",   uploaderName:"HaasiyaTV",     views:1200000,likes:96000, category:"Comedy",    duration:"7:22",  color:1, verified:true, status: "approved" },
  { title:"Aaj Ki Khabar — News Digest",         uploaderName:"NewsNow",       views:310000, likes:22000, category:"News",      duration:"14:00", color:2, verified:true, status: "approved" },
  { title:"Robotics for Kids — Build a Robot",   uploaderName:"TechTinkers",   views:89000,  likes:7200,  category:"Kids",      duration:"19:55", color:3, verified:true, status: "approved" },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // We need to fetch any User to assign as uploader, so the ID checks don't fail later 
  const db = mongoose.connection.db;
  const users = await db.collection('users').find({}).toArray();
  const uploaderId = users.length > 0 ? users[0]._id : new mongoose.Types.ObjectId();
  
  if (users.length === 0) {
      console.log("No users found. Creating a default uploader User...");
      await db.collection('users').insertOne({ _id: uploaderId, name: "Admin", email: "admin@samtulan.local", role: "admin" });
  } else {
      console.log(`Using existing user ${users[0].email} as the uploader for the demo data.`);
  }

  // Wipe existing videos collection to prevent duplicates and clean up previous attempts
  await db.collection('videos').deleteMany({});
  console.log("Wiped old videos.");

  const videosWithUploaders = DEMO_VIDEOS.map(v => ({
      ...v,
      uploader: uploaderId,
      createdAt: new Date(Date.now() - Math.random() * 10 * 86400000), // random publish date
      description: "Ek nayi video jisko aap enjoy kar sakte hain. Please like aur subscribe zarur karein!",
      fileUrl: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      thumbnailUrl: ""
  }));

  const res = await db.collection('videos').insertMany(videosWithUploaders);
  console.log(`Successfully inserted ${res.insertedCount} demo videos!`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
