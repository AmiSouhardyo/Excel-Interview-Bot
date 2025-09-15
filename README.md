# Excel AI Mock Interview

A prototype web application that conducts AI-powered Excel interview sessions using Google's Gemini AI.

## Features

- AI-generated advanced Excel interview questions
- Real-time answer evaluation with detailed feedback
- Comprehensive performance summary and recommendations
- Modern, responsive web interface
- Session-based interview flow

## Quick Start

### Prerequisites
- Node.js 20 or later
- Google Gemini API key

### Local Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variable:**
   
   **On Windows:**
   ```cmd
   set GEMINI_API_KEY=your_api_key_here
   ```
   
   **On Mac/Linux:**
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and use it as your `GEMINI_API_KEY`

## How to Use

1. Enter your name and click "Start Interview"
2. Answer each question in the provided text area
3. Click "Submit Answer" to get AI evaluation
4. Continue through all 8 questions
5. Click "Finish & Get Summary" for comprehensive feedback

## Technical Notes

- **Storage:** This prototype uses in-memory storage. For production, replace with Firestore or Supabase
- **AI Costs:** Each question generation, answer evaluation, and summary costs API credits
- **JSON Validation:** The server includes fallback parsing for robust AI response handling

## Deployment Options

### Recommended Hosting Platforms:
- **Render:** Simple deployment with environment variable support
- **Google Cloud Run:** Serverless container deployment
- **Vercel:** Easy deployment for full-stack applications
- **Railway:** Simple Node.js deployment

### Environment Variables for Deployment:
```
GEMINI_API_KEY=your_actual_api_key
PORT=3000 (usually auto-set by hosting platform)
```

## Project Structure

```
excel-ai-mock-interview/
├── package.json          # Dependencies and scripts
├── server.js             # Express server with AI integration
├── public/
│   └── index.html        # Frontend interface
├── samples/
│   └── transcripts.json  # Example session data
├── README.md             # This file
└── .gitignore           # Git ignore rules
```

## Sample Questions Coverage

The AI generates questions covering:
- Advanced formulas and functions
- Data analysis and visualization
- Pivot tables and advanced features
- VBA/Macros (basic level)
- Data modeling and best practices
- Performance optimization
- Error handling and debugging
- Financial modeling concepts

## Contributing

This is a prototype application. For production use:
1. Replace in-memory storage with a database
2. Add user authentication
3. Implement rate limiting
4. Add comprehensive error handling
5. Add tests

## License

MIT



