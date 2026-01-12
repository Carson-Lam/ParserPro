// =========================== GLOBAL STATE ===================================
window.onload = function() {
    // Send pgnum to parent window
    window.currentPage = 1;
    window.parent.postMessage({ pageNumber: 1 }, '*');
};

// =========================== DOM ELEMENTS ===================================
const aiOutput = document.getElementById('aiOutput');
const header = aiOutput?.querySelector('#explanationHeader');
const description = aiOutput?.querySelector('#explanationDescript');
const stageHeader = aiOutput?.querySelector('.stageHeader');
const stylingDescript = aiOutput?.querySelector('.stylingDescript');


// =========================== LISTEN FOR PARENT MESSAGES ===================================
window.addEventListener("message", function (event) {

    // Update frame state based on parsing state event received from parent index.html
    if (event.data?.parsingState !== undefined) {
        if (!event.data.parsingState) {
            resetToEmptyState();
        } else {
            resetToParsingState();
        }
        return;
    }

        // Handle explanation (explanation) recieved from parent index.html
        if (event.data?.explanation) {
            showExplanation(event.data.explanation);
        }
});        

// =========================== UI STATE FUNCTIONS ===================================
function resetToEmptyState() {
    if (!aiOutput) return;
    
    description.classList.remove('ai-text');
    description.classList.add('descript-override');
    header.classList.remove('active');
    header.classList.add('header-override');

    stageHeader.textContent = "Start Editing";
    header.textContent = ` _____ ____ ___ _____ ___ _   _  ____   ____ _____  _    ____ _____ 
| ____|  _ \\_ _|_   _|_ _| \\ | |/ ___| / ___|_   _|/ \\  / ___| ____|
|  _| | | | | |  | |  | ||  \\| | |  _  \\___ \\ | | / _ \\| |  _|  _|  
| |___| |_| | |  | |  | || |\\  | |_| |  ___) || |/ ___ \\ |_| | |___ 
|_____|____/___| |_| |___|_| \\_|\\____| |____/ |_/_/   \\_\\____|_____|

`;
    description.textContent = "// To parse code, press the *Parse* button on the top right!";
    restartAnimations();
}

function resetToParsingState() {
        if (!aiOutput) return;

        description.classList.remove('ai-text');
        description.classList.add('descript-override')
        header.classList.add('header-override', 'active');

        stageHeader.textContent = "Start Parsing";
        header.textContent = ` ____   _    ____  ____ ___ _   _  ____   ____ _____  _    ____ _____ 
|  _ \\ / \\  |  _ \\/ ___|_ _| \\ | |/ ___| / ___|_   _|/ \\  / ___| ____|
| |_) / _ \\ | |_) \\___ \\| ||  \\| | |  _  \\___ \\ | | / _ \\| |  _|  _|  
|  __/ ___ \\|  _ < ___) | || |\\  | |_| |  ___) || |/ ___ \\ |_| | |___ 
|_| /_/   \\_\\_| \\_\\____/___|_| \\_|\\____| |____/ |_/_/   \\_\\____|_____|

`;
        description.textContent = "// To analyze code, highlight code and press *Enter*";
        restartAnimations();
}

function showExplanation(explanationContent) {
    if (!aiOutput) return;
    
    // Apply AI explanation styling
    description.classList.remove('descript-override');
    description.classList.add('ai-text');
    header.classList.remove('header-override');
    
    // Set text content to AI analysis stage
    stageHeader.textContent = "Execute AI analysis";
    header.textContent = "";
    description.innerHTML = marked.parse(explanationContent);

    restartAnimations();
    console.log("AI Explanation generated!");
}

// =========================== ANIMATION HELPERS ===================================

function restartAnimations() {    
    // Restart CSS animations by forcing reflow
    stageHeader.classList.remove('stageHeader');
    void stageHeader.offsetWidth; // Force DOM reflow
    stageHeader.classList.add('stageHeader');

    stylingDescript.classList.remove('stylingDescript');
    void stylingDescript.offsetWidth; // Force DOM reflow
    stylingDescript.classList.add('stylingDescript');
}
