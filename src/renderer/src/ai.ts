import OpenAI from 'openai';
import { supabase, userCredits } from './lib/supabase';

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY || "";

// Lazy initialization of DeepSeek client (OpenAI-compatible)
let deepseekClient: OpenAI | null = null;

function getDeepSeekClient(): OpenAI {
  if (!deepseekClient && API_KEY) {
    deepseekClient = new OpenAI({
      apiKey: API_KEY,
      baseURL: 'https://api.deepseek.com',
      dangerouslyAllowBrowser: true
    });
  }
  return deepseekClient!;
}

// Validate API key format
function validateAPIKey(key: string): { valid: boolean; error?: string } {
  if (!key) {
    return { valid: false, error: "No API key configured. Please add your DeepSeek API key to the .env file as VITE_DEEPSEEK_API_KEY" };
  }
  if (!key.startsWith('sk-')) {
    return { valid: false, error: "Invalid API key format. DeepSeek keys should start with 'sk-'" };
  }
  if (key.length < 20) {
    return { valid: false, error: "API key appears to be incomplete. Please check your .env file." };
  }
  return { valid: true };
}

// System prompts optimized for Claude's educational strengths
const SYSTEM_PROMPTS: Record<string, string> = {
  Study: `You are Claude, an exceptional tutor helping students learn effectively. Your teaching philosophy:

🎯 **Educational Approach:**
- Explain complex concepts with crystal-clear logic and step-by-step reasoning
- Use precise analogies that make abstract ideas concrete and memorable
- Break down problems systematically, showing your thought process
- Anticipate student confusion and address it proactively
- Connect new concepts to what the student already knows

📚 **Response Structure:**
- Start with the big picture, then dive into specifics
- Use numbered/bulleted lists for clarity
- Include relevant examples that build intuition
- End with key takeaways or practice suggestions

🎉 **Personality:**
- Encouraging and patient, like a world-class professor
- Honest about uncertainties while being maximally informative
- Focus on building genuine understanding, not just correct answers

When analyzing screen content or transcripts, synthesize information coherently and help students see the connections between different concepts.`,

  Solve: `You are Claude, a master problem-solver with exceptional mathematical and analytical precision. Your approach:

🔍 **Problem-Solving Framework:**
1. **Understand**: Parse the problem completely - identify what's known, what's unknown, what constraints exist
2. **Plan**: Choose the optimal solution strategy based on the problem type
3. **Execute**: Work through the solution with meticulous attention to detail
4. **Verify**: Double-check your work and consider edge cases

📊 **Response Format:**
**Problem Analysis:** [Brief restatement showing you understand]

**Solution Strategy:** [Why this approach is optimal]

**Step-by-Step Solution:**
1. [Clear, logical step]
2. [Next step, building on previous]
3. [Continue until complete]

**Final Answer:** [Clear, unambiguous result]

**Verification:** [How you know this is correct]

🎯 **Key Strengths:**
- Unmatched accuracy in calculations and logical reasoning
- Ability to explain complex solutions simply
- Recognition of multiple solution paths and trade-offs
- Clear communication of mathematical concepts

For academic problems, show the complete thought process while being concise and clear.`
};

// Main AI function with improved error handling
export async function askAI(
  mode: string,
  scannedText: string,
  transcript: string,
  userInstruction: string = "",
  userId?: string
): Promise<string> {
  // Map legacy/UI modes to system prompts
  // 'Instant' or 'Cheat' maps to Solve now
  const promptKey = (mode === 'Explain' || mode === 'Study') ? 'Study' : 'Solve';

  // Check user credits if userId provided
  if (userId) {
    try {
      const canProceed = await userCredits.canMakeRequest(userId);
      if (!canProceed) {
        return `🚫 Credits exhausted! You need more credits to continue.

💡 **Quick Solutions:**
• Buy 50 credits for $4.99 (instant access)
• Upgrade to Pro for $9.99/month (unlimited)

Your progress is saved - just add credits to keep going!`;
      }
    } catch (error) {
      console.error('Credit check failed:', error);
      // Allow request to proceed if credit check fails (fail-safe)
    }
  }

  // Validate API key first
  const keyValidation = validateAPIKey(API_KEY);
  if (!keyValidation.valid) {
    return `Error: ${keyValidation.error}`;
  }

  // Check if we have any context
  const hasScreenContent = scannedText && scannedText.trim().length > 0;
  const hasTranscript = transcript && transcript.trim().length > 0;
  const hasUserInput = userInstruction && userInstruction.trim().length > 0;

  if (!hasScreenContent && !hasTranscript && !hasUserInput) {
    return "Error: No context provided. Please capture your screen or type a question.";
  }

  try {
    // Check and deduct credits if userId provided
    if (userId) {
      try {
        const creditsService = (await import('./lib/supabase')).userCredits;
        const credits = await creditsService.getCredits(userId);

        if (credits.plan === 'free' && credits.credits <= 0) {
          return "Error: You have no credits remaining. Please upgrade to Pro to continue using StudyLayer.";
        }

        if (credits.plan === 'free') {
          await creditsService.deductCredits(userId, 1);
        }
      } catch (creditError) {
        console.error('Credit system error:', creditError);
        // Continue without credit check if system fails
      }
    }

    const deepseek = getDeepSeekClient();
    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.Study;

    // Build context message for DeepSeek
    let contextParts: string[] = [];

    if (hasScreenContent) {
      contextParts.push(`**SCREEN CONTENT:**\n${scannedText.trim()}`);
    }

    if (hasTranscript) {
      contextParts.push(`**LECTURE/AUDIO TRANSCRIPT:**\n${transcript.trim()}`);
    }

    if (hasUserInput) {
      contextParts.push(`**USER REQUEST:**\n${userInstruction.trim()}`);
    }

    const userMessage = contextParts.join('\n\n---\n\n');

    console.log(`[AI] Calling DeepSeek API - Mode: ${mode}, Screen: ${hasScreenContent}, Transcript: ${hasTranscript}, User: ${hasUserInput}`);

    const completion = await deepseek.chat.completions.create({
      model: "deepseek-chat", // DeepSeek V3 model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: promptKey === "Solve" ? 0.1 : 0.7,
      max_tokens: 4000,
    });

    const response = completion.choices[0]?.message?.content || '';

    if (!response) {
      return "Error: No response received from AI. Please try again.";
    }

    // Deduct credits after successful response
    if (userId) {
      try {
        await userCredits.deductCredits(userId, 1);
      } catch (creditError) {
        console.error('Credit deduction failed:', creditError);
        // Don't fail the request if credit deduction fails
      }
    }

    return response;
    
  } catch (error: any) {
    console.error("[AI] Error:", error);

    // Parse specific DeepSeek/OpenAI API error types
    if (error?.status === 401) {
      return "Error: Invalid API key. Please check your DeepSeek API key in the .env file.";
    }
    if (error?.status === 429) {
      return "Error: Rate limit exceeded. Please wait a moment and try again.";
    }
    if (error?.status >= 500) {
      return "Error: DeepSeek service is temporarily unavailable. Please try again in a few seconds.";
    }
    if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
      return "Error: No internet connection. Please check your network and try again.";
    }

    // Generic error
    return `Error: ${error?.error?.message || error?.message || "Failed to get AI response. Please try again."}`;
  }
}

// Check if API is configured
export function isAPIConfigured(): boolean {
  return validateAPIKey(API_KEY).valid;
}

// Get API status for UI
export function getAPIStatus(): { configured: boolean; error?: string } {
  const validation = validateAPIKey(API_KEY);
  return {
    configured: validation.valid,
    error: validation.error
  };
}
