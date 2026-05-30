const mongoose = require('mongoose');
const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!MONGODB_URI || !ANTHROPIC_API_KEY || ANTHROPIC_API_KEY.includes('YOUR_KEY_HERE')) {
  console.error('Error: MONGODB_URI or a valid ANTHROPIC_API_KEY is missing in .env.local');
  process.exit(1);
}

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const SYSTEM = `You are a strict content moderator for Samtulan — India's family-safe video platform for all ages including children.
Analyze video metadata and return ONLY valid JSON with this exact structure:
{"verdict":"approved"|"flagged"|"rejected","confidence":0-100,"scores":{"violence":0.0,"adult_content":0.0,"hate_speech":0.0,"drugs":0.0,"dangerous":0.0,"misleading":0.0,"profanity":0.0,"copyright":0.0},"reasons":[],"summary":"A detailed summary in Hinglish explaining the decision","suggestion":null}
Rules: verdict=approved if all scores<0.30, flagged if any score 0.30-0.65, rejected if any score>0.65.
The 'summary' must be a text-based detailing of WHY the decision was made. Use a professional yet conversational Hinglish style (Hindi + English). No extra text.`;

// Define Schema locally to avoid Next.js import issues in standalone script
const VideoSchema = new mongoose.Schema({
  title: String,
  description: String,
  tags: [String],
  category: String,
  status: String,
  ai: {
    verdict: String,
    confidence: Number,
    scores: Object,
    reasons: [String],
    summary: String,
    violations: [{ timestamp: String, category: String, reason: String, severity: String }],
    suggestion: String,
    checkedAt: Date
  }
}, { timestamps: true });

const Video = mongoose.models.Video || mongoose.model('Video', VideoSchema);

async function rescanAll() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully.');

    const videos = await Video.find({ $or: [{ 'ai.violations': { $exists: false } }, { 'ai.violations': { $size: 0 } }] });
    console.log(`Found ${videos.length} videos missing detailed violations.`);

    for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        console.log(`[${i+1}/${videos.length}] Scanning: ${v.title}...`);

        try {
            const msg = await client.messages.create({
                model: "claude-3-5-sonnet-20240620",
                max_tokens: 512,
                system: SYSTEM,
                messages: [{ role: "user", content: `Title: ${v.title}\nDescription: ${v.description || ""}\nTags: ${v.tags?.join(",") || ""}\nCategory: ${v.category || ""}` }],
            });

            const text = msg.content.filter(b => b.type === "text").map(b => b.text).join("").replace(/```json|```/g, "").trim();
            const result = JSON.parse(text);

            const nextStatus = result.verdict === "rejected" ? "rejected" : result.verdict === "flagged" ? "flagged" : "human_review";
            
            await Video.findByIdAndUpdate(v._id, {
                status: nextStatus,
                ai: {
                    verdict: result.verdict,
                    confidence: result.confidence,
                    scores: result.scores,
                    reasons: result.reasons || [],
                    summary: result.summary,
                    violations: result.violations || [],
                    suggestion: result.suggestion,
                    checkedAt: new Date()
                }
            });
            console.log(`   Result: ${result.verdict} - Summary generated.`);
        } catch (err) {
            console.error(`   Error scanning ${v.title}:`, err.message);
        }
        
        // Sleep to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log('Bulk rescue/rescan complete!');
  } catch (error) {
    console.error('Fatal Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

rescanAll();
