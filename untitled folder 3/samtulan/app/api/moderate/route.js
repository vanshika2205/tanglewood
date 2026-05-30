import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are a strict content moderator for Samtulan — India's family-safe video platform for all ages including children.
Analyze video metadata and return ONLY valid JSON with this exact structure:
{"verdict":"approved"|"flagged"|"rejected","confidence":0-100,"scores":{"violence":0.0,"adult_content":0.0,"hate_speech":0.0,"drugs":0.0,"dangerous":0.0,"misleading":0.0,"profanity":0.0,"copyright":0.0},"reasons":[],"suggestion":null}
Rules: verdict=approved if all scores<0.30, flagged if any score 0.30-0.65, rejected if any score>0.65. No extra text.`;

export async function GET() {
  return Response.json({ status:"ok", service:"Samtulan AI Moderation", model:"claude-sonnet-4-20250514" });
}

export async function POST(req) {
  try {
    const { title, description, tags, category } = await req.json();
    if (!title) return Response.json({ error: "Title required" }, { status: 400 });

    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: SYSTEM,
      messages: [{ role:"user", content:`Title: ${title}\nDescription: ${description||""}\nTags: ${Array.isArray(tags)?tags.join(","):tags||""}\nCategory: ${category||""}` }],
    });

    const text = msg.content.filter(b=>b.type==="text").map(b=>b.text).join("").replace(/```json|```/g,"").trim();
    const data = JSON.parse(text);
    return Response.json({ ...data, processedAt: new Date().toISOString() });
  } catch(e) {
    console.error("Moderation error:", e);
    return Response.json({ verdict:"flagged", confidence:50, scores:{violence:0,adult_content:0,hate_speech:0,drugs:0,dangerous:0,misleading:0,profanity:0,copyright:0}, reasons:["AI scan failed — manual review"], suggestion:null, fallback:true }, { status:200 });
  }
}
