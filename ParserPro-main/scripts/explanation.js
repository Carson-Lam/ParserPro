// =========================== GLOBAL STATE ===================================
window.onload = function() {
    // Send pgnum to parent window
    window.currentPage = 1;
    window.parent.postMessage({ pageNumber: 1 }, '*');
};


// Listen for messages from parent window (index.html iframe communication)
window.addEventListener("message", function (event) {
    const aiOutput = document.getElementById('aiOutput');
    if (!aiOutput) return;

    // Get DOM elements
    const header = aiOutput.querySelector('#explanationHeader');
    const description = aiOutput.querySelector('#explanationDescript');
    const stageHeader = aiOutput.querySelector('.stageHeader');
    const stylingDescript = aiOutput.querySelector('.stylingDescript');

    // Restart CSS animations by forcing reflow
    function restartAnimations() {
        stageHeader.classList.remove('stageHeader');
        void stageHeader.offsetWidth; // Force DOM reflow
        stageHeader.classList.add('stageHeader');

        stylingDescript.classList.remove('stylingDescript');
        void stylingDescript.offsetWidth; // Force DOM reflow
        stylingDescript.classList.add('stylingDescript');
    }

    // Handle parsing state broadcast from parent (page load & button clicks)
    if (event.data?.parsingState !== undefined) {
        if (event.data.parsingState) {
            // PARSING MODE
            description.classList.remove('ai-text');
            description.classList.add('descript-override')
            header.classList.add('header-override');

            stageHeader.textContent = "Start Parsing";
            header.textContent = ` ____   _    ____  ____ ___ _   _  ____   ____ _____  _    ____ _____ 
|  _ \\ / \\  |  _ \\/ ___|_ _| \\ | |/ ___| / ___|_   _|/ \\  / ___| ____|
| |_) / _ \\ | |_) \\___ \\| ||  \\| | |  _  \\___ \\ | | / _ \\| |  _|  _|  
|  __/ ___ \\|  _ < ___) | || |\\  | |_| |  ___) || |/ ___ \\ |_| | |___ 
|_| /_/   \\_\\_| \\_\\____/___|_| \\_|\\____| |____/ |_/_/   \\_\\____|_____|

`;
            description.textContent = "// To analyze code, highlight code and press *Enter*";
            restartAnimations();
        } else {
            // EDITING MODE
            description.classList.remove('ai-text');
            header.classList.add('header-override');
            description.classList.add('descript-override');

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
        return; // Exit early after handling state
    }

    // Handle explanation (complexity analysis) from parent 
    if (event.data?.explanation) {
        // Apply AI explanation styling
        description.classList.remove('descript-override');
        header.classList.remove('header-override');
        description.classList.add('ai-text');

        // Set text content to parsing stage
        stageHeader.textContent = "Execute AI analysis";
        header.textContent = "";
        description.innerHTML = marked.parse(event.data.explanation); // Use markdown parser for AI Output

        restartAnimations();
        console.log("AI Explanation generated!");
    }
});