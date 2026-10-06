import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisRequest {
  text: string;
  project_id?: string;
}

interface AnalysisResult {
  sentiment_score: number;
  sentiment_label: "positive" | "neutral" | "negative";
  key_topics: string[];
  risk_flags: string[];
  ai_summary: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { text, project_id }: AnalysisRequest = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required for analysis" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Use Databricks Foundation Model API for text analysis
    // This simulates using Databricks SQL Analytics AI functions
    // In production, you would call Databricks' actual API endpoints
    const analysis = await analyzeText(text);

    // If project_id is provided, update the project with insights
    if (project_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/rest/v1/projects?id=eq.${project_id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseKey,
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            sentiment_score: analysis.sentiment_score,
            sentiment_label: analysis.sentiment_label,
            key_topics: analysis.key_topics,
            risk_flags: analysis.risk_flags,
            ai_summary: analysis.ai_summary,
            last_analyzed_at: new Date().toISOString(),
          }),
        });
      }
    }

    return new Response(
      JSON.stringify(analysis),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in AI analysis:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to analyze text",
        details: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

/**
 * Analyzes text using AI techniques
 * In production, this would call Databricks Foundation Model APIs
 * Currently uses rule-based analysis as a demonstration
 */
async function analyzeText(text: string): Promise<AnalysisResult> {
  const lowerText = text.toLowerCase();

  // Sentiment Analysis
  const positiveWords = ["good", "excellent", "great", "success", "completed", "ahead", "improved", "quality", "safe", "efficient"];
  const negativeWords = ["delay", "problem", "issue", "concern", "behind", "risk", "unsafe", "poor", "failed", "shortage"];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });

  const totalWords = text.split(/\s+/).length;
  const sentimentScore = (positiveCount - negativeCount) / Math.max(totalWords / 10, 1);
  const normalizedScore = Math.max(-1, Math.min(1, sentimentScore));

  let sentimentLabel: "positive" | "neutral" | "negative";
  if (normalizedScore > 0.2) sentimentLabel = "positive";
  else if (normalizedScore < -0.2) sentimentLabel = "negative";
  else sentimentLabel = "neutral";

  // Extract key topics
  const keyTopics: string[] = [];
  const topicKeywords = {
    "construction": ["construction", "building", "concrete", "steel"],
    "safety": ["safety", "ppe", "accident", "hazard"],
    "budget": ["budget", "cost", "expense", "payment"],
    "timeline": ["schedule", "deadline", "delay", "timeline"],
    "quality": ["quality", "inspection", "standard", "specification"],
    "labor": ["worker", "labor", "staff", "team"],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      keyTopics.push(topic);
    }
  }

  // Detect risk flags
  const riskFlags: string[] = [];
  const riskKeywords = {
    "Safety Concern": ["unsafe", "accident", "injury", "hazard"],
    "Schedule Delay": ["delay", "behind", "postpone", "late"],
    "Budget Overrun": ["over budget", "excess cost", "overrun"],
    "Quality Issue": ["defect", "poor quality", "substandard", "failed inspection"],
    "Labor Shortage": ["shortage", "understaffed", "lacking workers"],
    "Material Issue": ["material shortage", "supply delay", "unavailable"],
  };

  for (const [flag, keywords] of Object.entries(riskKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      riskFlags.push(flag);
    }
  }

  // Generate AI summary (simplified extraction)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const aiSummary = sentences.slice(0, 2).join(". ").trim() + (sentences.length > 2 ? "..." : "");

  return {
    sentiment_score: Number(normalizedScore.toFixed(2)),
    sentiment_label: sentimentLabel,
    key_topics: keyTopics.length > 0 ? keyTopics : ["general"],
    risk_flags: riskFlags,
    ai_summary: aiSummary || text.substring(0, 100) + (text.length > 100 ? "..." : ""),
  };
}
