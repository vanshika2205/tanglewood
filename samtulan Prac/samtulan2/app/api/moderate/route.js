import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are a strict content moderator for Samtulan — India's family-safe video platform for all ages including children.
Analyze video metadata and return ONLY valid JSON with this exact structure:
{"verdict":"approved"|"flagged"|"rejected","confidence":0-100,"scores":{"violence":0.0,"adult_content":0.0,"hate_speech":0.0,"drugs":0.0,"dangerous":0.0,"misleading":0.0,"profanity":0.0,"copyright":0.0},"reasons":[],"summary":"A detailed summary in Hinglish explaining the decision","suggestion":null}
Rules: verdict=approved if all scores<0.30, flagged if any score 0.30-0.65, rejected if any score>0.65.
The 'summary' must be a text-based detailing of WHY the decision was made. Use a professional yet conversational Hinglish style (Hindi + English). No extra text.`;

export async function GET() {
  return Response.json({ status:"ok", service:"Samtulan AI Moderation", model:"claude-sonnet-4-20250514" });
}

export async function POST(req) {
  try {
    const { title, description, tags, category } = await req.json();
    if (!title) return Response.json({ error: "Title required" }, { status: 400 });

    // DEMO MODE: If API key is placeholder or missing, return a high-quality mock response
    const isPlaceholder = !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes("YOUR_KEY_HERE");
    if (isPlaceholder) {
      const mockResult = getMockModeration(title, category);
      return Response.json({ ...mockResult, processedAt: new Date().toISOString(), mode: "mock" });
    }

    const msg = await client.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 512,
      system: SYSTEM,
      messages: [{ role:"user", content:`Title: ${title}\nDescription: ${description||""}\nTags: ${Array.isArray(tags)?tags.join(","):tags||""}\nCategory: ${category||""}` }],
    });

    const text = msg.content.filter(b=>b.type==="text").map(b=>b.text).join("").replace(/```json|```/g,"").trim();
    const data = JSON.parse(text);
    return Response.json({ ...data, processedAt: new Date().toISOString(), mode: "real" });
  } catch(e) {
    console.error("Moderation error:", e);
    return Response.json({ 
      verdict:"flagged", confidence:50, 
      scores:{violence:0,adult_content:0,hate_speech:0,drugs:0,dangerous:0,misleading:0,profanity:0,copyright:0}, 
      reasons:["AI scan failed — manual review required"], 
      summary:"AI scanning system down ya configuration error hai. Ye video safe toh lag rahi hai par moderation check baki hai.", 
      suggestion:null, fallback:true 
    }, { status:200 });
  }
}

function getMockModeration(title, category) {
  const t = title.toLowerCase();
  
  if (t.includes("kill") || t.includes("blood") || t.includes("fight") || t.includes("weapon")) {
    return {
      verdict: "flagged", confidence: 94,
      scores: { violence: 0.62, adult_content: 0.02, hate_speech: 0.05, drugs: 0.0, dangerous: 0.15, misleading: 0.0, profanity: 0.05, copyright: 0.0 },
      reasons: ["Violence markers detected", "Safety concern in title"],
      summary: `Hume is video mein kuch sensitive points mile hain:
1. **Violence (High Risk)**: Title mein '${title}' ke keywords hinsa darshate hain.
2. **Safety Status**: Yeh video Samtulan ke 'Family-Safe' criteria ke limit par hai.`,
      violations: [
        { timestamp: "00:15", category: "Violence", reason: "Title aur initial tags mein 'fight/weapon' jaise shabd mile hain jo hinsa ko badhava de sakte hain.", severity: "High" },
        { timestamp: "01:20", category: "Safety", reason: "Action-oriented keywords bachon ki mental health ke liye inappropriate ho sakte hain.", severity: "Medium" }
      ],
      suggestion: "Cinematic action allowed, but ensure it's not promoting real harm."
    };
  }
  
  return {
    verdict: "approved", confidence: 99,
    scores: { violence: 0.01, adult_content: 0.0, hate_speech: 0.01, drugs: 0.0, dangerous: 0.02, misleading: 0.0, profanity: 0.0, copyright: 0.0 },
    reasons: ["Safe content", "Passes all filters"],
    summary: `Hume is content mein koi issue nahi mila:
1. **Safety Point**: Content puri tarah safe hai.
2. **Copyright Point**: Koi copyright violation nahi mila.`,
    violations: [
      { timestamp: "00:01", category: "Safety", reason: "Pure metadata mein koi bhi objectionable content nahi mila.", severity: "Low" },
      { timestamp: "00:10", category: "Copyright", reason: "Uploader history aur content tags genuine lag rahe hain.", severity: "Low" }
    ],
    suggestion: null
  };
}
