// =========================== CONSTANTS ===================================

const CONFIG = {
    MAX_FILE_SIZE: 1000,
    MAX_HISTORY_ITEMS: 10,
    DEBOUNCE_DELAY: 1500,
    API_ENDPOINT: 'https://parserpro.onrender.com/parse',
    MODEL: 'llama-3.3-70b-versatile'
};

const PAGE_TYPES = {
    EXPLANATION: 1,
    VISUALIZATION: 2,
    COMPLEXITY: 3
};

const SYSTEM_PROMPT = 'You are an expert software engineer with decades of experience in understanding and explaining code.';

const WELCOME_CONTENT = `// WELCOME TO PARSERPRO
// To get started, see *Info* on the top right of your screen!

public static void welcomePage() {
    loadInterface();
    GreetUser(yourName);
}
`

// =========================== STATE ===================================

const State = {
    tabs: [
        {
            id: 'tab_0',
            name: 'Welcome.txt',
            content: WELCOME_CONTENT,
            parsing: false,
            conversationHistory: [{ role: 'system', content: SYSTEM_PROMPT }],
            fileContext: ''
        }
    ],
    activeTabId: 'tab_0',
    tabIdCounter: 1,
    draggedTabId: null,
    dragOverTabId: null,
    selectedText: '',
    lastSelectedText: '',
    enterCooldown: false,
    currentPage: PAGE_TYPES.EXPLANATION,
    currentAbortController: null
};

window.currentPage = State.currentPage;

// =========================== UTILITIES ===================================

const Logger = {
    info: (message, ...args) => console.log(`[ParserPro] ${message}`, ...args),
    warn: (message, ...args) => console.warn(`[ParserPro] ${message}`, ...args),
    error: (message, ...args) => console.error(`[ParserPro] ${message}`, ...args)
};

const DOM = {
    get: (id) => document.getElementById(id),
    getCodeElement: () => DOM.get('codeInput') || DOM.get('highlightArea'),
    iframe: () => DOM.get('frameExplanation')
};

const TabUtils = {
    getActive: () => State.tabs.find(tab => tab.id === State.activeTabId),
    getById: (id) => State.tabs.find(tab => tab.id === id),
    getIndexById: (id) => State.tabs.findIndex(tab => tab.id === id),
    exists: (id) => State.tabs.some(tab => tab.id === id)
};

// =========================== TAB OPERATIONS ===================================

const TabOperations = {
    // Create tab: -define properties, -reset conversationHistory, -push to tabs array
    create(name = null, content = '') {
        const newName = name || `Untitled-${State.tabIdCounter}.txt`;
        const newTab = {
            id: `tab_${State.tabIdCounter}`,
            name: newName,
            content: content,
            parsing: false,
            conversationHistory: [{ role: 'system', content: SYSTEM_PROMPT }],
            fileContext: content
        };
        
        State.tabs.push(newTab);
        State.tabIdCounter++;
        
        Logger.info(`Created tab: ${newName}`);
        return newTab.id;
    },

    // Switch tabs: -save current tab content, -load new tab content, -add new tab to bar, -pass new tab state to iframe
    switch(newTabId) {
        if (newTabId === State.activeTabId) return;
        
        const newTab = TabUtils.getById(newTabId);
        if (!newTab) {
            Logger.error(`Tab ${newTabId} not found`);
            return;
        }
        
        this.saveState();
        State.activeTabId = newTabId;
        this.loadState(newTab);
        UI.renderTabs();
        
        // Update iframe to match new tab's parsing state
        UI.sendToIframe({ parsingState: newTab.parsing });
    },

    // Close tabs: -Don't close if only 1, -Swap to rightmost tab in index (Math.max) if current closed
    close(tabId) {
        if (State.tabs.length === 1) {
            Logger.warn('Cannot close the last remaining tab');
            return;
        }
        
        const tabIndex = TabUtils.getIndexById(tabId);
        if (tabIndex === -1) return;
        
        const closingActiveTab = (tabId === State.activeTabId);
        State.tabs.splice(tabIndex, 1);
        
        if (closingActiveTab) {
            const newActiveIndex = Math.max(0, tabIndex - 1);
            this.switch(State.tabs[newActiveIndex].id);
        } else {
            UI.renderTabs();
        }
    },
    
    // Reorder tabs
    reorder(fromIndex, toIndex) {
        if (fromIndex === toIndex) return;
        
        const [movedTab] = State.tabs.splice(fromIndex, 1);
        State.tabs.splice(toIndex, 0, movedTab);
        UI.renderTabs();
    },

    // Save tab state: -Save highlight area data (regardless of DOM = parsing/editing) in activeTab's .content property 
    saveState() {
        const activeTab = TabUtils.getActive();
        if (!activeTab) return;
        
        const codeEl = DOM.getCodeElement();
        if (!codeEl) return;
        
        activeTab.content = codeEl.value || codeEl.textContent || '';
    },

    // Load tab state: Replace tab area data with the new tab's stored tab.content content. replace button
    loadState(tab) {
        const codeEl = DOM.getCodeElement();
        const toggleButton = DOM.get('toggleParseButton');
        
        if (!codeEl) {
            Logger.error('Code element not found');
            return;
        }
        
        // New tab was in parsing state
        if (tab.parsing) { 
            // Replace current editing window with new tab's parsing window text & highlight
            if (codeEl.id === 'codeInput') { 
                const highlightArea = document.createElement('pre');
                highlightArea.classList.add('highlightArea');
                highlightArea.id = 'highlightArea';
                highlightArea.innerHTML = Prism.highlight(tab.content, Prism.languages.javascript, 'javascript');
                codeEl.parentNode.replaceChild(highlightArea, codeEl);
            // Replace current parsing window text with new tab's parsing window text & rehighlight
            } else { 
                codeEl.innerHTML = Prism.highlight(tab.content, Prism.languages.javascript, 'javascript');
            }
            if (toggleButton) {
                toggleButton.textContent = '⮜';
                toggleButton.dataset.mode = 'edit';
            }
        // New tab was in editing state
        } else {
            if (codeEl.id === 'highlightArea') {
                const textarea = document.createElement('textarea');
                textarea.id = 'codeInput';
                textarea.name = 'codeInput';
                textarea.required = true;
                textarea.placeholder = 'Enter your code here...';
                textarea.value = tab.content;
                codeEl.parentNode.replaceChild(textarea, codeEl);
            } else {
                codeEl.value = tab.content;
            }
            if (toggleButton) {
                toggleButton.textContent = '⮞';
                toggleButton.dataset.mode = 'parse';
            }
        }
    },
};

// =========================== UI RENDERING ===================================

const UI = {
    // Render tabs: Render tab button, add to container, Render new tab (+) button, add to container, update fade
    renderTabs() {
        const tabContainer = DOM.get('tabContainer');
        if (!tabContainer) return; // Fix 15/1/26: prevents getting container before DOM loads
        
        tabContainer.innerHTML = ''; // Reset tab container
        
        State.tabs.forEach(tab => {
            const tabButton = this._createTabButton(tab);
            tabContainer.appendChild(tabButton);
        });
        
        const newTabBtn = this._createNewTabButton();
        tabContainer.appendChild(newTabBtn);
        
        this.updateScrollFade();
    },

    // Create tab button
    _createTabButton(tab) {
        const button = document.createElement('button');
        button.className = 'tab-button';
        button.dataset.tabId = tab.id;
        button.draggable = true;
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', tab.id === State.activeTabId);
        
        // Check if active, set styling 
        if (tab.id === State.activeTabId) {
            button.classList.add('active');
        }
        
        // Set tab icon
        const fileIcon = document.createElement('img');
        fileIcon.src = '../images/file.png';
        fileIcon.className = 'file-icon';
        fileIcon.alt = '';
        fileIcon.setAttribute('aria-hidden', 'true');
        button.appendChild(fileIcon);
        
        // Set tab name
        const tabName = document.createElement('span');
        tabName.className = 'tab-name';
        tabName.textContent = tab.name;
        button.appendChild(tabName);
        
        // (CONDITIONAL) close button if >1 tabs
        if (State.tabs.length > 1) {
            const closeBtn = document.createElement('span');
            closeBtn.className = 'tab-close';
            closeBtn.textContent = '✕';
            closeBtn.setAttribute('aria-label', `Close ${tab.name}`);
            closeBtn.setAttribute('role', 'button');
            closeBtn.setAttribute('tabindex', '0');
            button.appendChild(closeBtn);
        }
        
        return button;
    },
    // Create new tab button
    _createNewTabButton() {
        const button = document.createElement('button');
        button.className = 'new-tab-button';
        button.textContent = '+';
        button.title = 'New tab';
        button.setAttribute('aria-label', 'Create new tab');
        return button;
    },
    // Add scroll fade, compare scrollWidth and clientWidth
    updateScrollFade() {
        const tabContainer = DOM.get('tabContainer');
        if (!tabContainer) return;
        
        const isOverflowing = tabContainer.scrollWidth > tabContainer.clientWidth;
        const isScrolledToEnd = tabContainer.scrollLeft + tabContainer.clientWidth >= tabContainer.scrollWidth - 5;
        
        tabContainer.classList.toggle('has-overflow', isOverflowing && !isScrolledToEnd);
    },
    // Send a message with postMessage to the iframe
    sendToIframe(message) {
        const iframe = DOM.iframe();
        if (iframe?.contentWindow) {
            iframe.contentWindow.postMessage(message, '*');
        }
    }
};

// =========================== AI INTEGRATION ===================================

const AI = {
    // Function to trim conversation history w sliding window to keep history manageable
    trimHistory(history) {
        if (history.length <= CONFIG.MAX_HISTORY_ITEMS) {
            return history;
        }
        
        const systemMessages = history.slice(0, 3); // Take first three messages 
        const recentMessages = history.slice(-CONFIG.MAX_HISTORY_ITEMS + 3); // Take last three 
        return [...systemMessages, ...recentMessages];
    },
    // Function to call AI, params: (page function prompt, keep history yes/no)
    async call(systemPrompt, persistHistory = true) {
        const activeTab = TabUtils.getActive();
        const { conversationHistory, fileContext } = activeTab;
        
        const messagesToSend = persistHistory 
            ? [ ...conversationHistory, 
                { role: 'system', content: systemPrompt },
                { role: 'user', content: State.selectedText }]
            : [ // If history is not kept, don't use conversationHistory array
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'system', content: `The user has submitted code for analysis. Consider this context when explaining highlighted sections:\n\n${fileContext}` },
                { role: 'system', content: systemPrompt },
                { role: 'user', content: State.selectedText }
            ];
            
        try {
            State.currentAbortController = new AbortController();

            // Fetch block 
            // Fetch syntax: {method, headers, body(key1, key2)}
            // ===================================================
            const response = await fetch(CONFIG.API_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messagesToSend,
                    model: CONFIG.MODEL
                }),
                signal: State.currentAbortController.signal
            });
            // ====================================================

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const completion = await response.json();
            
            if (!completion?.choices?.[0]?.message?.content) {
                throw new Error('Invalid API response structure');
            }
            
            const aiResponse = completion.choices[0].message.content.trim();
            
            // If user did not submit code/history not saved, don't append AI repsonse to history
            if (persistHistory && aiResponse !== '# MISSING CODE') {
                activeTab.conversationHistory.push({ role: 'assistant', content: aiResponse });
                activeTab.conversationHistory = this.trimHistory(activeTab.conversationHistory);
            }

            return aiResponse;
        } catch (error) {
            if (error.name === 'AbortError') {
                Logger.info('API request cancelled'); // Record AbortController errors
                return null;
            }
            Logger.error('AI API Error:', error);
            return null;
        } finally {
            State.currentAbortController = null;
        }
    }
};

// =========================== PAGE HANDLERS ===================================
const PageHandlers = {

    // CASE 1: Explanation Page - Generate code explanation
    async explanation() {
        const prompt = `Analyze the highlighted code and provide a concise, detailed explanation.

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
        Consider the wider code as context which you received in a previous chat completion.
        If input is not code, respond with ONLY "# MISSING CODE" and nothing else.`;

        UI.sendToIframe({ explanation: 'Generating response...' });
        const explanation = await AI.call(prompt, true);
        if (explanation) {
            UI.sendToIframe({ explanation });
        }
    },
    
    // CASE 2: Visualization page - Detect sorting algorithm and extract array
    async visualization() {
        UI.sendToIframe({ visualization: 'Detecting sorting algorithm...' });
        
        // Extract algorithm from code, return [one word identifier]
        const algorithmPrompt = `Analyze the code and identify if it contains a sorting algorithm.
        Respond with ONLY one word from this list: bubble, insertion, selection, quick, merge, counting, radix, heap, bucket
        Only the word should be returned. If no sorting algorithm is found, respond with: default`;
        
        let algorithm = await AI.call(algorithmPrompt, false);
        algorithm = algorithm?.toLowerCase().trim() || 'default'; //In case AI gives inconsistent case-

        // ERROR: Pass error state to frame
        if (!algorithm || algorithm === 'default') {
            UI.sendToIframe({ visualization: 'No sorting algorithm detected in the highlighted code.' });
            return;
        }

        // Extract array from code, return [array as list]
        const arrayPrompt = `Analyze the code and identify if it contains an array or any kind of list of values, intended to be sorted.  
        - If so, extract the array literal from the code.
        - If not, generate a dummy array with 5-10 random integers between 1-50.
        Respond with ONLY the array values, comma separated, no brackets or extra text.`;

        const arrayData = await AI.call(arrayPrompt, false);
        
        // SUCCESS: Pass successful output state to frame
        if (arrayData) {
            UI.sendToIframe({ visualization: { algorithm, arrayData } });
        }
    },
    // CASE 3: Performance page - Analyze time, space, and provide improvements
    async complexity() {
        // Analyze code, return [complexity table]
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
        
        UI.sendToIframe({ explanation: 'Analyzing complexity...' });
        const complexity = await AI.call(complexityPrompt, false);
    
        // ERROR: Pass error state to frame
        if (!complexity || complexity === 'MISSING CODE') {
            UI.sendToIframe({ explanation: 'Failed to analyze time complexity.' });
            return;
        }
        // SUCCESS: Pass successful output state to frame
        if (complexity) {
            UI.sendToIframe({ explanation: complexity });
        }
    }
};

// =========================== EVENT HANDLERS ===================================

const EventHandlers = {
    tabClick(e) {
        const tabButton = e.target.closest('.tab-button');
        const closeButton = e.target.closest('.tab-close');
        const newTabButton = e.target.closest('.new-tab-button');
        
        if (closeButton && tabButton) {
            e.stopPropagation();
            TabOperations.close(tabButton.dataset.tabId);
        } else if (tabButton) { // Switch to specific tab
            TabOperations.switch(tabButton.dataset.tabId);
        } else if (newTabButton) { // New ID, swap to newly created tab button w new ID
            const newId = TabOperations.create();
            TabOperations.switch(newId);
        }
    },

    dragStart(e) {
        const tabButton = e.target.closest('.tab-button');
        if (!tabButton) return;
        
        State.draggedTabId = tabButton.dataset.tabId;
        tabButton.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    },

    dragOver(e) {
        e.preventDefault();
        const tabButton = e.target.closest('.tab-button');
        if (!tabButton || !State.draggedTabId) return;
        
        State.dragOverTabId = tabButton.dataset.tabId;
        
        const tabContainer = DOM.get('tabContainer');
        tabContainer.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('drag-over');
        });
        
        if (State.draggedTabId !== State.dragOverTabId) {
            tabButton.classList.add('drag-over');
        }
    },

    dragLeave(e) {
        const tabButton = e.target.closest('.tab-button');
        if (tabButton) {
            tabButton.classList.remove('drag-over');
        }
    },

    drop(e) {
        e.preventDefault();
        const tabButton = e.target.closest('.tab-button');
        
        if (!tabButton || !State.draggedTabId || !State.dragOverTabId || State.draggedTabId === State.dragOverTabId) {
            EventHandlers._cleanupDragState();
            return;
        }
        
        const fromIndex = TabUtils.getIndexById(State.draggedTabId);
        const toIndex = TabUtils.getIndexById(State.dragOverTabId);
        
        TabOperations.reorder(fromIndex, toIndex);
        EventHandlers._cleanupDragState();
    },

    dragEnd() {
        EventHandlers._cleanupDragState();
    },

    _cleanupDragState() {
        const tabContainer = DOM.get('tabContainer');
        if (tabContainer) {
            tabContainer.querySelectorAll('.tab-button').forEach(btn => {
                btn.classList.remove('drag-over', 'dragging');
            });
        }
        State.draggedTabId = null;
        State.dragOverTabId = null;
    },

    toggleParseMode(e) {
        e.preventDefault();
        
        const activeTab = TabUtils.getActive();
        if (!activeTab) return;
        
        const toggleButton = e.currentTarget;
        const currentMode = toggleButton.dataset.mode || 'parse';

        // Parsing mode enter
        if (currentMode === 'parse') {
            // EventHandlers._enterParseMode(activeTab);
            TabOperations.saveState();
            activeTab.parsing = true;
            
            // Trim input if necessary (save tokens!!), feed to AI for context
            const inputText = activeTab.content;
            const fileContext = inputText.length > CONFIG.MAX_FILE_SIZE
                ? inputText.substring(0, CONFIG.MAX_FILE_SIZE / 2) 
                    + '\n\n... [middle section truncated] ...\n\n'
                    + inputText.substring(inputText.length - CONFIG.MAX_FILE_SIZE / 2)
                : inputText;
            
            // Define content as property of activeTab, append to AI conversation history
            activeTab.fileContext = fileContext;
            activeTab.conversationHistory.push({
                role: 'system',
                content: `The user has submitted code for analysis. Consider this context when explaining highlighted sections:\n\n${fileContext}`
            });
            
            TabOperations.loadState(activeTab);

            // Give parsing state to iframe
            UI.sendToIframe({ parsingState: true });
        } else { // Edit mode enter
            // EventHandlers._enterEditMode(activeTab);
            if (State.currentAbortController) {
                State.currentAbortController.abort();
            }
            // Reset all states (conversation history, parsing state, duplicate check flag)
            activeTab.conversationHistory = [{ role: 'system', content: SYSTEM_PROMPT }];
            activeTab.parsing = false;
            State.lastSelectedText = '';
            
            TabOperations.loadState(activeTab);

            // Give parsing state to iframe
            UI.sendToIframe({ parsingState: false });
        }
    },

    async keyDown(e) {
        const activeTab = TabUtils.getActive();
        if (e.key !== 'Enter' || !activeTab?.parsing) return;

        EventHandlers._checkHighlightedText();

        // Validate submission to save tokens:
        // - prevent duplicates, - prevent empty selections, - prevent debounce spam
        if (!State.selectedText || State.enterCooldown) return;
        
        State.lastSelectedText = State.selectedText;
        State.enterCooldown = true;

        try {
            switch (State.currentPage) {
                case PAGE_TYPES.EXPLANATION:
                    await PageHandlers.explanation();
                    break;
                case PAGE_TYPES.VISUALIZATION:
                    await PageHandlers.visualization();
                    break;
                case PAGE_TYPES.COMPLEXITY:
                    await PageHandlers.complexity();
                    break;
                default:
                    Logger.error('Unknown page:', State.currentPage);
            }
        } finally {
            setTimeout(() => { State.enterCooldown = false; }, CONFIG.DEBOUNCE_DELAY); // Debounce time of 1.5s until enterCooldown flag reset
        }
    },

    // Handle highlighted text, ensuring that highlighted text is within code box
    _checkHighlightedText() {
        const selection = window.getSelection().toString();
        const highlightArea = DOM.get('highlightArea');
        
        // Check if highlighted text is in the highlight area and if anything is highlighted
        if (selection && highlightArea?.textContent.includes(selection)) {
            State.selectedText = selection;
        }
    },

    // Info button click
    infoClick() {
        const infoPopup = DOM.get('infoPopup');
        const infoButton = DOM.get('infoButton');
        
        if (!infoPopup || !infoButton) return;
        
        const isVisible = infoPopup.style.display === 'block';
        infoPopup.style.display = isVisible ? 'none' : 'block';
        infoButton.innerHTML = isVisible ? ' 🛈 ' : ' ✖ ';
    },

    // Take pgnum from iframe, stop API calls, give parsing state to iframe
    pageMessage(event) {
        if (event.data?.pageNumber === undefined) return;
        
        // Take pgnum from iframe
        State.currentPage = event.data.pageNumber;
        window.currentPage = State.currentPage;

        // Stop API calls if page swapped
        if (State.currentAbortController) {
            State.currentAbortController.abort();
        }

        const activeTab = TabUtils.getActive();
        if (activeTab) {
            UI.sendToIframe({ parsingState: activeTab.parsing });
        }
    }
};

// =========================== INITIALIZATION ===================================

function attachEventListeners() {
    const tabContainer = DOM.get('tabContainer');
    if (tabContainer) {
        tabContainer.addEventListener('click', EventHandlers.tabClick);
        tabContainer.addEventListener('dragstart', EventHandlers.dragStart);
        tabContainer.addEventListener('dragover', EventHandlers.dragOver);
        tabContainer.addEventListener('dragleave', EventHandlers.dragLeave);
        tabContainer.addEventListener('drop', EventHandlers.drop);
        tabContainer.addEventListener('dragend', EventHandlers.dragEnd);
        tabContainer.addEventListener('scroll', UI.updateScrollFade);
    }
    
    const toggleButton = DOM.get('toggleParseButton');
    if (toggleButton) {
        toggleButton.addEventListener('click', EventHandlers.toggleParseMode);
    }
    
    const infoButton = DOM.get('infoButton');
    if (infoButton) {
        infoButton.addEventListener('click', EventHandlers.infoClick);
    }
    
    document.addEventListener('keydown', EventHandlers.keyDown);
    window.addEventListener('message', EventHandlers.pageMessage);
    window.addEventListener('resize', UI.updateScrollFade);
}

function initializeApp() {
    UI.renderTabs();
    
    const activeTab = TabUtils.getActive();
    const codeEl = DOM.getCodeElement();
    
    if (activeTab && codeEl && codeEl.tagName === 'TEXTAREA') {
        codeEl.value = activeTab.content;
    }
    
    attachEventListeners();
    
    Logger.info('Application initialized successfully');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}