window.onload = function () {
    window.currentPage = 1;
    console.log("Current Page:", window.currentPage); // For debugging purposes
};

window.addEventListener("message", function (event) {

    //Establish variables for text replacement
    var aiOutput = document.getElementById('aiOutput');
    var header = aiOutput.querySelector('#explanationHeader');
    var description = aiOutput.querySelector('#explanationDescript');
    var stageHeader = aiOutput.querySelector('.stageHeader');
    var stylingDescript = aiOutput.querySelector('.stylingDescript');


    // Function to restart animations by removing and adding stageHeader
    function restartAnimations() {
        stageHeader.classList.remove('stageHeader');
        void stageHeader.offsetWidth;
        stageHeader.classList.add('stageHeader');

        stylingDescript.classList.remove('stylingDescript');
        void stylingHeader.offsetWidth; // Force reflow
        stylingDescript.classList.add('stylingDescript');
    }


    //If code highlighted and entered
    if (event.data && event.data.explanation) {
        if (aiOutput) {

            //Set text content to stage text content
            stageHeader.textContent = "Execute AI analysis";
            header.textContent = "";
            description.innerHTML = marked.parse(event.data.explanation);
            /* console.log(event.data.explanation); */
            console.log(marked.parse(event.data.explanation)); 

            //Add overriding styling 
            description.classList.add('ai-text');

            restartAnimations();
            console.log("EXPLANATION GENERATED");
        }
    }

    // If go button clicked
    if (event.data && event.data.action === 'goButtonClicked') {
        if (aiOutput) {

            //Set text content to stage text content 
            stageHeader.textContent = "Start Parsing";
            header.textContent = "--PARSING STAGE--";
            description.textContent = "// To analyze code, highlight code and press *Enter*";

            //Add overriding styling
            description.classList.add('descript-override')
            header.classList.add('header-override');
            description.classList.remove('ai-text');

            restartAnimations();
            console.log("PARSING STAGE TRANSITIONED");
        }
    }

    // If back button clicked
    if (event.data && event.data.action === 'backButtonClicked') {
        if (aiOutput) {

            //Set text content to stage text content 
            stageHeader.textContent = "Start Editing";
            header.textContent = "--EDITING STAGE--";
            description.textContent = "// To parse code, press the *Parse* button on the top right!";

            //Add overriding styling
            header.classList.add('header-text');
            description.classList.add('descript-text');
            description.classList.remove('ai-text');

            restartAnimations();
            console.log("EDITING STAGE TRANSITIONED");
        }
    }
});