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

// ============================================
// PHASE 2: INTERACTIVE FEATURES
// ============================================

// Learning styles type
export type LearningStyle = 'simple' | 'visual' | 'stepbystep' | 'analogies' | 'default';

// Get learning style system prompt modifier
function getLearningStylePrompt(style: LearningStyle): string {
  switch (style) {
    case 'simple':
      return `
IMPORTANT: Explain in the SIMPLEST terms possible.
- Use everyday language, avoid jargon
- Break complex ideas into tiny pieces
- Use short sentences
- Assume the reader has no background knowledge
- Define any technical term you must use`;
    case 'visual':
      return `
IMPORTANT: Create VISUAL explanations.
- Use mental images and descriptions the reader can picture
- Describe things as if painting a picture
- Use spatial relationships (above, below, flows into, connects to)
- Include diagrams described in words (e.g., "Imagine a flowchart where...")
- Use color and shape metaphors when helpful`;
    case 'stepbystep':
      return `
IMPORTANT: Explain in a STRUCTURED, step-by-step manner.
- Number every step clearly (Step 1, Step 2, etc.)
- Each step should be one clear action or concept
- Show the logical progression from start to finish
- Explain WHY each step leads to the next
- Include checkpoints to verify understanding`;
    case 'analogies':
      return `
IMPORTANT: Explain using REAL-WORLD ANALOGIES.
- Compare every concept to something from everyday life
- Use relatable examples (cooking, sports, social media, etc.)
- Start with "Think of it like..." or "It's similar to..."
- Make the unfamiliar feel familiar
- Use multiple analogies if helpful`;
    default:
      return '';
  }
}

// Tap-to-Explain: Explain a specific transcript segment
export async function explainSegment(
  segmentText: string, 
  fullTranscript: string, 
  scannedText: string, 
  userId: string | null,
  learningStyle: LearningStyle = 'default'
): Promise<string> {
  const stylePrompt = getLearningStylePrompt(learningStyle);
  
  const systemPrompt = `You are a patient tutor explaining a specific part of a lecture.

The student has clicked on a specific segment they want explained. Focus ONLY on explaining that segment clearly.
${stylePrompt}

Rules:
- Focus specifically on the selected text
- Use context from the full transcript to give better explanations
- Keep the explanation concise but thorough (2-4 paragraphs max)
- If it's a term, define it clearly
- If it's a concept, break it down
- If it's a formula, explain each part
- Use the screen content for additional context if relevant`;

  const userPrompt = `SELECTED SEGMENT (explain THIS specifically):
"${segmentText}"

FULL TRANSCRIPT (for context):
${fullTranscript || "(No transcript available)"}

SCREEN CONTENT (additional context):
${scannedText || "(No screen content)"}

Please explain the selected segment clearly.`;

  try {
    return await callAISimple(systemPrompt, userPrompt, userId, 0.5);
  } catch (error: any) {
    console.error("Failed to explain segment:", error);
    throw error;
  }
}

// Context Tool: "What does the teacher mean here?"
export async function explainTeacherMeaning(
  selectedText: string,
  fullTranscript: string,
  scannedText: string,
  userId: string | null,
  learningStyle: LearningStyle = 'default'
): Promise<string> {
  const stylePrompt = getLearningStylePrompt(learningStyle);
  
  const systemPrompt = `You are an expert at interpreting what professors mean in lectures.

The student is confused about what the teacher meant by something specific. Help them understand the teacher's intent and meaning.
${stylePrompt}

Rules:
- Interpret the professor's words in context
- Explain the underlying concept they're trying to teach
- Clarify any implied knowledge or assumptions
- Connect to broader course themes if apparent
- If the meaning is ambiguous, present possible interpretations`;

  const userPrompt = `WHAT THE STUDENT IS CONFUSED ABOUT:
"${selectedText}"

FULL LECTURE CONTEXT:
${fullTranscript || "(No transcript available)"}

VISUAL CONTEXT:
${scannedText || "(No screen content)"}

What does the teacher mean by this? Explain clearly.`;

  try {
    return await callAISimple(systemPrompt, userPrompt, userId, 0.5);
  } catch (error: any) {
    console.error("Failed to explain teacher meaning:", error);
    throw error;
  }
}

// Context Tool: "Give me context from before this point"
export async function getContextBefore(
  selectedText: string,
  fullTranscript: string,
  scannedText: string,
  userId: string | null
): Promise<string> {
  const systemPrompt = `You are helping a student understand context in a lecture.

The student wants to understand what came before a specific point in the lecture and how it connects.

Rules:
- Summarize what was discussed before this point
- Explain how earlier content leads to this point
- Identify key concepts that were introduced earlier that relate to this
- Show the logical flow of the lecture
- Keep it concise - focus on relevant context only`;

  const userPrompt = `THE POINT IN QUESTION:
"${selectedText}"

FULL TRANSCRIPT:
${fullTranscript || "(No transcript available)"}

SCREEN CONTENT:
${scannedText || "(No screen content)"}

What context from earlier in the lecture helps understand this point? Summarize what came before.`;

  try {
    return await callAISimple(systemPrompt, userPrompt, userId, 0.4);
  } catch (error: any) {
    console.error("Failed to get context:", error);
    throw error;
  }
}

// Context Tool: Extract all formulas from lecture
export async function extractFormulas(
  transcript: string,
  scannedText: string,
  userId: string | null
): Promise<{ formula: string; explanation: string }[]> {
  const systemPrompt = `You are an expert at identifying and explaining mathematical formulas and equations.

Extract ALL formulas, equations, and mathematical expressions from the lecture content.

Your response MUST be in this exact JSON format (no markdown, just raw JSON):
[
  {"formula": "E = mc²", "explanation": "Energy equals mass times the speed of light squared"},
  {"formula": "F = ma", "explanation": "Force equals mass times acceleration"}
]

Rules:
- Include ALL formulas mentioned (written or spoken)
- Include any equations shown on screen
- Provide a brief explanation for each (1 sentence)
- If no formulas exist, return an empty array []
- Include variable definitions if mentioned`;

  const userPrompt = `Extract all formulas and equations from this lecture:

TRANSCRIPT:
${transcript || "(No transcript available)"}

SCREEN CONTENT:
${scannedText || "(No screen content)"}`;

  try {
    const response = await callAISimple(systemPrompt, userPrompt, userId, 0.2);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to extract formulas:", error);
    return [];
  }
}

// Rewrite content in a specific learning style
export async function rewriteInStyle(
  content: string,
  style: LearningStyle,
  userId: string | null
): Promise<string> {
  const stylePrompt = getLearningStylePrompt(style);
  
  const styleNames: Record<LearningStyle, string> = {
    simple: 'simple, easy-to-understand language',
    visual: 'visual, descriptive language with mental images',
    stepbystep: 'structured, step-by-step format',
    analogies: 'real-world analogies and comparisons',
    default: 'clear, educational language'
  };
  
  const systemPrompt = `You are an expert at adapting educational content to different learning styles.

Rewrite the following content using ${styleNames[style]}.
${stylePrompt}

Rules:
- Keep ALL the information from the original
- Transform the presentation style completely
- Make it feel like it was written for someone who learns best this way
- Don't add new information, just present it differently`;

  const userPrompt = `Rewrite this content in a ${styleNames[style]} style:

${content}`;

  try {
    return await callAISimple(systemPrompt, userPrompt, userId, 0.6);
  } catch (error: any) {
    console.error("Failed to rewrite content:", error);
    throw error;
  }
}

// Quick context question - general purpose
export async function askContextQuestion(
  question: string,
  transcript: string,
  scannedText: string,
  userId: string | null,
  learningStyle: LearningStyle = 'default'
): Promise<string> {
  const stylePrompt = getLearningStylePrompt(learningStyle);
  
  const systemPrompt = `You are a helpful tutor answering questions about lecture content.

The student has a specific question about what was covered. Answer based on the lecture content provided.
${stylePrompt}

Rules:
- Answer the specific question asked
- Use information from the transcript and screen
- Be concise but thorough
- If the answer isn't in the content, say so
- Connect to broader concepts when helpful`;

  const userPrompt = `STUDENT'S QUESTION:
${question}

LECTURE TRANSCRIPT:
${transcript || "(No transcript available)"}

SCREEN CONTENT:
${scannedText || "(No screen content)"}

Answer the question based on the lecture content.`;

  try {
    return await callAISimple(systemPrompt, userPrompt, userId, 0.5);
  } catch (error: any) {
    console.error("Failed to answer context question:", error);
    throw error;
  }
}

// ============================================
// PHASE 3: ADVANCED INTELLIGENCE FEATURES
// ============================================

// Types for transcript analysis
export interface TranscriptSegmentAnalysis {
  segmentIndex: number;
  segmentText: string;
  timestamp: string;
  tags: ('new_topic' | 'example' | 'definition' | 'review' | 'important' | 'test_worthy' | 'confusing' | 'summary')[];
  topicLabel?: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  isTestWorthy: boolean;
  isConfusing: boolean;
  notes?: string;
}

export interface LectureAnalysisResult {
  segments: TranscriptSegmentAnalysis[];
  topics: { name: string; startIndex: number; endIndex: number }[];
  testWorthyCount: number;
  confusingCount: number;
}

// Auto-Timestamps: Analyze transcript and tag sections
export async function analyzeTranscriptSections(
  segments: { time: string; text: string }[],
  scannedText: string,
  userId: string | null
): Promise<TranscriptSegmentAnalysis[]> {
  if (segments.length === 0) return [];
  
  const systemPrompt = `You are an expert at analyzing lecture transcripts. Analyze each segment and tag it appropriately.

Your response MUST be a JSON array (no markdown, just raw JSON) with one object per segment:
[
  {
    "segmentIndex": 0,
    "tags": ["new_topic", "definition"],
    "topicLabel": "Introduction to Derivatives",
    "importance": "high",
    "isTestWorthy": true,
    "isConfusing": false,
    "notes": "Key definition introduced"
  }
]

Available tags:
- "new_topic" - A new subject/topic is being introduced
- "example" - An example or demonstration is being given
- "definition" - A term or concept is being defined
- "review" - Previously covered material is being reviewed
- "important" - Professor emphasizes this is important
- "test_worthy" - Likely to appear on exam (phrases like "this will be on the test", "remember this", "important to know")
- "confusing" - Complex explanation, professor repeats themselves, or uses hedging language
- "summary" - Summarizing or wrapping up a topic

Importance levels:
- "low" - Background info, tangents
- "medium" - Regular lecture content
- "high" - Key concepts, emphasized points
- "critical" - Must-know, explicitly marked as test material

Rules:
- Analyze EACH segment provided
- A segment can have multiple tags
- Look for phrases like "this is important", "remember this", "on the exam" for test_worthy
- Look for repetition, "let me explain again", complex phrasing for confusing
- topicLabel should be a short 2-5 word description when a new topic starts`;

  // Format segments for analysis
  const segmentsList = segments.map((seg, i) => 
    `[${i}] ${seg.time}: ${seg.text}`
  ).join('\n');

  const userPrompt = `Analyze these lecture transcript segments:

${segmentsList}

${scannedText ? `\nSCREEN CONTEXT:\n${scannedText}` : ''}

Return a JSON array with analysis for each segment.`;

  try {
    const response = await callAISimple(systemPrompt, userPrompt, userId, 0.3);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(cleaned);
    
    // Merge with original segment data
    return segments.map((seg, i) => {
      const aiAnalysis = analysis.find((a: any) => a.segmentIndex === i) || {};
      return {
        segmentIndex: i,
        segmentText: seg.text,
        timestamp: seg.time,
        tags: aiAnalysis.tags || [],
        topicLabel: aiAnalysis.topicLabel,
        importance: aiAnalysis.importance || 'medium',
        isTestWorthy: aiAnalysis.isTestWorthy || false,
        isConfusing: aiAnalysis.isConfusing || false,
        notes: aiAnalysis.notes
      };
    });
  } catch (error) {
    console.error("Failed to analyze transcript sections:", error);
    return segments.map((seg, i) => ({
      segmentIndex: i,
      segmentText: seg.text,
      timestamp: seg.time,
      tags: [],
      importance: 'medium' as const,
      isTestWorthy: false,
      isConfusing: false
    }));
  }
}

// Test-Worthy Detection: Find sections likely to be on exams
export async function detectTestWorthySections(
  transcript: string,
  scannedText: string,
  userId: string | null
): Promise<{
  sections: { text: string; reason: string; confidence: 'likely' | 'very_likely' | 'certain' }[];
  summary: string;
}> {
  const systemPrompt = `You are an expert at identifying test-worthy material in lectures.

Identify sections that are likely to appear on exams based on:
1. Explicit mentions ("this will be on the test", "remember this", "important")
2. Repeated emphasis
3. Core concepts and definitions
4. Formulas and key equations
5. Professor's tone and phrasing

Your response MUST be in this exact JSON format (no markdown):
{
  "sections": [
    {
      "text": "The exact quote or paraphrase from the lecture",
      "reason": "Why this is likely test material",
      "confidence": "likely" | "very_likely" | "certain"
    }
  ],
  "summary": "A brief summary of the most test-critical topics"
}

Confidence levels:
- "certain" - Professor explicitly said it would be on the test
- "very_likely" - Strong emphasis, repeated multiple times, or core definition
- "likely" - Important concept but not explicitly emphasized`;

  const userPrompt = `Identify test-worthy material in this lecture:

TRANSCRIPT:
${transcript || "(No transcript)"}

SCREEN CONTENT:
${scannedText || "(No screen content)"}

Find all sections likely to be on exams.`;

  try {
    const response = await callAISimple(systemPrompt, userPrompt, userId, 0.3);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to detect test-worthy sections:", error);
    return { sections: [], summary: "Unable to analyze test-worthy content." };
  }
}

// Confusion Detection: Find potentially confusing parts
export async function detectConfusingSections(
  transcript: string,
  scannedText: string,
  userId: string | null
): Promise<{
  sections: { 
    text: string; 
    reason: string; 
    suggestion: string;
    severity: 'minor' | 'moderate' | 'significant' 
  }[];
  overallClarity: 'clear' | 'mostly_clear' | 'somewhat_confusing' | 'very_confusing';
}> {
  const systemPrompt = `You are an expert at identifying confusing parts in lectures that students might struggle with.

Look for:
1. Complex explanations without examples
2. Jargon without definitions
3. Professor repeating themselves or rephrasing (sign they know it's confusing)
4. Quick transitions between topics
5. Abstract concepts without concrete examples
6. Contradictory or unclear statements
7. Dense information delivered too quickly

Your response MUST be in this exact JSON format (no markdown):
{
  "sections": [
    {
      "text": "The confusing part (quote or paraphrase)",
      "reason": "Why this might confuse students",
      "suggestion": "What the student should do (re-read, ask professor, look up, etc.)",
      "severity": "minor" | "moderate" | "significant"
    }
  ],
  "overallClarity": "clear" | "mostly_clear" | "somewhat_confusing" | "very_confusing"
}

Severity levels:
- "minor" - Slightly unclear but manageable
- "moderate" - Needs extra attention to understand
- "significant" - Likely to cause misunderstanding without clarification`;

  const userPrompt = `Identify confusing parts in this lecture:

TRANSCRIPT:
${transcript || "(No transcript)"}

SCREEN CONTENT:
${scannedText || "(No screen content)"}

Find sections that might confuse students.`;

  try {
    const response = await callAISimple(systemPrompt, userPrompt, userId, 0.4);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to detect confusing sections:", error);
    return { sections: [], overallClarity: 'mostly_clear' };
  }
}

// Topic Timeline: Generate a timeline of topics covered
export async function generateTopicTimeline(
  segments: { time: string; text: string }[],
  userId: string | null
): Promise<{
  timeline: { 
    time: string; 
    topic: string; 
    type: 'intro' | 'deep_dive' | 'example' | 'review' | 'transition';
    duration?: string;
  }[];
  totalTopics: number;
}> {
  if (segments.length === 0) return { timeline: [], totalTopics: 0 };
  
  const systemPrompt = `You are an expert at creating topic timelines from lecture transcripts.

Create a timeline showing when each topic was discussed.

Your response MUST be in this exact JSON format (no markdown):
{
  "timeline": [
    {
      "time": "10:30",
      "topic": "Introduction to Calculus",
      "type": "intro",
      "duration": "5 min"
    }
  ],
  "totalTopics": 5
}

Types:
- "intro" - Topic is first introduced
- "deep_dive" - Detailed explanation of a topic
- "example" - Example or problem solving
- "review" - Reviewing or summarizing
- "transition" - Moving between topics`;

  const segmentsList = segments.map(seg => `${seg.time}: ${seg.text}`).join('\n');

  const userPrompt = `Create a topic timeline from this lecture:

${segmentsList}

Generate a clear timeline of topics covered.`;

  try {
    const response = await callAISimple(systemPrompt, userPrompt, userId, 0.3);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to generate topic timeline:", error);
    return { timeline: [], totalTopics: 0 };
  }
}
