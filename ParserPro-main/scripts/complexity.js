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
    // Update frame state based on parsing state from parent
    if (event.data?.parsingState !== undefined) {
        if (!event.data.parsingState) {
            resetToEmptyState();
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
        else if (content === 'Failed to analyze time complexity.' ) {
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