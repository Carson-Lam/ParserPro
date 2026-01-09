// =========================== GLOBAL STATE ===================================
window.onload = function() {
    window.currentPage = 2;
    console.log("Sort page loaded");
    window.parent.postMessage({ pageNumber: 2 }, '*');
};

let sortSteps = [];
let currentStepIndex = 0;
let algorithmName = 'Unknown Algorithm';

// =========================== LISTEN FOR PARENT MESSAGES ===================================
window.addEventListener('message', function(event) {
    if (event.data?.action === 'generateVisualization') {
        console.log('Received visualization request:', event.data);
        generateAndSort(event.data.algorithm, event.data.arrayData);
    }

    if (event.data?.vizError) {
        document.getElementById('statusMessage').textContent = event.data.vizError;
        document.getElementById('statusMessage').style.color = '#ff6b6b';
    }
});

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

// For now, use selection sort as fallback
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
    const container = document.getElementById('arrayContainer');
    if (!container) return;
    
    const { array, comparing = [], swapping = [], sorted = [] } = step;
    const maxVal = Math.max(...array);
    
    container.innerHTML = '';
    
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
        
        container.appendChild(bar);
    });
}

function updateUI() {
    document.getElementById('stepNumber').textContent = currentStepIndex + 1;
    document.getElementById('totalSteps').textContent = sortSteps.length;
    document.getElementById('algorithmName').textContent = algorithmName;
    
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    
    prevBtn.disabled = currentStepIndex === 0;
    nextBtn.disabled = currentStepIndex >= sortSteps.length - 1;
    
    if (sortSteps.length > 0) {
        renderStep(sortSteps[currentStepIndex]);
    }
}

// =========================== CONTROL FUNCTIONS ===================================

function generateAndSort(algorithm, arrayDataStr) {
    console.log('Generating visualization for:', algorithm, arrayDataStr);
    
    // Parse the array data
    const array = arrayDataStr
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));
    
    if (array.length === 0) {
        console.error('No valid array data');
        document.getElementById('statusMessage').textContent = 'Error: No valid array data found';
        return;
    }
    
    // Generate sorting steps
    sortSteps = getSortingSteps(algorithm, array);
    currentStepIndex = 0;
    
    console.log(`Generated ${sortSteps.length} steps for ${algorithmName}`);
    
    updateUI();
    
    document.getElementById('statusMessage').textContent = `Ready: ${sortSteps.length} steps`;
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
