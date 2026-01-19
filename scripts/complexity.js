/*
- Handler script for time complexity formatting and states given AI output
*/
// =========================== GLOBAL STATE ===================================
window.onload = function() {
    // Send pgnum to parent window
    window.currentPage = 3;
    window.parent.postMessage({ pageNumber: 3 }, '*');
};

// =========================== DOM ELEMENTS ===================================
const analysisContainer = document.getElementById('analysisContainer');
const statusMessage = document.getElementById('statusMessage');

// =========================== LISTEN FOR PARENT MESSAGES ===================================
window.addEventListener('message', function(event) {

    // Update frame state based on parsing state event recieved from parent
    if (event.data?.parsingState !== undefined) {
        if (!event.data.parsingState) {
            resetToEmptyState();
        } else {
            resetToParsingState();
        }
        return;
    }

    // Handle explanation (complexity analysis) from parent 
    if (event.data?.explanation) {
        const content = event.data.explanation;

        // Show loading state first on UI
        if (content === 'Analyzing complexity...') {
            showLoadingState();
        } 
        // Show error state on UI
        else if (content.startsWith('⚠')) {
            showErrorState(content);
        }
        else {
            showAnalysis(content);
        }
    }
});

// =========================== UI STATE FUNCTIONS ===================================

function showLoadingState() {
    if (!analysisContainer) return;
    analysisContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <div class="loading-text">Analyzing complexity...</div>
        </div>
    `;
    statusMessage.textContent = 'AI is analyzing your code...';
    statusMessage.classList.add('active');
}


function showErrorState(message) {
    analysisContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon-error">⚠</div>
            <div class="empty-state-text-error">${message}</div>
        </div>
    `;
    statusMessage.classList.add('error');
    statusMessage.textContent = 'Error occurred';
}

// function resetToEmptyState() {
//     analysisContainer.innerHTML = `
//         <div class="empty-state">
//             <div class="empty-state-text">
//  _____ ____ ___ _____ ___ _   _  ____   ____ _____  _    ____ _____ 
// | ____|  _ \\_ _|_   _|_ _| \\ | |/ ___| / ___|_   _|/ \\  / ___| ____|
// |  _| | | | | |  | |  | ||  \\| | |  _  \\___ \\ | | / _ \\| |  _|  _|  
// | |___| |_| | |  | |  | || |\\  | |_| |  ___) || |/ ___ \\ |_| | |___ 
// |_____|____/___| |_| |___|_| \\_|\\____| |____/ |_/_/   \\_\\____|_____|
//             </div>
//         </div>
//     `;
//     statusMessage.classList.remove('error', 'active');
//     statusMessage.textContent = 'Awaiting Input!';
// }

function resetToEmptyState() {
    analysisContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-text">
                EDITING STAGE
            </div>
        </div>
    `;
    statusMessage.classList.remove('error', 'active');
    statusMessage.textContent = 'Awaiting Input!';
}
function resetToParsingState(){

// if (analysisContainer) {
//     analysisContainer.innerHTML = `
//         <div class="empty-state">
//             <div class="empty-state-text active">
//  ____   _    ____  ____ ___ _   _  ____   ____ _____  _    ____ _____ 
// |  _ \\ / \\  |  _ \\/ ___|_ _| \\ | |/ ___| / ___|_   _|/ \\  / ___| ____|
// | |_) / _ \\ | |_) \\___ \\| ||  \\| | |  _  \\___ \\ | | / _ \\| |  _|  _|  
// |  __/ ___ \\|  _ < ___) | || |\\  | |_| |  ___) || |/ ___ \\ |_| | |___ 
// |_| /_/   \\_\\_| \\_\\____/___|_| \\_|\\____| |____/ |_/_/   \\_\\____|_____|
//             </div>
//         </div>
//     `;
// }

if (analysisContainer) {
    analysisContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-text active">
                PARSING STAGE
            </div>
        </div>
    `;
}
    statusMessage.classList.add('active');
    statusMessage.textContent = 'Awaiting Input!';
}

function showAnalysis(markdownContent) {
    const htmlContent = marked.parse(markdownContent);
    
    analysisContainer.innerHTML = `
        <div class="analysis-content">
            ${htmlContent}
        </div>
    `;
    
    statusMessage.textContent = 'Analysis complete';
    statusMessage.classList.add('active');
    
    analysisContainer.scrollTop = 0;
}