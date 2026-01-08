window.onload = function() {
    window.currentPage = 3;
    console.log("Current Page:", window.currentPage); // For debugging purposes
};

// Hardcoded array
globalArray = JSON.parse(localStorage.getItem("globalArray") || "[0]");
console.log("Retrieved in treeshow.js:", globalArray);
const input = globalArray.split(",");
console.log(input);

// Automatically generate and display the tree
const treeContainer = document.getElementById('treeContainer');
treeContainer.innerHTML = ''; // Clear previous content

const treeRoot = createTree(input);
const treeTable = createTreeTable(treeRoot);
treeContainer.appendChild(treeTable);

// Function to create tree structure
function createTree(array) {
    if (!array.length) return null;

    const root = { value: array[0], left: null, right: null };
    const nodes = [root];
    let i = 1;

    for (let node of nodes) {
        if (i < array.length) {
            node.left = { value: array[i++], left: null, right: null };
            nodes.push(node.left);
        }
        if (i < array.length) {
            node.right = { value: array[i++], left: null, right: null };
            nodes.push(node.right);
        }
    }

    return root;
}

// Function to generate tree table dynamically
function createTreeTable(root) {
    if (!root) return null;

    const table = document.createElement('table');
    table.classList.add('tree-table');

    const rows = [];
    const maxDepth = getDepth(root);
    const maxColumns = Math.pow(2, maxDepth) - 1; // Ensures symmetry

    // Initialize rows with empty arrays
    for (let i = 0; i < maxDepth; i++) {
        rows[i] = new Array(maxColumns).fill(null);
    }

    function placeNode(node, row, col) {
        if (!node) return;
        rows[row][col] = node.value;

        if (node.left) placeNode(node.left, row + 1, col - Math.pow(2, maxDepth - row - 2));
        if (node.right) placeNode(node.right, row + 1, col + Math.pow(2, maxDepth - row - 2));
    }

    placeNode(root, 0, Math.floor(maxColumns / 2));

    for (let r = 0; r < rows.length; r++) {
        const tr = document.createElement('tr');
        for (let c = 0; c < maxColumns; c++) {
            const td = document.createElement('td');
            td.classList.add('tree-cell');

            if (rows[r][c] !== null) {
                const nodeDiv = document.createElement('div');
                nodeDiv.classList.add('tree-node');
                nodeDiv.textContent = rows[r][c];
                td.appendChild(nodeDiv);
            } else {
                td.classList.add('empty-cell'); // Keeps symmetry
            }

            tr.appendChild(td);
        }
        table.appendChild(tr);
    }

    return table;
}

// Calculate tree depth dynamically
function getDepth(node) {
    if (!node) return 0;
    return 1 + Math.max(getDepth(node.left), getDepth(node.right));
}