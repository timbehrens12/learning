# Claude AI Setup for StudyLayer

## Why Claude Instead of OpenAI?

**Claude-3.5-Haiku** is significantly better for educational applications:

### 💰 **Cost Comparison:**
- **Claude-3.5-Haiku**: $0.80 per million input tokens, $4.00 per million output tokens
- **GPT-4o**: $2.50 per million input tokens, $10.00 per million output tokens
- **GPT-4o-mini**: $0.15 per million input tokens, $0.60 per million output tokens

**Result**: Claude-Haiku costs ~70% less than GPT-4o while being smarter!

### 🧠 **Intelligence Comparison:**
- **Claude-3.5-Haiku**: Exceptional at structured reasoning, math, and education
- **GPT-4o**: Very capable but more prone to hallucinations
- **GPT-4o-mini**: Good but not as reliable for complex reasoning

### 📚 **Educational Strengths:**
- Claude excels at step-by-step problem solving
- Better at maintaining logical consistency
- More structured and organized responses
- Less likely to make calculation errors
- Superior at explaining complex concepts

## Getting Your Anthropic API Key

1. **Visit**: https://console.anthropic.com/
2. **Sign up**: Create a new account (use your school email for potential credits)
3. **Navigate**: Go to "API Keys" in the left sidebar
4. **Create**: Click "Create API Key"
5. **Name it**: Something like "StudyLayer Production"
6. **Copy**: The key starts with `sk-ant-api03-`

## Setting Up Credits

1. **Add to .env**:
```bash
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

2. **Test**: The app will validate the key format automatically

## Expected Performance

With Claude-3.5-Haiku, expect:
- **Faster responses** than GPT-4o
- **More accurate math** and science solutions
- **Better structured** educational explanations
- **Lower costs** for the same or better quality

## Usage Limits

- **Free Tier**: $5 in credits to start
- **Pay-as-you-go**: No monthly minimums
- **Enterprise**: Custom pricing available

Perfect for bootstrapping your educational app! 🚀
