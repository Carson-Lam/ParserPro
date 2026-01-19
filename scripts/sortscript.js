/*
- Handler script for sorting algo viz given AI output
*/
// =========================== GLOBAL STATE ===================================
window.onload = function() {    
    // Send pgnum to parent window
    window.currentPage = 2;
    window.parent.postMessage({ pageNumber: 2 }, '*');
};

let sortSteps = [];
let currentStepIndex = 0;
let algorithmName = 'Unknown Algorithm';

// =========================== DOM ELEMENTS ===================================
const arrayContainer = document.getElementById('arrayContainer');
const statusMessage = document.getElementById('statusMessage');
const stepNumber = document.getElementById('stepNumber');
const totalSteps = document.getElementById('totalSteps');
const algorithmNameEl = document.getElementById('algorithmName');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');

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

    // Handle explanation (visualization) from parent 
    if (event.data?.visualization) {
        const content = event.data.visualization;

        // Show loading state first on UI
        if (content === 'Detecting sorting algorithm...') {
            showLoadingState();
        } 
        // Show error state on UI
        else if (typeof content === 'string' && content.startsWith('⚠')) {
            showErrorState(content);
        } 
        else {
            generateAndSort(content.algorithm, content.arrayData);
        }
    }
});

// =========================== UI STATE FUNCTIONS ===================================

function showLoadingState() {
    if (!arrayContainer) return;
    arrayContainer.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <div class="loading-text">Generating visualization...</div>
        </div>
    `;
    statusMessage.classList.add('active');    
    statusMessage.textContent = 'AI is analyzing your code...';
}

function showErrorState(message) {
    arrayContainer.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon-error">⚠</div>
            <div class="empty-state-text-error">${message}</div>
        </div>
    `;
    statusMessage.classList.add('error');    
    statusMessage.textContent = 'Error occurred';
    if (prevBtn) prevBtn.disabled = true;    // Disable controls
    if (nextBtn) nextBtn.disabled = true;
}

function resetToEmptyState() {
    sortSteps = [];
    currentStepIndex = 0;
    algorithmName = 'Unknown Algorithm';
    
//     if (arrayContainer) {
//         arrayContainer.innerHTML = `
//             <div class="empty-state">
//                 <div class="empty-state-text">
//  _____ ____ ___ _____ ___ _   _  ____   ____ _____  _    ____ _____ 
// | ____|  _ \\_ _|_   _|_ _| \\ | |/ ___| / ___|_   _|/ \\  / ___| ____|
// |  _| | | | | |  | |  | ||  \\| | |  _  \\___ \\ | | / _ \\| |  _|  _|  
// | |___| |_| | |  | |  | || |\\  | |_| |  ___) || |/ ___ \\ |_| | |___ 
// |_____|____/___| |_| |___|_| \\_|\\____| |____/ |_/_/   \\_\\____|_____|
//                 </div>
//             </div>
//         `;
//     }
    if (arrayContainer) {
        arrayContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-text">
                    EDITING STAGE
                </div>
            </div>
        `;
    }

    statusMessage.classList.remove('error', 'active');
    statusMessage.textContent = 'Awaiting Input!';
    
    if (stepNumber) stepNumber.textContent = '0';
    if (totalSteps) totalSteps.textContent = '0';
    if (algorithmNameEl) algorithmNameEl.textContent = 'No Algorithm';
    
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
}

function resetToParsingState(){
//     if (arrayContainer) {
//         arrayContainer.innerHTML = `
//             <div class="empty-state">
//                 <div class="empty-state-text active">
//  ____   _    ____  ____ ___ _   _  ____   ____ _____  _    ____ _____ 
// |  _ \\ / \\  |  _ \\/ ___|_ _| \\ | |/ ___| / ___|_   _|/ \\  / ___| ____|
// | |_) / _ \\ | |_) \\___ \\| ||  \\| | |  _  \\___ \\ | | / _ \\| |  _|  _|  
// |  __/ ___ \\|  _ < ___) | || |\\  | |_| |  ___) || |/ ___ \\ |_| | |___ 
// |_| /_/   \\_\\_| \\_\\____/___|_| \\_|\\____| |____/ |_/_/   \\_\\____|_____|
//                 </div>
//             </div>
//         `;
//     }
    if (arrayContainer) {
        arrayContainer.innerHTML = `
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

// =========================== SORTING ALGORITHMS ===================================
function bubbleSort(arr) {
    const steps = [];
    const temp = [...arr];
    
    for (let i = 0; i < temp.length; i++) {
        for (let j = 0; j < temp.length - i - 1; j++) {
            steps.push({
                array: [...temp],
                comparing: [j, j + 1],
                sorted: []
            });
            
            if (temp[j] > temp[j + 1]) {
                [temp[j], temp[j + 1]] = [temp[j + 1], temp[j]];
                steps.push({
                    array: [...temp],
                    swapping: [j, j + 1],
                    sorted: []
                });
            }
        }
    }
    
    steps.push({
        array: [...temp],
        comparing: [],
        sorted: Array.from({length: temp.length}, (_, i) => i)
    });
    
    return steps;
}

function insertionSort(arr) {
    const steps = [];
    const temp = [...arr];
    
    for (let i = 1; i < temp.length; i++) {
        let key = temp[i];
        let j = i - 1;
        
        steps.push({
            array: [...temp],
            comparing: [i, j],
            sorted: []
        });
        
        while (j >= 0 && temp[j] > key) {
            temp[j + 1] = temp[j];
            j--;
            steps.push({
                array: [...temp],
                swapping: [j + 1, j + 2],
                sorted: []
            });
        }
        temp[j + 1] = key;
    }
    
    steps.push({
        array: [...temp],
        comparing: [],
        sorted: Array.from({length: temp.length}, (_, i) => i)
    });
    
    return steps;
}

function selectionSort(arr) {
    const steps = [];
    const temp = [...arr];
    
    for (let i = 0; i < temp.length - 1; i++) {
        let minIdx = i;
        
        for (let j = i + 1; j < temp.length; j++) {
            steps.push({
                array: [...temp],
                comparing: [minIdx, j],
                sorted: []
            });
            
            if (temp[j] < temp[minIdx]) {
                minIdx = j;
            }
        }
        
        if (minIdx !== i) {
            [temp[i], temp[minIdx]] = [temp[minIdx], temp[i]];
            steps.push({
                array: [...temp],
                swapping: [i, minIdx],
                sorted: []
            });
        }
    }
    
    steps.push({
        array: [...temp],
        comparing: [],
        sorted: Array.from({length: temp.length}, (_, i) => i)
    });
    
    return steps;
}

function quickSort(arr) {
    const steps = [];
    const temp = [...arr];
    
    function partition(low, high) {
        const pivot = temp[high];
        let i = low - 1;
        
        for (let j = low; j < high; j++) {
            steps.push({
                array: [...temp],
                comparing: [j, high],
                sorted: []
            });
            
            if (temp[j] < pivot) {
                i++;
                [temp[i], temp[j]] = [temp[j], temp[i]];
                steps.push({
                    array: [...temp],
                    swapping: [i, j],
                    sorted: []
                });
            }
        }
        
        [temp[i + 1], temp[high]] = [temp[high], temp[i + 1]];
        steps.push({
            array: [...temp],
            swapping: [i + 1, high],
            sorted: []
        });
        
        return i + 1;
    }
    
    function quickSortHelper(low, high) {
        if (low < high) {
            const pi = partition(low, high);
            quickSortHelper(low, pi - 1);
            quickSortHelper(pi + 1, high);
        }
    }
    
    quickSortHelper(0, temp.length - 1);
    
    steps.push({
        array: [...temp],
        comparing: [],
        sorted: Array.from({length: temp.length}, (_, i) => i)
    });
    
    return steps;
}

function mergeSort(arr) {
    const steps = [];
    const temp = [...arr];
    
    function merge(left, mid, right) {
        const leftArr = temp.slice(left, mid + 1);
        const rightArr = temp.slice(mid + 1, right + 1);
        
        let i = 0, j = 0, k = left;
        
        while (i < leftArr.length && j < rightArr.length) {
            steps.push({
                array: [...temp],
                comparing: [left + i, mid + 1 + j],
                sorted: []
            });
            
            if (leftArr[i] <= rightArr[j]) {
                temp[k] = leftArr[i];
                i++;
            } else {
                temp[k] = rightArr[j];
                j++;
            }
            k++;
        }
        
        while (i < leftArr.length) {
            temp[k] = leftArr[i];
            i++;
            k++;
        }
        
        while (j < rightArr.length) {
            temp[k] = rightArr[j];
            j++;
            k++;
        }
        
        steps.push({
            array: [...temp],
            comparing: [],
            sorted: []
        });
    }
    
    function mergeSortHelper(left, right) {
        if (left < right) {
            const mid = Math.floor((left + right) / 2);
            mergeSortHelper(left, mid);
            mergeSortHelper(mid + 1, right);
            merge(left, mid, right);
        }
    }
    
    mergeSortHelper(0, temp.length - 1);
    
    steps.push({
        array: [...temp],
        comparing: [],
        sorted: Array.from({length: temp.length}, (_, i) => i)
    });
    
    return steps;
}

// Use selection sort as fallback for rarer, unimplemented algorithms 
function heapSort(arr) {
    return selectionSort(arr);
}

function countingSort(arr) {
    return selectionSort(arr);
}

function radixSort(arr) {
    return selectionSort(arr);
}

function bucketSort(arr) {
    return selectionSort(arr);
}

// =========================== ALGORITHM ROUTER ===================================
function getSortingSteps(algorithm, array) {
    const algoMap = {
        'bubble': { fn: bubbleSort, name: 'Bubble Sort' },
        'insertion': { fn: insertionSort, name: 'Insertion Sort' },
        'selection': { fn: selectionSort, name: 'Selection Sort' },
        'quick': { fn: quickSort, name: 'Quick Sort' },
        'merge': { fn: mergeSort, name: 'Merge Sort' },
        'heap': { fn: heapSort, name: 'Heap Sort' },
        'counting': { fn: countingSort, name: 'Counting Sort' },
        'radix': { fn: radixSort, name: 'Radix Sort' },
        'bucket': { fn: bucketSort, name: 'Bucket Sort' },
        'default': { fn: bubbleSort, name: 'Bubble Sort (Default)' }
    };
    
    const selected = algoMap[algorithm] || algoMap['default'];
    algorithmName = selected.name;
    
    return selected.fn(array);
}

// =========================== VISUALIZATION ===================================

function renderStep(step) {
    
    const { array, comparing = [], swapping = [], sorted = [] } = step;
    const maxVal = Math.max(...array);
    
    arrayContainer.innerHTML = '';
    
    array.forEach((value, index) => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        
        const height = (value / maxVal) * 320; 
        bar.style.height = `${height}px`;
        
        // Apply state-based colors
        if (sorted.includes(index)) {
            bar.classList.add('sorted');
        } else if (swapping.includes(index)) {
            bar.classList.add('swapping');
        } else if (comparing.includes(index)) {
            bar.classList.add('comparing');
        }
        
        const valueLabel = document.createElement('span');
        valueLabel.className = 'bar-value';
        valueLabel.textContent = value;
        bar.appendChild(valueLabel);
        
        arrayContainer.appendChild(bar);
    });
}

function updateUI() {
    if (stepNumber) stepNumber.textContent = currentStepIndex + 1;
    if (totalSteps) totalSteps.textContent = sortSteps.length;
    if (algorithmNameEl) algorithmNameEl.textContent = algorithmName;
    
    if (prevBtn) prevBtn.disabled = currentStepIndex === 0;
    if (nextBtn) nextBtn.disabled = currentStepIndex >= sortSteps.length - 1;
    
    if (sortSteps.length > 0) {
        renderStep(sortSteps[currentStepIndex]);
    }
}

// =========================== CONTROL FUNCTIONS ===================================

function generateAndSort(algorithm, arrayDataStr) {
    console.log('Generating visualization for:', algorithm, arrayDataStr);
    
    showLoadingState(); 

    setTimeout(() => {
        try {
            // Parse the array data
            const array = arrayDataStr
                .split(',')
                .map(s => parseInt(s.trim()))
                .filter(n => !isNaN(n));
            
            if (array.length === 0) {
                showErrorState('No valid array data found!');
                return;
            }
            
            // Generate sorting steps
            sortSteps = getSortingSteps(algorithm, array);
            currentStepIndex = 0;
            
            console.log(`Generated ${sortSteps.length} steps for ${algorithmName}`);
            
            updateUI();
            
            if (statusMessage) {
                statusMessage.classList.add('active');
                statusMessage.textContent = `Ready: ${sortSteps.length} steps generated`;
            }
        } catch (error) {
            console.error('Visualization error:', error);
            showErrorState('Failed to generate visualization');
        }
    }, 100);
}

function nextStep() {
    if (currentStepIndex < sortSteps.length - 1) {
        currentStepIndex++;
        updateUI();
    }
}

function prevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        updateUI();
    }
}
