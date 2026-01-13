// =========================== TAB STATE ===================================
let tabs = [
    {
        id: 'tab_0',
        name: 'Welcome.txt',
        content: `// WELCOME TO PARSERPRO!`,
        parsing: false,
        conversationHistory: [{
            role: 'system',
            content: 'You are an expert software engineer with decades of experience in understanding and explaining code.'
        }],
        fileContext: ''
    }
];

let activeTabId = 'tab_0';
let tabIdCounter = 1;
let draggedTabId = null;
let dragOverTabId = null;

// =========================== GLOBAL STATE ===================================

// Manipulable variables
let selectedText = "";
let lastSelectedText = "";
let enterCooldown = false; // Submission debounce
let currentPage = 1;
let currentAbortController = null; // For cancelling API reqs on pg swap, back button
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
const MAX_FILE_SIZE = 1000; // ~ 125 tokens
let isDragging = false;


// =========================== TAB INITIALIZATION ===================================
function getActiveTab() {
    return tabs.find(tab => tab.id === activeTabId);
}

function getTabById(id) {
    return tabs.find(tab => tab.id === id);
}

function getTabIndexById(id) {
    return tabs.findIndex(tab => tab.id === id);
}

// Create tab: -define properties, -reset conversationHistory, -push to tabs array
function createNewTab(name = null, content = '') {
    const newName = name || `Untitled-${tabIdCounter}.txt`;
    const newTab = {
        id: `tab_${tabIdCounter}`,
        name: newName,
        content: content,
        parsing: false,
        conversationHistory: [{
            role: 'system',
            content: 'You are an expert software engineer with decades of experience in understanding and explaining code.'
        }],
        fileContext: content
    };

    tabs.push(newTab);
    tabIdCounter++;
    
    console.log(`Created new tab: ${newName}`);
    return newTab.id;
}

// Switch tabs: -save current tab content, -load new tab content, -update new tab UI, -pass new tab state 
function switchTab(newTabId) {
    if (newTabId === activeTabId) return;
    
    const oldTab = getActiveTab();
    const newTab = getTabById(newTabId);
    
    if (!newTab) {
        console.error(`Tab ${newTabId} not found`);
        return;
    }
    
    saveCurrentTabState();
    
    activeTabId = newTabId;
    console.log(`Switched to tab: ${newTab.name}`);
    
    loadTabState(newTab);
    renderTabs();
    
    if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ parsingState: newTab.parsing }, '*');
    }
}

// Close tabs: -Don't close if only 1, -Swap to rightmost tab in index (Math.max) if current closed
function closeTab(tabId) {
    if (tabs.length === 1) {
        console.log('Cannot close last tab');
        return;
    }
    
    const tabIndex = getTabIndexById(tabId);
    if (tabIndex === -1) return;
    
    const closingActiveTab = (tabId === activeTabId);
    
    tabs.splice(tabIndex, 1);
    console.log(`Closed tab: ${tabId}`);
    
    if (closingActiveTab) {
        const newActiveIndex = Math.max(0, tabIndex - 1);
        switchTab(tabs[newActiveIndex].id);
    } else {
        renderTabs();
    }
}

// Reorder tabs
function reorderTab(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    
    const [movedTab] = tabs.splice(fromIndex, 1);
    tabs.splice(toIndex, 0, movedTab);
    
    console.log(`Reordered tab from ${fromIndex} to ${toIndex}`);
    renderTabs();
}

// Save tab: -Save highlight area data in activeTab properties (whether parsing or editing stage)
function saveCurrentTabState() {
    const activeTab = getActiveTab();
    if (!activeTab) return;
    
    const textarea = document.getElementById('codeInput');
    const highlightArea = document.getElementById('highlightArea');
    
    if (textarea) {
        activeTab.content = textarea.value;
    } else if (highlightArea) {
        activeTab.content = highlightArea.textContent;
    }
}

// Load tab state: Replace tab area data with stored tab.content content (both parsing, edit stages)
function loadTabState(tab) {
    const textarea = document.getElementById('codeInput');
    const highlightArea = document.getElementById('highlightArea');
    const toggleButton = document.getElementById('toggleParseButton');

    if (tab.parsing) {
        if (textarea) {
            const newHighlightArea = document.createElement('pre');
            newHighlightArea.classList.add('highlightArea');
            newHighlightArea.id = 'highlightArea';
            newHighlightArea.innerHTML = Prism.highlight(
                tab.content, 
                Prism.languages.javascript, 
                'javascript'
            );
            textarea.parentNode.replaceChild(newHighlightArea, textarea);
        } else if (highlightArea) {
            highlightArea.innerHTML = Prism.highlight(
                tab.content, 
                Prism.languages.javascript, 
                'javascript'
            );
        }
        if (toggleButton) {
            toggleButton.textContent = "⮜ [ EDIT MODE ]";
            toggleButton.dataset.mode = 'edit';
        }
    } else {
        // Switch to edit mode
        if (highlightArea) {
            const newTextarea = document.createElement('textarea');
            newTextarea.id = 'codeInput';
            newTextarea.name = 'codeInput';
            newTextarea.required = true;
            newTextarea.placeholder = 'Enter your code here...';
            newTextarea.value = tab.content;
            highlightArea.parentNode.replaceChild(newTextarea, highlightArea);
        } else if (textarea) {
            textarea.value = tab.content;
        }
        
        if (toggleButton) {
            toggleButton.textContent = "⮞ [ PARSE MODE ]";
            toggleButton.dataset.mode = 'parse';
        }
    }
}

// Render tabs: Render tab button, active styling, (conditional) close button, using appendChild
function renderTabs(){
    const tabContainer = document.getElementById('tabContainer');
    if (!tabContainer) return; // Prevents getting container before DOM loads
    tabContainer.innerHTML = '';
    
    tabs.forEach((tab, index) => {
        const tabButton = document.createElement('button');
        tabButton.className = 'tab-button';
        tabButton.dataset.tabId = tab.id;
        tabButton.draggable = true;
        
        if (tab.id === activeTabId) {
            tabButton.classList.add('active');
        }
        
        const fileIcon = document.createElement('img');
        fileIcon.src = '../images/file.png';
        fileIcon.className = 'file-icon';
        tabButton.appendChild(fileIcon);
        
        const tabName = document.createElement('span');
        tabName.className = 'tab-name';
        tabName.textContent = tab.name;
        tabButton.appendChild(tabName);
        
        if (tabs.length > 1) {
            const closeBtn = document.createElement('span');
            closeBtn.className = 'tab-close';
            closeBtn.textContent = '✕';
            tabButton.appendChild(closeBtn);
        }
        
        tabContainer.appendChild(tabButton);
    });
    
    // Add new tab button
    const newTabBtn = document.createElement('button');
    newTabBtn.className = 'new-tab-button';
    newTabBtn.textContent = '+';
    newTabBtn.title = 'New tab';
    tabContainer.appendChild(newTabBtn);
    
    // Update scroll fade effect
    updateScrollFade();
}

function updateScrollFade() {
    const tabContainer = document.getElementById('tabContainer');
    if (!tabContainer) return;
    
    const isOverflowing = tabContainer.scrollWidth > tabContainer.clientWidth;
    const isScrolledToEnd = tabContainer.scrollLeft + tabContainer.clientWidth >= tabContainer.scrollWidth - 5;
    
    if (isOverflowing && !isScrolledToEnd) {
        tabContainer.classList.add('has-overflow');
    } else {
        tabContainer.classList.remove('has-overflow');
    }
}

// =========================== TAB EVENTS ===================================
document.addEventListener('DOMContentLoaded', function() {
    const tabContainer = document.getElementById('tabContainer');
    if (!tabContainer) return; // Prevents getting container before DOM loads

    // Handle Tab clicks events
    tabContainer.addEventListener('click', function(e) {
        const tabButton = e.target.closest('.tab-button');
        const closeButton = e.target.closest('.tab-close');
        const newTabButton = e.target.closest('.new-tab-button');
        
        if (closeButton && tabButton) {
            e.stopPropagation();
            const tabId = tabButton.dataset.tabId;
            closeTab(tabId);
        } else if (tabButton) {
            const tabId = tabButton.dataset.tabId;
            switchTab(tabId);
        } else if (newTabButton) {
            const newId = createNewTab();
            switchTab(newId);
        }
    });
    
    // Handle tab Drag and drop events
    tabContainer.addEventListener('dragstart', function(e) {
        const tabButton = e.target.closest('.tab-button');
        if (!tabButton) return;
        
        draggedTabId = tabButton.dataset.tabId;
        tabButton.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    });
    
    tabContainer.addEventListener('dragover', function(e) {
        e.preventDefault();
        const tabButton = e.target.closest('.tab-button');
        if (!tabButton || !draggedTabId) return;
        
        dragOverTabId = tabButton.dataset.tabId;
        
        // Remove all drag-over classes
        tabContainer.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('drag-over');
        });
        
        // Add drag-over class to current target
        if (draggedTabId !== dragOverTabId) {
            tabButton.classList.add('drag-over');
        }
    });
    
    tabContainer.addEventListener('dragleave', function(e) {
        const tabButton = e.target.closest('.tab-button');
        if (tabButton) {
            tabButton.classList.remove('drag-over');
        }
    });
    
    tabContainer.addEventListener('drop', function(e) {
        e.preventDefault();
        const tabButton = e.target.closest('.tab-button');
        
        if (!tabButton || !draggedTabId || !dragOverTabId) return;
        if (draggedTabId === dragOverTabId) return;
        
        const fromIndex = getTabIndexById(draggedTabId);
        const toIndex = getTabIndexById(dragOverTabId);
        
        reorderTab(fromIndex, toIndex);
        
        tabContainer.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('drag-over', 'dragging');
        });
        
        draggedTabId = null;
        dragOverTabId = null;
    });
    
    tabContainer.addEventListener('dragend', function(e) {
        const tabButton = e.target.closest('.tab-button');
        if (tabButton) {
            tabButton.classList.remove('dragging');
        }
        
        tabContainer.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('drag-over');
        });
        
        draggedTabId = null;
        dragOverTabId = null;
    });
    
    // Fade effect
    tabContainer.addEventListener('scroll', updateScrollFade);
    window.addEventListener('resize', updateScrollFade);
});

// ======================= TOGGLE PARSE/EDIT BUTTON ===============================
document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggleParseButton');
    if (!toggleButton) return;
    
    toggleButton.addEventListener('click', function(e) {
        e.preventDefault();
        
        const activeTab = getActiveTab();
        const currentMode = toggleButton.dataset.mode || 'parse';
        
        // Parsing mode enter: Replace text area, feed trimmed input to AI for context, give state to iframe
        if (currentMode === 'parse') {
            saveCurrentTabState();
            activeTab.parsing = true;
            
            //Create syntax-highlighted code view using PRISM.js
            const textarea = document.getElementById('codeInput');
            if (textarea) {
                const highlightArea = document.createElement('pre');
                highlightArea.classList.add('highlightArea');
                highlightArea.id = 'highlightArea';
                highlightArea.innerHTML = Prism.highlight(
                    activeTab.content, 
                    Prism.languages.javascript, 
                    'javascript'
                );
                textarea.parentNode.replaceChild(highlightArea, textarea);
            }
            
            toggleButton.textContent = "⮜ [ EDIT MODE ]";
            toggleButton.dataset.mode = 'edit';
            
            // Trim input if necessary (save tokens!!), feed to AI for context
            const inputText = activeTab.content;
            let fileContext;
            if (inputText.length > MAX_FILE_SIZE) {
                const halfSize = MAX_FILE_SIZE / 2;
                fileContext = 
                    inputText.substring(0, halfSize) 
                    + '\n\n... [middle section truncated] ...\n\n'  // Take first few and last few chars to preserve structure
                    + inputText.substring(inputText.length - halfSize);
            } else {
                fileContext = inputText;
            }
            activeTab.fileContext = fileContext;
            activeTab.conversationHistory.push({
                role: 'system',
                content: `The user has submitted code for analysis. Consider this context when explaining highlighted sections:\n\n${fileContext}`
            });

            // Give parsing state to iframe
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage({ parsingState: true }, '*');
            }
        // Editing mode enter: Replace text area, feed trimmed input to AI for context, give state to iframe
        } else {
            if (currentAbortController) {
                currentAbortController.abort();
            }
            
            // Reset all states (array, visualization vars, conversation history)
            activeTab.conversationHistory = [{
                role: 'system',
                content: 'You are an expert software engineer with decades of experience in understanding and explaining code.'
            }];
            activeTab.parsing = false;
            lastSelectedText = "";
            detectedAlgorithm = null;
            extractedArray = null;
            
            // Create editing view
            const highlightArea = document.getElementById('highlightArea');
            if (highlightArea) {
                const textarea = document.createElement('textarea');
                textarea.id = 'codeInput';
                textarea.name = 'codeInput';
                textarea.required = true;
                textarea.placeholder = 'Enter your code here...';
                textarea.value = activeTab.content;
                highlightArea.parentNode.replaceChild(textarea, highlightArea);
            }
            
            toggleButton.textContent = "⮞ [ PARSE MODE ]";
            toggleButton.dataset.mode = 'parse';
            
            // Give parsing state to iframe
            if (iframe?.contentWindow) {
                iframe.contentWindow.postMessage({ parsingState: false }, '*');
            }
        }
    });
});

// =========================== PAGE DETECTION ===================================
// Take pgnum from iframe, stop API calls, give parsing state to iframe
window.addEventListener('message', function (event) { 

    if (event.data?.pageNumber !== undefined) {
        window.currentPage = event.data.pageNumber;
        console.log("Page swapped to: " + window.currentPage);


        if (currentAbortController) {
            currentAbortController.abort();
        }
         
        const activeTab = getActiveTab();
        if (iframe?.contentWindow && activeTab) {
            iframe.contentWindow.postMessage({ parsingState: activeTab.parsing }, '*');
        }
        console.log("Passed state parsingState: " + activeTab.parsing);

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
// Function to trim conversation history w sliding window to keep history manageable
function trimConversationHistory() {
    const MAX_HISTORY_ITEMS = 10; 
    
    if (conversationHistory.length > MAX_HISTORY_ITEMS) {
        const systemMessages = conversationHistory.slice(0, 3); 
        const recentMessages = conversationHistory.slice(-MAX_HISTORY_ITEMS + 3);
        console.log("Trimmed conversation history to", conversationHistory.length, "messages");
        return [...systemMessages, ...recentMessages];
    } 
    return conversationHistory;

}

// Function to callAI, params: (page function prompt, keep history yes/no)
async function callAI(systemPrompt, persistHistory = true) {
    const activeTab = getActiveTab();
    const conversationHistory = activeTab.conversationHistory;
    const fileContext = activeTab.fileContext;

    const messagesToSend = persistHistory 
        ? [...conversationHistory, 
            { role: 'system', content: systemPrompt },
            { role: 'user', content: selectedText }]
        : [ // If history is not kept, don't use conversationHistory array
            { role: 'system', content: 'You are an expert software engineer with decades of experience in understanding and explaining code.' },
            { role: 'system', content: `The user has submitted code for analysis. Consider this context when explaining highlighted sections:\n\n${fileContext}` },
            { role: 'system', content: systemPrompt },
            { role: 'user', content: selectedText }
        ];
    try {
        currentAbortController = new AbortController();

        // Fetch block 
        // Fetch syntax: {method, headers, body(key1, key2)}
        const response = await fetch(`https://parserpro.onrender.com/parse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messagesToSend,
                model: 'llama-3.3-70b-versatile' 
            }),
            signal: currentAbortController.signal
        });

        const completion = await response.json();
        const airesponse = completion.choices[0].message.content.trim();

        // If user did not submit code, don't append AI response to history
        if (persistHistory && airesponse != '# MISSING CODE') { 
            activeTab.conversationHistory.push({role: 'assistant', content: airesponse});
            activeTab.conversationHistory = trimConversationHistory(activeTab.conversationHistory);
        }

        return airesponse;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('API request cancelled');
            return null;
        }
        console.error('AI API Error: ', error.message);
        return null;
    } finally {
        currentAbortController = null;
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
        If input is not code, respond with ONLY "# MISSING CODE" and nothing else.`;

    if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ explanation: 'Generating response...' }, "*");
    }

    const explanation = await callAI(prompt, true);

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
    Only the word should be returned. If no sorting algorithm is found, respond with: default`;
    if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ visualization: 'Detecting sorting algorithm...' }, "*");
    }
    let algorithm = await callAI(algorithmPrompt, false);
    algorithm = algorithm?.toLowerCase().trim()  || 'default'; //In case AI gives inconsistent case
    console.log(algorithm);

    // ERROR: Pass error state to frame
    if (!algorithm || algorithm === 'default') {
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ 
                visualization: 'No sorting algorithm detected in the highlighted code.' 
            }, '*');
        }
        return;
    }

    // Extract array from code, return [array as list]
    const arrayPrompt = `Analyze the code and identify if it contains an array
    or any kind of list of values, intended to be sorted.  
    - If so, extract the array literal from the code.
    - If not, generate a dummy array with 5-10 random integers between 1-50.
    Respond with ONLY the array values, comma seperated, no brackets or extra text.`;

    const arrayData = await callAI(arrayPrompt, false);
    console.log(arrayData);

    // SUCCESS: Pass successful output state to frame
    if (arrayData) {
        
        detectedAlgorithm = algorithm;
        extractedArray = arrayData;
        
        iframe.contentWindow.postMessage({ 
            visualization: {
                algorithm: algorithm, 
                arrayData: arrayData
            }
        }, '*');
    }
}

// CASE 3: Performance page - Analyze time, space, and provide improvements
async function handleComplexityPage() {
    console.log("Analyzing time complexity...");

    // Analyze code, return [complexity values]
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

    const complexity = await callAI(complexityPrompt, false);

    // ERROR: Pass error state to frame
    if (!complexity || complexity === 'MISSING CODE') {
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage({ 
                explanation: 'Failed to analyze time complexity.' 
            }, '*');
        }
        return;
    }

    // SUCCESS: Pass successful output state to frame
    if (complexity && iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ explanation: complexity }, "*");
    }
}

// ======================== ENTER KEY HANDLER =================================
document.addEventListener('keydown', async function (event) {
    const activeTab = getActiveTab();
    if (event.key !== 'Enter' || !activeTab?.parsing) return;

    checkHighlightedText();

    // Validate submission to save tokens:
    // - prevent duplicates, - prevent empty selections, - prevent debounce spam
    if (!selectedText || enterCooldown) {
        console.log("Invalid selection! Dupliate/Empty/Too Fast submission!");
        return;
    }
    lastSelectedText = selectedText;
    enterCooldown = true;

    try{
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
        console.log("Conversation Length: " + activeTab.conversationHistory.length);
    } finally {
        setTimeout(() => {
            enterCooldown = false; // Debounce time of 1.5s until enterCooldown flag reset
    }, 1500);
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

        const textareaEl = document.getElementById('codeInput');
        if (!textareaEl) return;
        const newHeight = e.clientY - textareaEl.getBoundingClientRect().top;
        textareaEl.style.height = Math.max(100, newHeight) + "px";
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
        document.body.style.cursor = "default";
    });
}

// =========================== INITIALIZATION ===================================
function initializeApp() {
    renderTabs();
    const activeTab = getActiveTab();

    // Load welcome tab content
    if (activeTab && textarea) {
        textarea.value = activeTab.content;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}