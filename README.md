Here is a simple README.md file for the "Excel AI Mock Interview" project, formatted for GitHub.

-----

### Excel AI Mock Interview

A prototype web application that conducts AI-powered Excel interview sessions using Google's Gemini AI.

#### Features

  * AI-generated advanced Excel interview questions
  * Real-time answer evaluation with detailed feedback
  * Comprehensive performance summary and recommendations
  * Modern, responsive web interface
  * Session-based interview flow

-----

### Quick Start

#### Prerequisites

  * Node.js 20 or later
  * Google Gemini API key

#### Local Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Set up environment variable:**
      * **On Windows:**
        ```cmd
        set GEMINI_API_KEY=your_api_key_here
        ```
      * **On Mac/Linux:**
        ```bash
        export GEMINI_API_KEY="your_api_key_here"
        ```
3.  **Start the server:**
    ```bash
    npm start
    ```
4.  **Open in browser:**
    ```
    http://localhost:3000
    ```

-----

### Project Structure

```
excel-ai-mock-interview/
├── package.json          # Dependencies and scripts
├── server.js             # Express server with AI integration
├── public/
│   └── index.html        # Frontend interface
├── samples/
│   └── transcripts.json  # Example session data
└── README.md             # This file
```

-----

