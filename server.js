const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { nanoid } = require('nanoid/non-secure');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error('API key is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const sessions = {}; // in production use Firestore / Supabase

const transcriptsFile = './transcripts.json';
let transcripts = [];
if (fs.existsSync(transcriptsFile)) {
  transcripts = JSON.parse(fs.readFileSync(transcriptsFile, 'utf8'));
}

const prompt_generate_questions = (topic) => `Generate an array of 10 advanced Excel interview questions tailored to the ${topic} department. Return only the JSON array of 10 question strings.`;

const prompt_evaluate_answer = (question, answer) => `Evaluate the following answer to this Excel interview question, prioritizing the answer's content for relevance, accuracy, and depth. Only generate follow-up questions if the answer is meaningful and related to the question.
Question: ${question}
Answer: ${answer}
Return only JSON with:
"score": number from 0 to 10 with one decimal place (e.g., 8.5),
"justification": string explaining the score,
"improvement": string with suggestions for improvement,
"example_answer": string with a good example answer,
"followups": array of 1 to 5 relevant follow-up question strings based on the answer's accuracy, depth, and relevance to the original question (at least 1, max 5). Return an empty array [] if the answer is nonsensical, irrelevant, gibberish, or completely unrelated to the question (e.g., no meaningful content or off-topic). For incorrect but meaningful answers, generate follow-ups that address specific misconceptions or weaknesses without generating irrelevant questions.`;

const prompt_summary = (topic, qa, questions) => `You are summarizing an Excel mock interview for ${topic}.
Based on the following questions, answers, and evaluations:
${qa.map((r, i) => `
Question ${i+1}: ${questions[r.questionId] || r.question}
Answer: ${r.answer}
Evaluation: score ${r.evaluation.score}, justification: ${r.evaluation.justification}, improvement: ${r.evaluation.improvement}
`).join('\n')}
Return only JSON with:
"verdict": a single sentence verdict on the candidate's performance,
"pros": a paragraph describing the candidate's strengths,
"cons": a paragraph describing the candidate's weaknesses,
"areas_of_improvement": a paragraph with areas for improvement.`;

async function callLLM(prompt) {
  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    try {
      return JSON.parse(text);
    } catch {
      const start = text.indexOf('{') !== -1 ? text.indexOf('{') : text.indexOf('[');
      const end = text.lastIndexOf('}') + 1 || text.lastIndexOf(']') + 1;
      if (start !== -1 && end > start) {
        try {
          return JSON.parse(text.substring(start, end));
        } catch {}
      }
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

app.post('/start-session', async (req, res) => {
  const { name, topic } = req.body;
  if (!name || !topic) return res.status(400).json({ error: 'Missing name or topic' });
  const sessionId = nanoid();
  const prompt = prompt_generate_questions(topic);
  let questions = await callLLM(prompt);
  if (!questions || !Array.isArray(questions) || questions.length !== 10) {
    questions = [
      'What are advanced uses of VLOOKUP in Excel?',
      'How do you optimize large datasets in Excel?',
      'Explain how to create a dynamic dashboard in Excel.',
      'How can you use Power Query to clean data?',
      'What are the benefits of using PivotTables for data analysis?',
      'How do you implement conditional formatting with formulas?',
      'Describe the use of array formulas in Excel.',
      'How do you automate repetitive tasks using VBA?',
      'What is the difference between INDEX/MATCH and VLOOKUP?',
      'How do you handle errors in Excel formulas?'
    ];
  }
  sessions[sessionId] = { name, topic, questions, responses: [], followups: Array(10).fill([]), currentFollowupIndex: Array(10).fill(0), startTime: Date.now() };
  res.json({ sessionId, questions });
});

app.post('/answer', async (req, res) => {
  const { sessionId, questionId, answer, isFollowup, followupIndex } = req.body;
  const session = sessions[sessionId];
  if (!session) return res.status(400).json({ error: 'No session' });
  const elapsed = (Date.now() - session.startTime) / 60000;
  if (elapsed > 30 && !answer) return res.status(400).json({ error: 'Time up' });
  let question;
  if (isFollowup) {
    question = session.followups[questionId][followupIndex];
  } else {
    question = session.questions[questionId];
  }
  if (!question) return res.status(400).json({ error: 'Invalid question' });
  const prompt = prompt_evaluate_answer(question, answer);
  let evaluation = await callLLM(prompt);
  if (!evaluation || typeof evaluation.score !== 'number' || evaluation.score < 0 || evaluation.score > 10) {
    evaluation = {
      score: 5.0,
      justification: 'Fallback evaluation',
      improvement: 'Fallback improvement',
      example_answer: 'Fallback example',
      followups: []
    };
  } else {
    evaluation.score = Math.round(evaluation.score * 10) / 10; // Ensure one decimal place
  }
  const responseEntry = { questionId, answer, evaluation };
  if (isFollowup) {
    responseEntry.isFollowup = true;
    responseEntry.followupIndex = followupIndex;
  } else if (evaluation.followups && evaluation.followups.length > 0) {
    session.followups[questionId] = evaluation.followups;
    delete evaluation.followups; // Don't store followups in evaluation
  }
  session.responses.push(responseEntry);
  res.json({ ok: true, followups: isFollowup ? [] : (session.followups[questionId] || []) });
});

app.post('/summary', async (req, res) => {
  const { sessionId } = req.body;
  const session = sessions[sessionId];
  if (!session) return res.status(400).json({ error: 'No session' });
  const qa = session.responses;
  // Group responses by main question
  const scoresByMainQuestion = Array(10).fill().map((_, i) => {
    const main = qa.find(r => r.questionId === i && !r.isFollowup);
    const followups = qa.filter(r => r.questionId === i && r.isFollowup);
    const scores = [
      main ? main.evaluation.score : 0,
      ...followups.map(f => f.evaluation.score)
    ].filter(s => s > 0);
    return scores.length ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
  });
  const totalScore = scoresByMainQuestion.reduce((sum, s) => sum + s, 0); // Scale to 100 (10 questions * 10 max score)
  const allQuestions = [...session.questions];
  session.followups.forEach((followupArray, mainId) => {
    followupArray.forEach((f, subId) => {
      allQuestions.push(f);
    });
  });
  const prompt = prompt_summary(session.topic, qa, allQuestions);
  let summary = await callLLM(prompt);
  if (!summary) {
    summary = {
      verdict: `Candidate performance was average with a total score of ${totalScore.toFixed(1)}/100`,
      pros: 'Fallback pros',
      cons: 'Fallback cons',
      areas_of_improvement: 'Fallback areas'
    };
  } else {
    summary.verdict = `${summary.verdict} Total score: ${totalScore.toFixed(1)}/100`;
  }
  const transcript = {
    Name: session.name,
    'Final Verdict': summary.verdict,
    'Areas of improvement': summary.areas_of_improvement,
    Pros: summary.pros,
    Cons: summary.cons,
    Questions: {},
    'Candidate Answers': {},
    'LLM Answers': {},
    Evaluations: {}
  };
  qa.sort((a, b) => a.questionId - b.questionId).forEach((r, i) => {
    const mainIdx = r.questionId + 1;
    let key = `Q${mainIdx}`;
    if (r.isFollowup) {
      key = `Q${mainIdx}.${r.followupIndex + 1}`;
    }
    transcript.Questions[key] = r.isFollowup ? session.followups[r.questionId][r.followupIndex] : session.questions[r.questionId];
    transcript['Candidate Answers'][key.replace('Q', 'A')] = r.answer;
    transcript['LLM Answers'][key.replace('Q', 'L')] = r.evaluation.example_answer;
    transcript.Evaluations[key.replace('Q', 'E')] = {
      score: r.evaluation.score,
      justification: r.evaluation.justification,
      improvement: r.evaluation.improvement
    };
  });
  transcripts.push(transcript);
  fs.writeFileSync(transcriptsFile, JSON.stringify(transcripts, null, 2), 'utf8');
  delete sessions[sessionId];
  res.json({ ok: true, message: 'Thank you for taking the test and we\'ll contact you if you get selected.' });
});

app.listen(port, () => console.log(`Server running on port ${port}`));