// =========================== GLOBAL STATE ===================================

const { text } = require("express");

// Manipulable variables
let selectedText = "";
let inputText = "";
let parsing = false;
let currentPage = 1;
window.currentPage = currentPage;

// DOM element references
const infoButton = document.getElementById("infoButton");
const infoPopup = document.getElementById("infoPopup");
const textarea = document.getElementById("codeInput");
const grabBar = document.getElementById("grabBar");
const iframe = document.getElementById('frameExplanation');
const goButton = document.getElementById('goButton');
let isDragging = false;

// AI Conversation history array init
let conversationHistory = [{
    role: 'system',
    content: 'You are an expert software engineer with decades of experience in understanding and explaining code.'
}];

// =========================== INFO POPUP ===================================
if (infoButton && infoPopup) {
    infoButton.addEventListener("click", function () {
        const isVisible = (infoPopup.style.display === "block");
        infoPopup.style.display = isVisible ? "none" : "block";
        infoButton.innerHTML = isVisible ? " 🛈 Info " : " ✖ Close ";
    });
}

// =========================== PARSE BUTTON ===================================
if (goButton && textarea) {
    goButton.addEventListener('click', function (event) {
        event.preventDefault();
        parsing = true;
        inputText = textarea.value;

        // Notify iframe about parse action
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ action: 'goButtonClicked' }, '*');
        }

        //Create syntax-highlighted code view using PRISM.js
        const highlightArea = document.createElement('pre');
        highlightArea.classList.add('highlightArea');
        highlightArea.id = 'highlightArea';
        highlightArea.innerHTML = Prism.highlight(
            textarea.value, 
            Prism.languages.javascript, 
            'javascript'
        ); 
        textarea.parentNode.replaceChild(highlightArea, textarea); 

        // Create the back button
        const backButton = document.createElement('button');
        backButton.id = 'backButton'
        backButton.textContent = "⮜ (Back!)";
        goButton.parentNode.replaceChild(backButton, submitButton); 

        // Handle back button click
        backButton.addEventListener('click', function () {
            parsing = false;
            highlightArea.parentNode.replaceChild(textarea, highlightArea);
            backButton.parentNode.replaceChild(submitButton, backButton);

            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage({ action: 'backButtonClicked' }, '*');
            } 

            // Reset conversation history
            conversationHistory = [{
                role: 'system',
                content: 'You are an expert software engineer with decades of experience in understanding and explaining code.'
            }];
            console.log("convo cleared!");
        });

        // Add code context to conversation
        conversationHistory.push({
            role: 'system',
            content: `The user has submitted code for analysis. Consider this context when explaining highlighted sections:\n\n${inputText}`
        });
    });
}

// =========================== TEXT SELECTION =================================
// Handle highlighted text, ensuring that highlighted text is within code box
function checkHighlightedText() {
    const newSelectedText = window.getSelection().toString();
    const highlightArea = document.getElementById('highlightArea');

    // Check if highlighted text is in the highlight area and if anything is highlighted
    if (newSelectedText && highlightArea?.textContent.includes(newSelectedText)) {
        selectedText = newSelectedText;
    }
}

// =========================== AI ANALYSIS ====================================
async function callAI(systemPrompt) {
    conversationHistory.push({ role: 'system', content: systemPrompt });
    conversationHistory.push({ role: 'user', content: selectedText })
    try {
        const response = await fetch(`https://parserpro.onrender.com/parse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: conversationHistory,
                model: 'llama-3.3-70b-versatile'
            })
        });

        const completion = await response.json();
        const airesponse = completion.choices[0].message.content.trim();
        
        conversationHistory.push({
            role: 'assistant',
            content: airesponse
        });

        return airesponse;
    } catch (error) {
        console.error('AI API Error: ', error.message);
        return null;
    }
}

// ======================== PAGE SPECIFIC HANDLERS =================================
// CASE 1: Explanation Page - Generate code expalnation
async function handleExplanationPage() {
    console.log("Generating explanation...");
    const prompt = 
        `Analyze the highlighted code and provide a concise, detailed explanation.
        You must follow this structure:
        <h1>AI Code Breakdown</h1>
        Line separator
        <h3>Code Summary</h3>
        Summary of what the code does 
        Line separator
        <h3>Key Concepts</h3> 
        Rundown of key conccepts used, with each key concept in a subheading
        Line separator
        <h3>Example Uses</h3>
        Header: Example use case if applicable

        Format your response in HTML with proper structure. 
        (h1 for title, h3 for headers, h4 for subheaders, line separators, bullet points for lists)
        Be direct and analytical without conversational fluff.

        Do not:
        - prompt the user for more information
        - Make up false information
        - Analyze any input if it is not code. Instead, only return MISSING CODE as a title.
        `

    if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ explanation: 'Generating response...' }, "*");
    }

    const explanation = await callAI(prompt)

    if (explanation && iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ explanation: 'Generating response...' }, "*");
    }
}

// CASE 2: Visualization page - Detect sorting algorithm and extract array
async function handleVisualizationPage() {
    console.log("Detecting sorting algorithm...");

    // Extract algorithm from code, return [one word identifier]
    const algorithmPrompt = `Analyze the code and identify if it contains a sorting algorithm.
    Respond with ONLY one word from this list: bubble, insertion, selection, quick, merge, counting, radix, heap, bucket
    If no sorting algorithm is found, respond with: default`;

    const algorithm = await callAI(algorithmPrompt);
    algorithm = algorithm.toLowerCase(); //In case AI gives inconsistent case

    if (!algorithm || algorithm === 'default') {
        console.log(" No sorting algorithm detected! ");
        return;
    }

    console.log("Detected algorithm: ", algorithm)
    localStorage.setItem('algorithm', algorithm); // Store algorithm locally

    // Extract array from code, return [array as list]
    const arrayPrompt = `Analyze the code and identify if it contains an array
    or any kind of list of values, intended to be sorted.  
    - If so, exctract the array literal from the code.
    - If not, generate a dummy array with 5-10 random inteegers between 1-50.
    Respond with ONLY the array values, comma seperated, no brackets or extra text.`;

    const arrayData = await callAI(arrayPrompt);

    if (arrayData) {
        localStorage.setItem('arrayData', arrayData)
        console.log('Extracted array: ', arrayData);
    }
}

// CASE 3: Performance page - Analyze time, space, and 
async function handleComplexityPage() {
    console.log("Analyzing time complexity...");

    // Extract algorithm from code, return [one word identifier]
    const complexityPrompt = `Analyze the highlighted code and provide a detailed complexity analysis.
    Your response MUST be formatted in HTML with the following structure:
    <h1>Algorithm Complexity Analysis</h1>
    Line separator
    <h3>Time Complexity:</h3>
    <tr>
    <td><strong>Best Case:</strong> O(...) - brief explanation</td>
    <td><strong>Average Case:</strong> O(...) - brief explanation</td>
    <td><strong>Worst Case:</strong> O(...) - brief explanation</td>
    </tr>
    Line separator
    <h3>Space Complexity:</h3>
    <tr>
    <td><strong>Auxiliary Space:</strong> O(...) - what memory is used</td>
    <td><strong>Total Space:</strong> O(...) - including input</td>
    </tr>
    Line separator
    <h3>Performance Analysis:</h3>
    <ul>
    <li>Key operations and their costs</li>
    <li>Dominant factors affecting performance</li>
    <li>Trade-offs made in the implementation</li>
    </ul>
    Line separator
    <h3>Optimization Suggestions:</h3>
    <ul>
    <li>Specific improvements that could reduce complexity</li>
    <li>Alternative approaches with better performance</li>
    `;

    const complexity = await callAI(complexityPrompt);

    if (!complexity || algorithm === 'default') {
        console.log(" No sorting algorithm detected! ");
        return;
    }

    console.log("Detected algorithm: ", algorithm)
    localStorage.setItem('algorithm', algorithm); // Store algorithm locally

    // Extract array from code, return [array as list]
    const arrayPrompt = `Analyze the code and identify if it contains an array
    or any kind of list of values, intended to be sorted.  
    - If so, exctract the array literal from the code.
    - If not, generate a dummy array with 5-10 random inteegers between 1-50.
    Respond with ONLY the array values, comma seperated, no brackets or extra text.`;

    const arrayData = await callAI(arrayPrompt);

    if (arrayData) {
        localStorage.setItem('arrayData', arrayData)
        console.log('Extracted array: ', arrayData);
    }
}



// Grab bar
grabBar.addEventListener("mousedown", (e) => {
    isDragging = true;
    document.body.style.cursor = "ns-resize";
});

document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const newHeight = e.clientY - textarea.getBoundingClientRect().top;
    textarea.style.height = newHeight + "px";
});

document.addEventListener("mouseup", () => {
    isDragging = false;
    document.body.style.cursor = "default";
});