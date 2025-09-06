const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

// Restrict CORS to only your frontend URL for better security
// Replace with your actual frontend URL, e.g., 'https://yonasgr.onrender.com'
const frontendUrl = 'https://yonasgr.onrender.com';
const corsOptions = {
  origin: frontendUrl,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Get sensitive keys from environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Validate that environment variables are set
if (!BOT_TOKEN || !CHAT_ID) {
    console.error('Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not found in environment variables.');
    // Exit the application if essential variables are missing
    process.exit(1);
}

// Helper function to sanitize user input for HTML
function sanitizeInput(text) {
    // Check if text is a string before calling .replace()
    if (typeof text !== 'string') {
        return '';
    }
    return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

app.post('/send-message', async (req, res) => {
    try {
        // Only destructure the fields you are sending from the frontend
        const { name, email, message } = req.body;

        // Sanitize all user input to prevent injection
        const sanitizedName = sanitizeInput(name);
        const sanitizedEmail = sanitizeInput(email);
        const sanitizedMessage = sanitizeInput(message);

        const telegramMessage = `
📩 <b>New Contact Form Submission</b>
👤 <b>Name:</b> ${sanitizedName}
📧 <b>Email:</b> ${sanitizedEmail}
💬 <b>Message:</b>
${sanitizedMessage}
        `;

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: telegramMessage,
                parse_mode: 'HTML'
            })
        });

        const result = await response.json();

        if (result.ok) {
            res.status(200).json({ success: true, message: 'Message sent successfully!' });
        } else {
            // Log the Telegram API error for debugging
            console.error('Telegram API Error:', result);
            res.status(500).json({ success: false, message: 'Failed to send message.' });
        }
    } catch (error) {
        // Log the full error to the console for debugging
        console.error('Error in /send-message route:', error);
        res.status(500).json({ success: false, message: 'An error occurred.' });
    }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
