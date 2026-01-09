// Set current page identifier
window.onload = function () {
    window.currentPage = 1;
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

    // Handle AI explanation response
    if (event.data?.explanation) {
        // Apply AI explanation styling
        description.classList.remove('descript-override');
        header.classList.remove('header-override');
        description.classList.add('ai-text');

        // Set text content to parsing stage
        stageHeader.textContent = "Execute AI analysis";
        header.textContent = "";
        description.innerHTML = marked.parse(event.data.explanation); // Use markdown parser for HTML AI Output

        restartAnimations();
        console.log("AI Explanation generated!");
    }

    // Handle parse button click (entering parsing mode)
    if (event.data?.action === 'goButtonClicked') {
        //Add parsing stage styling
        description.classList.remove('ai-text');
        description.classList.add('descript-override')
        header.classList.add('header-override');

        //Set text content to parsing stage
        stageHeader.textContent = "Start Parsing";
header.textContent = ` ____   _    ____  ____ ___ _   _  ____   ____ _____  _    ____ _____ 
|  _ \\ / \\  |  _ \\/ ___|_ _| \\ | |/ ___| / ___|_   _|/ \\  / ___| ____|
| |_) / _ \\ | |_) \\___ \\| ||  \\| | |  _  \\___ \\ | | / _ \\| |  _|  _|  
|  __/ ___ \\|  _ < ___) | || |\\  | |_| |  ___) || |/ ___ \\ |_| | |___ 
|_| /_/   \\_\\_| \\_\\____/___|_| \\_|\\____| |____/ |_/_/   \\_\\____|_____|

`;
        description.textContent = "// To analyze code, highlight code and press *Enter*";

        restartAnimations();
        console.log("Parsing stage activated!");
    }

    // Handle back  button click (returning to  mode)
    if (event.data?.action === 'backButtonClicked') {
        //Add editing stage styling
        description.classList.remove('ai-text');
        header.classList.add('header-override');
        description.classList.add('descript-oveerride');

        //Set text content to editing stage
        stageHeader.textContent = "Start Editing";
header.textContent = ` _____ ____ ___ _____ ___ _   _  ____   ____ _____  _    ____ _____ 
| ____|  _ \\_ _|_   _|_ _| \\ | |/ ___| / ___|_   _|/ \\  / ___| ____|
|  _| | | | | |  | |  | ||  \\| | |  _  \\___ \\ | | / _ \\| |  _|  _|  
| |___| |_| | |  | |  | || |\\  | |_| |  ___) || |/ ___ \\ |_| | |___ 
|_____|____/___| |_| |___|_| \\_|\\____| |____/ |_/_/   \\_\\____|_____|

`;
        description.textContent = "// To parse code, press the *Parse* button on the top right!";

        restartAnimations();
        console.log("Editing stage activated!");
        
    }
});