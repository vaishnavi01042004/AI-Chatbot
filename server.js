const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai')
require('dotenv').config();


const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let systemPrompt = `You are Study Buddy, a friendly and encouraging AI tutor.
You help students understand concepts in Physics, Chemistry, Maths, and other subjects.
Rules you follow:
- Explain things in simple language, use analogies and real-life examples.
- If a student asks a question, first appreciate their curiosity, then answer.
- Use step-by-step explanations for problem solving.
- Keep responses concise but thorough.
- Add a fun fact or tip at the end when relevant.
- Use emojis sparingly to keep things friendly.`;

function getModel() {
    return genAi.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        systemInstruction: systemPrompt
    });
}

const conversation = {};

app.post('/api/chat', async (req, res) => {
    try {
        const { message, sessionId = "default" } = req.body;

        if(!message) {
            return res.status(400).json({
                error: "Message is required!"
            });
        }

        const model = getModel();

        const chat = model.startChat({
            history: conversation[sessionId], 
        });

        const result = await chat.sendMessage(message);
        const reply = result.response.text();

        conversation[sessionId].push(
            {role: "user", parts: [{text: message}]},
            {role: "model", parts: [{text: reply}]}
        );

        res.json({reply});
    } catch(error) {
        console.error(`Gemini API error: ${error.message}`);
        res.status(500).json({
            error: "Failed to get response from AI"
        });
    }
});

app.post('/api/persona', (req, res) => {
    const { persona } = req.body;

    const personas = {
        tutor: `You are Study Buddy, a friendly and encouraging AI tutor.
    You help students understand concepts in Physics, Chemistry, Maths, and other subjects.
    Rules: Explain simply, use analogies, step-by-step solutions, keep it concise, add fun facts.`,
        coder: `You are Code Guru, a patient programming mentor.
    You help students learn to code in JavaScript, Python, and other languages.
    Rules: Use beginner-friendly language, always show code examples, explain line by line, suggest practice exercises.`,
        quiz: `You are Quiz Master, an interactive quiz bot.
    When a student picks a topic, you ask them quiz questions one at a time.
    Rules: Start with easy questions, get harder gradually, give hints if they are stuck, celebrate correct answers, explain wrong answers kindly.`,
        motivator: `You are Coach Spark, a motivational study coach.
    You help students stay focused, plan their study schedule, and stay motivated.
    Rules: Be energetic and positive, give practical study tips, help break down big goals into small tasks, share inspiring stories of scientists and achievers.`,
    };

    if(personas[persona]) {
        systemPrompt = personas[persona];

        conversation["default"] = [];

        res.json({success: true, persona});
    } else {
        res.status(400).json({
            error: "Unknown persona"
        });
    }
});

app.post('/api/reset', (req, res) => {
    const {sessionId = "default"} = req.body;

    conversation[sessionId] = [];

    res.json({
        success: true,
        message: "Coversation Cleared!"
    });
});

app.listen(PORT, () => {
    console.log("Server running on http://localhost:" + PORT);
});