// =========================== GLOBAL STATE ===================================
window.onload = function() {
    window.currentPage = 3;
    console.log("Complexity page loaded");
    window.parent.postMessage({ pageNumber: 3 }, '*');
};

// =========================== DOM ELEMENTS ===================================
const analysisContainer = document.getElementById('analysisContainer');
const statusMessage = document.getElementById('statusMessage');

// =========================== LISTEN FOR PARENT MESSAGES ===================================
window.addEventListener('message', function(event) {
    // Handle explanation (complexity analysis) from parent
    if (event.data?.explanation) {
        const content = event.data.explanation;

        // Show loading state first on UI
        if (content === 'Analyzing complexity...') {
            showLoadingState();
        } 
        // Show error state on UI
        else if (content === 'Failed to analyze time complexity.' ) {
            showErrorState(content);
        }
        else {
            showAnalysis(content);
        }
    }

    // Handle going back to editing mode
    if (event.data?.action === 'backButtonClicked') {
        resetToEmptyState();
    }

    // Handle parse button click
    if (event.data?.action === 'goButtonClicked') {
        resetToEmptyState();
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
            <div class="empty-state-icon">⚠</div>
            <div class="empty-state-text">${message}</div>
        </div>
    `;
    statusMessage.textContent = 'Error occurred';
    statusMessage.style.color = '#ff6b6b';
}

function resetToEmptyState() {
    analysisContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⏱</div>
            <div class="empty-state-text">
                Parse code and highlight an algorithm to analyze its complexity
            </div>
        </div>
    `;
    statusMessage.textContent = '';
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