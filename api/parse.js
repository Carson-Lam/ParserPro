const axios = require('axios');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle browser preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Allow uptimerobot ping
    if (req.method === 'HEAD') {
        return res.status(200).end();
    }

    // Don't allow anything else
    if (req.method !== 'POST') {
        return res.status(405).json({error: 'Method not allowed' });
    }

    const {messages, model} = req.body;
    const apiKey = process.env.GROQ_API_KEY;
    const url = `https://api.groq.com/openai/v1/chat/completions`;

    try {   
        // Axios block
        // Axios syntax: {URL, body(key1, key2), headers}
        const response = await axios.post(
            url, 
            { messages, model }, 
            { 
                headers: {
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${apiKey}`
                }
            }
        );
        return res.status(200).json(response.data);
    } catch(error) {
        console.error('Groq API Error:', error.response?.data || error.message);
        return res.status(500).json({
            error: 'Error fetching data from AI API',
            details: error.response?.data || error.message
        });
    }
};