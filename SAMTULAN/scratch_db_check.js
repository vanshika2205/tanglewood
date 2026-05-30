const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/samtulan');
  const Video = mongoose.model('Video', new mongoose.Schema({ title: String, fileUrl: String, status: String }));
  const videos = await Video.find({ status: 'approved' }).limit(5).lean();
  console.log(JSON.stringify(videos, null, 2));
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
