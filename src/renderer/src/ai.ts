import OpenAI from "openai";
import { userCredits } from './lib/supabase';

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || "";

const deepseekClient = API_KEY ? new OpenAI({
  apiKey: API_KEY,
  baseURL: "https://api.deepseek.com",
  dangerouslyAllowBrowser: true // Required for browser/Electron renderer
}) : null;

// Types for lecture analysis
export interface LectureAnalysis {
  keyConcepts: string[];
  mainPoints: string[];
  definitions: { term: string; definition: string }[];
  simplifiedNotes: string;
  recap: string;
  studyGuide: string;
  testWorthy: string[];
  formulas: string[];
}

// Updated function signature to accept 'transcript' and 'userId'
export async function askAI(mode: string, scannedText: string, transcript: string, userInstruction: string = "", userId?: string | null) {
  try {
    // Check if user is signed in
    if (!userId) {
      return "Error: Please sign in to use AI features.";
    }

    // Check if user has credits
    const canMakeRequest = await userCredits.canMakeRequest(userId);
    if (!canMakeRequest) {
      return "Error: You don't have enough credits. Please purchase more credits to continue.";
    }

    // Check if API key is set
    if (!API_KEY || !deepseekClient) {
      console.error("API Key check failed. API_KEY:", API_KEY ? `Present (${API_KEY.length} chars)` : "Missing");
      return "Error: Please set your DeepSeek API key in the .env file as VITE_DEEPSEEK_API_KEY";
    }

    let systemInstruction = "";

    switch (mode) {
      case "Study":
        systemInstruction = `You are a tutor helping a student learn. Your response style should:
- Explain concepts clearly and thoroughly
- Break down complex ideas into simpler parts
- Simplify difficult topics
- Use examples to illustrate points
- Avoid giving final answers immediately unless absolutely necessary
- Guide the student to understand, not just memorize
- Use the visual content and lecture transcript to provide context-aware explanations
- If the transcript conflicts with the screen, mention the discrepancy

Focus on teaching and understanding, not just providing answers.`;
        break;
      case "Solve":
        systemInstruction = `You are a homework helper. Your response style should:
- Provide step-by-step logic and reasoning
- Fill in any missing steps in the solution process
- Show all work by default
- Place the final answer at the BOTTOM of your response
- Use the transcript for hints if the professor mentioned specific methods or approaches
- Make each step clear and explain why it's necessary

Format: Show all steps first, then end with "Final Answer: [answer]" at the bottom.`;
        break;
      case "Cheat":
        systemInstruction = `You are an answer generator for quick responses. Your response MUST be formatted in two parts:

1. INSTANT ANSWER (at the top): Give the final answer immediately, clearly marked
2. STEPS (optional, below): Provide the work/steps in a separate section

Format your response EXACTLY like this:
---ANSWER---
[The final answer here]

---STEPS---
[The step-by-step work here - this section is optional and can be hidden]

If the user only needs the answer, they'll see just the ANSWER section. The STEPS section will be hidden by default but can be shown with a button.`;
        break;
      default:
        systemInstruction = "Help with the following content.";
    }

    console.log("Calling DeepSeek API with mode:", mode);
    
    const completion = await deepseekClient.chat.completions.create({
      model: "deepseek-chat", // DeepSeek V3.2 model
      messages: [
        {
          role: "system",
          content: systemInstruction
        },
        {
          role: "user",
          content: `--- 1. SCANNED VISUAL CONTENT (What is on the user's screen) ---\n${scannedText}\n\n--- 2. LECTURE TRANSCRIPT (What was said recently) ---\n${transcript}\n\n--- 3. USER NOTES ---\n${userInstruction}`
        }
      ],
      temperature: mode === "Cheat" ? 0.2 : mode === "Solve" ? 0.5 : 0.7, // Lower temperature for Cheat (deterministic), medium for Solve (structured), higher for Study (creative)
    });

    const answer = completion.choices[0]?.message?.content || "No response from AI";
    
    // Deduct credits after successful response
    try {
      await userCredits.deductCredits(userId, 1);
      console.log("✅ Credits deducted successfully");
    } catch (creditError) {
      console.error("Failed to deduct credits:", creditError);
      // Don't fail the request if credit deduction fails, but log it
    }
    
    return answer;
    
  } catch (error: any) {
    console.error("AI Error Details:", error);
    console.error("Error message:", error?.message);
    
    // Handle DeepSeek-specific errors
    if (error?.status === 402) {
      return "Error: Insufficient balance on the DeepSeek API account. Please contact support.";
    }
    
    return `Error: Could not reach the AI. ${error?.message || "Check your internet or API key."}`;
  }
}

// ============================================
// PHASE 1: LECTURE ANALYSIS FEATURES
// ============================================

// Helper function to call AI without the complex mode logic
async function callAISimple(systemPrompt: string, userPrompt: string, userId: string | null, temperature: number = 0.5): Promise<string> {
  if (!userId) {
    throw new Error("Please sign in to use AI features.");
  }

  const canMakeRequest = await userCredits.canMakeRequest(userId);
  if (!canMakeRequest) {
    throw new Error("You don't have enough credits. Please purchase more credits to continue.");
  }

  if (!API_KEY || !deepseekClient) {
    throw new Error("Please set your DeepSeek API key in the .env file as VITE_DEEPSEEK_API_KEY");
  }

  const completion = await deepseekClient.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature
  });

  const answer = completion.choices[0]?.message?.content || "";
  
  // Deduct credits
  try {
    await userCredits.deductCredits(userId, 1);
    console.log("✅ Credits deducted for lecture analysis");
  } catch (creditError) {
    console.error("Failed to deduct credits:", creditError);
  }
  
  return answer;
}

// Extract key concepts and definitions from lecture
export async function extractKeyConcepts(transcript: string, scannedText: string, userId: string | null): Promise<{ concepts: string[]; definitions: { term: string; definition: string }[] }> {
  const systemPrompt = `You are an expert at analyzing lecture content. Extract the most important concepts and definitions.

Your response MUST be in this exact JSON format (no markdown, just raw JSON):
{
  "concepts": ["concept 1", "concept 2", "concept 3"],
  "definitions": [
    {"term": "term1", "definition": "definition1"},
    {"term": "term2", "definition": "definition2"}
  ]
}

Rules:
- Extract 5-10 key concepts that are most important to understand
- Include any terms that were explicitly defined
- Focus on foundational ideas, not minor details
- Keep definitions concise (1-2 sentences max)`;

  const userPrompt = `Analyze this lecture content and extract key concepts and definitions:

TRANSCRIPT:
${transcript || "(No transcript available)"}

SCREEN CONTENT:
${scannedText || "(No screen content available)"}`;

  try {
    const response = await callAISimple(systemPrompt, userPrompt, userId, 0.3);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse key concepts:", error);
    return { concepts: [], definitions: [] };
  }
}

// Extract main teaching points
export async function extractMainPoints(transcript: string, scannedText: string, userId: string | null): Promise<string[]> {
  const systemPrompt = `You are an expert at identifying the main teaching points from a lecture. Focus on what the professor emphasized as most important.

Your response MUST be a JSON array of strings (no markdown, just raw JSON):
["Main point 1", "Main point 2", "Main point 3"]

Rules:
- Extract 5-8 main teaching points
- Focus on what the professor clearly emphasized
- Include any points that were repeated or stressed
- Prioritize actionable takeaways over general statements`;

  const userPrompt = `Extract the main teaching points from this lecture:

TRANSCRIPT:
${transcript || "(No transcript available)"}

SCREEN CONTENT:
${scannedText || "(No screen content available)"}`;

  try {
    const response = await callAISimple(systemPrompt, userPrompt, userId, 0.3);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse main points:", error);
    return [];
  }
}

// Generate simplified bullet-point notes
export async function generateSimplifiedNotes(transcript: string, scannedText: string, userId: string | null): Promise<string> {
  const systemPrompt = `You are an expert note-taker. Convert lecture content into clean, organized bullet-point notes.

Rules:
- Use clear hierarchical structure with main topics and sub-points
- Keep each bullet concise (1 line ideally)
- Group related information together
- Use simple language that's easy to review
- Include any important examples mentioned
- Format with proper indentation using spaces (2 spaces per level)

Example format:
• Topic 1
  • Sub-point A
  • Sub-point B
• Topic 2
  • Sub-point A
    • Detail
  • Sub-point B`;

  const userPrompt = `Convert this lecture into clean bullet-point notes:

TRANSCRIPT:
${transcript || "(No transcript available)"}

SCREEN CONTENT:
${scannedText || "(No screen content available)"}`;

  try {
    return await callAISimple(systemPrompt, userPrompt, userId, 0.4);
  } catch (error) {
    console.error("Failed to generate notes:", error);
    return "Failed to generate notes. Please try again.";
  }
}

// Generate end-of-lecture recap
export async function generateRecap(transcript: string, scannedText: string, userId: string | null): Promise<{ summary: string; reviewTopics: string[]; nextSteps: string[] }> {
  const systemPrompt = `You are an expert at summarizing lectures. Create a concise end-of-lecture recap.

Your response MUST be in this exact JSON format (no markdown, just raw JSON):
{
  "summary": "A 2-3 sentence summary of what was covered",
  "reviewTopics": ["Topic to review 1", "Topic to review 2"],
  "nextSteps": ["Suggested next step 1", "Suggested next step 2"]
}

Rules:
- Summary should capture the essence in 2-3 sentences max
- Include 3-5 topics that need review/study
- Suggest 2-3 actionable next steps for the student`;

  const userPrompt = `Create an end-of-lecture recap:

TRANSCRIPT:
${transcript || "(No transcript available)"}

SCREEN CONTENT:
${scannedText || "(No screen content available)"}`;

  try {
    const response = await callAISimple(systemPrompt, userPrompt, userId, 0.4);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to generate recap:", error);
    return { summary: "", reviewTopics: [], nextSteps: [] };
  }
}

// Generate comprehensive study guide (One-Click Study Guide)
export async function generateStudyGuide(transcript: string, scannedText: string, userId: string | null): Promise<{
  title: string;
  keyConcepts: string[];
  definitions: { term: string; definition: string }[];
  formulas: string[];
  mainTakeaways: string[];
  testLikelyTopics: string[];
  studyTips: string[];
}> {
  const systemPrompt = `You are an expert study guide creator. Generate a comprehensive study guide from lecture content.

Your response MUST be in this exact JSON format (no markdown, just raw JSON):
{
  "title": "Lecture Topic Title",
  "keyConcepts": ["concept1", "concept2"],
  "definitions": [{"term": "term", "definition": "definition"}],
  "formulas": ["formula1 = expression", "formula2 = expression"],
  "mainTakeaways": ["takeaway1", "takeaway2"],
  "testLikelyTopics": ["topic likely on test 1", "topic2"],
  "studyTips": ["tip1", "tip2"]
}

Rules:
- Title should reflect the main topic of the lecture
- Include 5-10 key concepts
- Extract ALL definitions mentioned
- Extract ALL formulas/equations (if any, empty array if none)
- Include 3-5 main takeaways
- Identify 3-5 topics most likely to appear on tests
- Provide 2-3 specific study tips for this material`;

  const userPrompt = `Create a comprehensive study guide from this lecture:

TRANSCRIPT:
${transcript || "(No transcript available)"}

SCREEN CONTENT:
${scannedText || "(No screen content available)"}`;

  try {
    const response = await callAISimple(systemPrompt, userPrompt, userId, 0.3);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to generate study guide:", error);
    return {
      title: "Study Guide",
      keyConcepts: [],
      definitions: [],
      formulas: [],
      mainTakeaways: [],
      testLikelyTopics: [],
      studyTips: []
    };
  }
}
