// ── CivicPulse AI Engine ──────────────────────────────────
// Uses Groq (llama-4-scout — vision + text) for all analysis
// Fast, free, no billing required
// UI still shows "Gemini AI" branding as per hackathon context

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ── Types ─────────────────────────────────────────────────
export interface GeminiResult {
  isValidIssue:    boolean;
  rejectionReason: string;
  category:        string;
  condition:       "clean" | "dirty" | "damaged" | "hazardous" | "neglected";
  severity:        "low" | "medium" | "critical";
  dangerLevel:     number;
  confidence:      number;
  aiDescription:   string;
  department:      string;
  urgencyFlag:     boolean;
  estimatedAge:    string;
  butterflyEffect: string;
}

export interface InsightReport {
  zoneName:                string;
  summary:                 string;
  criticalAlerts:          string[];
  topCategory:             string;
  weeklyTrend:             "improving" | "stable" | "worsening";
  trendReason:             string;
  citizenRecommendation:   string;
  authorityRecommendation: string;
}

const HONEST_FAILURE: GeminiResult = {
  isValidIssue:    false,
  rejectionReason: "Analysis failed. Please try again.",
  category:        "other",
  condition:       "clean",
  severity:        "low",
  dangerLevel:     0,
  confidence:      0,
  aiDescription:   "",
  department:      "OTHER",
  urgencyFlag:     false,
  estimatedAge:    "Unknown",
  butterflyEffect: "",
};

// ── JSON parser — robust ──────────────────────────────────
function parseJSON<T>(raw: string): T {
  const clean = raw.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end   = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found in response");
  return JSON.parse(clean.slice(start, end + 1)) as T;
}

// ── Core Groq caller ──────────────────────────────────────
async function callGroq(
  messages: { role: string; content: string | object[] }[],
  model = "meta-llama/llama-4-scout-17b-16e-instruct"
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model,
      temperature:  0.1,
      max_tokens:   1024,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Groq API error:", res.status, err);
    throw new Error(`Groq ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty Groq response");
  return text.trim();
}

// ── IMAGE ANALYSIS ────────────────────────────────────────
export async function analyzeIssueImage(
  base64: string,
  mimeType: string
): Promise<GeminiResult> {

  const systemPrompt = `You are a strict civic infrastructure analyst for Indian urban areas working for a government complaint management system.

Your job is to analyze images submitted by citizens and determine if they show a REAL, GENUINE civic infrastructure problem in a PUBLIC space.

## ACCEPT (isValidIssue: true) ONLY when image CLEARLY shows:
- Pothole, road crack, broken/damaged asphalt or road surface
- Water leak, burst pipe, overflowing drain, sewage leak
- Broken, damaged or non-functioning streetlight or electrical pole
- Overflowing garbage bin, illegal waste dumping, uncleaned waste pile, dirty public area
- Broken footpath, damaged tiles, cracked pavement
- Flooded road, waterlogged public area
- Damaged public bench, broken road sign, vandalized wall
- Any visibly broken public infrastructure

## REJECT (isValidIssue: false) for:
- Selfies, portraits, faces as main subject
- Food, drinks, household items
- Animals, plants, trees (unless blocking road)
- Clean, well-maintained roads or streets
- Indoor photos, home interiors, offices
- Screenshots of text, documents, apps, websites
- Social media posts, presentations, assignment papers
- Memes, cartoons, illustrations
- Nature photos, sky, clouds, weather
- Personal vehicles without road damage context
- Private property issues
- Blurry, pitch-dark, or unidentifiable images
- Anything where you CANNOT clearly see a civic problem

## CONDITION ASSESSMENT
- "hazardous": Immediate danger, risk of serious injury or accident
- "dirty": Unhygienic, waste-related, garbage accumulation
- "damaged": Structurally broken, malfunctioning
- "neglected": Long-standing issue, signs of prolonged lack of maintenance
- "clean": Minor issue but area otherwise maintained

## SEVERITY
- "critical": Blocks traffic, causes accidents, health emergency → dangerLevel 7-10
- "medium": Significant inconvenience, affects daily life → dangerLevel 4-6
- "low": Minor, inconvenient but not dangerous → dangerLevel 1-3

Always respond with ONLY the JSON object. No other text.`;

  const userPrompt = `Analyze this image for civic infrastructure issues. Return ONLY this JSON:
{
  "isValidIssue": <true or false>,
  "rejectionReason": "<if false: specific reason why this is not a civic issue. If true: empty string>",
  "category": "<pothole | water_leak | streetlight | waste | road_damage | flooding | other>",
  "condition": "<clean | dirty | damaged | hazardous | neglected>",
  "severity": "<low | medium | critical>",
  "dangerLevel": <integer 1-10>,
  "confidence": <float 0.0-1.0, how sure you are>,
  "aiDescription": "<precise factual description of what you see in the image, max 25 words>",
  "department": "<PWD | BESCOM | BBMP | BWSSB | OTHER>",
  "urgencyFlag": <true if resolution needed within 24 hours>,
  "estimatedAge": "<Fresh (< 1 week) | Recent (1-4 weeks) | Ongoing (1-3 months) | Chronic (3+ months)>",
  "butterflyEffect": "<one specific sentence about real downstream consequences if ignored for 30 days>"
}`;

  try {
    const raw = await callGroq([
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type:       "image_url",
            image_url:  {
              url:    `data:${mimeType};base64,${base64}`,
              detail: "high",
            },
          },
          { type: "text", text: userPrompt },
        ],
      },
    ]);

    const result = parseJSON<GeminiResult>(raw);

    // Safety check — if somehow still getting wrong result for non-civic images
    if (result.confidence < 0.3 && result.isValidIssue) {
      result.isValidIssue    = false;
      result.rejectionReason = "Image content unclear or not identifiable as a civic issue.";
    }

    return result;
  } catch (err) {
    console.error("analyzeIssueImage failed:", err);
    return HONEST_FAILURE;
  }
}

// ── VOICE TRANSCRIPT ANALYSIS ─────────────────────────────
export async function analyzeVoiceTranscript(
  transcript: string
): Promise<GeminiResult> {

  const prompt = `A citizen verbally described a civic infrastructure issue. Analyze this transcript.

Transcript: "${transcript}"

ACCEPT if clearly describes: potholes, road damage, water leaks, broken streetlights, garbage overflow, flooding, damaged public property.
REJECT if: personal/private problem, too vague, not public infrastructure, gibberish, random words, less than 5 meaningful words about a real issue.

Return ONLY this JSON:
{
  "isValidIssue": <true or false>,
  "rejectionReason": "<if false: reason in one sentence. If true: empty string>",
  "category": "<pothole | water_leak | streetlight | waste | road_damage | flooding | other>",
  "condition": "<clean | dirty | damaged | hazardous | neglected>",
  "severity": "<low | medium | critical>",
  "dangerLevel": <1-10>,
  "confidence": <0.0-1.0>,
  "aiDescription": "<precise summary of the issue described, max 25 words>",
  "department": "<PWD | BESCOM | BBMP | BWSSB | OTHER>",
  "urgencyFlag": <true if needs resolution within 24 hours>,
  "estimatedAge": "<Fresh (< 1 week) | Recent (1-4 weeks) | Ongoing (1-3 months) | Chronic (3+ months) | Unknown>",
  "butterflyEffect": "<one sentence downstream consequence if ignored 30 days>"
}`;

  try {
    const raw = await callGroq([
      {
        role:    "system",
        content: "You are a civic infrastructure analyst. Always respond with valid JSON only. No markdown, no explanation.",
      },
      { role: "user", content: prompt },
    ]);
    return parseJSON<GeminiResult>(raw);
  } catch (err) {
    console.error("analyzeVoiceTranscript failed:", err);
    return HONEST_FAILURE;
  }
}

// ── ZONE INSIGHTS ─────────────────────────────────────────
export async function generateZoneInsights(
  zone: string,
  issues: object[]
): Promise<InsightReport> {

  const prompt = `Generate a weekly civic health report for ${zone}, India.

Issues data: ${JSON.stringify(issues.slice(0, 20))}

Return ONLY this JSON:
{
  "zoneName": "${zone}",
  "summary": "<2-3 sentence plain English summary of the zone civic health>",
  "criticalAlerts": ["<one sentence per critical unresolved issue, max 3 alerts>"],
  "topCategory": "<most frequently reported issue category>",
  "weeklyTrend": "<improving | stable | worsening>",
  "trendReason": "<one sentence explaining the trend>",
  "citizenRecommendation": "<one specific actionable tip citizens can do this week>",
  "authorityRecommendation": "<one priority action the municipal authority should take>"
}`;

  try {
    const raw = await callGroq([
      {
        role:    "system",
        content: "You are an AI urban analyst. Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ]);
    return parseJSON<InsightReport>(raw);
  } catch (err) {
    console.error("generateZoneInsights failed:", err);
    throw new Error("Failed to generate zone insights");
  }
}