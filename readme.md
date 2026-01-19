# ParserPro

AI-powered code analyzer for instant explanations, visualizations, and complexity analysis.

[![Live](https://img.shields.io/badge/ParserePro-live-brightgreen)](https://parserpro.vercel.app/)

## Overview

ParserPro is a web-based code analysis tool built with vanilla JavaScript, HTML, and CSS. It provides **plug-and-play**, **one-stop-shop** code analysis leveraging AI to deliver instant insights through an intuitive interface.


## Features

#### Code Explanation
- **Summary**: Understand how your highlighted code fits within the broader context
- **Key Concepts**: Identify programming patterns and principles used
- **Line-by-Line**: Step-through breakdown of what each line does

#### Algorithm Visualization
- Detects sorting algorithms & generates step-by-step visual animation
- Uses your array data or generates *dummy data* automatically
- Supports: Bubble, Insertion, Selection, Quick, and Merge Sort

#### Complexity Analysis
- **Time Complexity**: Best, average, and worst-case scenarios
- **Space Complexity**: Auxiliary and total memory usage
- **Optimization Tips**: AI-powered suggestions to improve performance

## Demo
![ParserPro Demo](media/ParserPro.gif)

## Quick Start

**Live Version:** [Try ParserPro Now](https://parserpro.vercel.app/)

**Local Development:** Want to run locally? [Contact me](mailto:lamcn51@gmail.com) for setup instructions.

## Architecture

ParserPro uses a **parent + iframe** architecture for separation of concerns:
```
index.html (parent)
├── explanation.html (iframe) - Code explanations
├── sort.html (iframe) - Sorting visualizations  
└── complexity.html (iframe) - Performance analysis
```

**Communication Flow:**
1. User highlights code in parent window
2. Parent sends code to backend API (Vercel /api/parse)
3. AI processes request (Groq LLM)
4. Parent forwards results to active iframe via `postMessage`
5. Iframe renders visualization/analysis

**Security:** API keys are handled server-side only. Client never sees credentials.

## Tech Stack

#### Frontend
- **Vanilla JavaScript** - Core logic and DOM manipulation
- **HTML/CSS** - UI and styling
- [**Prism.js**](https://prismjs.com/) - Syntax highlighting
- [**Marked.js**](https://marked.js.org/) - Markdown rendering for AI responses

#### Backend
- **Express.js** - API routing and server for local development
- **Groq API** - LLM inference ([llama-3.3-70b-versatile](https://console.groq.com/docs/model/llama-3.3-70b-versatile))

#### Fonts
- Segoe UI (interface)
- Consolas (code blocks)
- Russo One (Stage UI)

## License

MIT License - feel free to use and modify

## Contact

**Carson Lam**  
Mail: [lamcn51@gmail.com](mailto:lamcn51@gmail.com)  
LinkedIn: [Linkedin](https://www.linkedin.com/in/lam-carson/)

---

⭐ Star this repo if you found it helpful!