// =========================== GLOBAL STATE ===================================

// Manipulable variables
let selectedText = "";
let inputText = "";
let fileContext = inputText; // For trimming
let parsing = false;
let currentPage = 1;
window.currentPage = currentPage;

// Visualization state
let detectedAlgorithm = null;
let extractedArray = null;

// DOM element references
const infoButton = document.getElementById("infoButton");
const infoPopup = document.getElementById("infoPopup");
const textarea = document.getElementById("codeInput");
const grabBar = document.getElementById("grabBar");
const iframe = document.getElementById('frameExplanation');
const goButton = document.getElementById('goButton');
const MAX_FILE_SIZE = 1000; // ~ 125 tokens
let isDragging = false;

// AI Conversation history array init
let conversationHistory = [{
    role: 'system',
    content: 'You are an expert software engineer with decades of experience in understanding and explaining code.'
}];


// =========================== PAGE DETECTION  ===================================
// Listen for page changes from iframes
window.addEventListener('message', function(event) {
    if (event.data?.pageNumber !== undefined) {
        window.currentPage = event.data.pageNumber;
        console.log('Page changed to:', window.currentPage);
    }
});

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
        goButton.parentNode.replaceChild(backButton, goButton); 

        // Handle back button click
        backButton.addEventListener('click', function () {
            parsing = false;
            highlightArea.parentNode.replaceChild(textarea, highlightArea);
            backButton.parentNode.replaceChild(goButton, backButton);

            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage({ action: 'backButtonClicked' }, '*');
            } 

            // Reset all states
            conversationHistory = [{
                role: 'system',
                content: 'You are an expert software engineer with decades of experience in understanding and explaining code.'
            }];

            detectedAlgorithm = null;
            extractedArray = null;

            console.log("all states cleared!");

        });

        // Add code context to conversation, but trim files that are too large (save tokens!!)
        if (inputText.length > MAX_FILE_SIZE) {
            const halfSize = MAX_FILE_SIZE / 2;
            fileContext = 
                inputText.substring(0, halfSize) 
                + '\n\n... [middle section truncated] ...\n\n' // Take first few and last few chars to preserve structure
                + inputText.substring(inputText.length - halfSize);
            console.log(`Large file trimmed: ${inputText.length} → ${fileContext.length} chars`);
        } else {
            fileContext = inputText;
        }

        conversationHistory.push({
            role: 'system',
            content: `The user has submitted code for analysis. Consider this context when explaining highlighted sections:\n\n${fileContext}`
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

// ======================== CALLING AI FUNCTIONS =================================
// Trim conversation history w sliding window to Keep  history manageable
function trimConversationHistory() {
    const MAX_HISTORY_ITEMS = 10; // Keep last 10 messages (5 exchanges)
    
    if (conversationHistory.length > MAX_HISTORY_ITEMS) {
        const systemMessages = conversationHistory.slice(0, 3); // System + file context
        const recentMessages = conversationHistory.slice(-MAX_HISTORY_ITEMS + 3);
        conversationHistory = [...systemMessages, ...recentMessages];
        
        console.log("Trimmed conversation history to", conversationHistory.length, "messages");
    } 
}

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
        
        trimConversationHistory(); 

        return airesponse;
    } catch (error) {
        console.error('AI API Error: ', error.message);
        return null;
    }
}

// ======================== PAGE SPECIFIC HANDLERS =================================
// CASE 1: Explanation Page - Generate code explanation
async function handleExplanationPage() {
    console.log("Generating explanation...");
    const prompt = 
        `Analyze the highlighted code and provide a concise, detailed explanation.

        You MUST follow this response structure:

        # Title
        ## **Code Summary** 
        - Explain the broader role of the highlighted code within the entire code (3-4 sentences)
        - Explain the role of the entire code (that includes the highlighted)
        ## **Key Concepts** 
        - Main programming concepts used
        ## **Line-By-Line** 
        - Line by line breakdown translating what each line does (MUST use code blocks)

        Use markdown formatting. Be direct and technical - no conversational fluff.
        Add a space between each bullet point (-).
        Consider the wider code as context which you recieved in a previous chat completion.
        If input is not code, respond with ONLY "# MISSING CODE".`;

    if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ explanation: 'Generating response...' }, "*");
    }

    const explanation = await callAI(prompt)

    if (explanation && iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ explanation: explanation}, "*");
    }
}

// CASE 2: Visualization page - Detect sorting algorithm and extract array
async function handleVisualizationPage() {
    console.log("Detecting sorting algorithm...");

    // Extract algorithm from code, return [one word identifier]
    const algorithmPrompt = `Analyze the code and identify if it contains a sorting algorithm.
    Respond with ONLY one word from this list: bubble, insertion, selection, quick, merge, counting, radix, heap, bucket
    If no sorting algorithm is found, respond with: default`;

    let algorithm = await callAI(algorithmPrompt);
    algorithm = algorithm?.toLowerCase().trim()  || 'default'; //In case AI gives inconsistent case
    console.log(algorithm);

    if (!algorithm || algorithm === 'default') {
        console.log(" No sorting algorithm detected! ");
        
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ 
                vizError: 'No sorting algorithm detected in the highlighted code.' 
            }, '*');
        }
        return;
    }

    console.log("Detected algorithm: ", algorithm)

    // Extract array from code, return [array as list]
    const arrayPrompt = `Analyze the code and identify if it contains an array
    or any kind of list of values, intended to be sorted.  
    - If so, extract the array literal from the code.
    - If not, generate a dummy array with 5-10 random integers between 1-50.
    Respond with ONLY the array values, comma seperated, no brackets or extra text.`;

    const arrayData = await callAI(arrayPrompt);
    console.log(arrayData);

    if (arrayData) {
        
        detectedAlgorithm = algorithm;
        extractedArray = arrayData;
        
        // Send action to iframe
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ 
                action: 'generateVisualization',
                algorithm: algorithm,
                arrayData: arrayData
            }, '*');

        }
    }
}

// CASE 3: Performance page - Analyze time, space, and provide improvements
async function handleComplexityPage() {
    console.log("Analyzing time complexity...");

    // Extract algorithm from code, return [one word identifier]
    const complexityPrompt = `Analyze the complexity of the highlighted code.

    You MUST follow this response structure:
    # Time Complexity:
    | Case         | Complexity |
    |--------------|------------|
    | Best Case    | O(...)     |
    | Average Case | O(...)     |
    | Worst Case   | O(...)     |
    # Space Complexity:
    | Type       | Complexity |
    |------------|------------|
    | Auxiliary  | O(...)     |
    | Total      | O(...)     |
    # Performance Factors
    - Break down parts of the code (USE CODE BLOCKS) that contribute to the complexity
    # Optimization Ideas 
    - How to improve it

    Use markdown formatting. Be technical and concise.
    If input is not code, respond with "MISSING CODE".`;
    if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ explanation: 'Analyzing complexity...' }, "*");
    }

    const complexity = await callAI(complexityPrompt);

    if (complexity && iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ explanation: complexity }, "*");
    }
}

// ======================== ENTER KEY HANDLER =================================
document.addEventListener('keydown', async function (event) {
    if (event.key !== 'Enter' || !parsing) return;

    console.log("Processing highlighted code...");
    checkHighlightedText();

    // Don't call handlers if no text selected
    if (!selectedText) {
        console.log("No text selected");
        return;
    }

    // Route to appropriate handler based on current page
    switch (window.currentPage) {
        case 1:
            await handleExplanationPage();
            break;
        case 2:
            await handleVisualizationPage();
            break;
        case 3:
            await handleComplexityPage();
            break;
        default:
            console.error("Unknown page:", window.currentPage);
    }
});

// =========================== RESIZABLE TEXTAREA =============================
if (grabBar && textarea) {
    grabBar.addEventListener("mousedown", (e) => {
        isDragging = true;
        document.body.style.cursor = "ns-resize";
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const newHeight = e.clientY - textarea.getBoundingClientRect().top;
        textarea.style.height = Math.max(100, newHeight) + "px";
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        document.body.style.cursor = "default";
    });
}