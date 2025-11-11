# Digital Lawyer

An offline-first AI legal assistant that runs entirely on your device.

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Ollama](https://img.shields.io/badge/Ollama-Local%20AI-green?logo=ollama)](https://ollama.ai/)

## Overview

Digital Lawyer is a **privacy-first AI legal assistant** designed to provide legal guidance while protecting your sensitive information. Unlike cloud-based AI services that may store and analyze your conversations, Digital Lawyer runs entirely on your device using local AI models.

## 🚀 Quick Start

### Prerequisites

- **Ollama** installed and running ([Download here](https://ollama.ai/))
- **4GB+ RAM** recommended for AI models

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/nancy-kataria/digital-lawyer.git
   cd digital-lawyer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up AI models**
   ```bash
   # Install required Ollama models
   ollama pull gemma3:4b
   ollama pull llava:7b
   
   # Verify setup
   npm run setup-models
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```


## Basic Text Generation:

Provider: Ollama, 
Model: Gemma3n:4b

```
const model_provider = {
        provider: "ollama-local",
        textModel: "gemma3:4b",
        visionModel: "llava:7b",
        description: "Local Ollama instance",
      }

    const systemPrompt = "You are a helpful legal assistant AI. Provide general legal information and guidance, but always remind users to consult with a qualified attorney for specific legal advice. Be helpful, accurate, and professional. Please limit your responses to 2 or 3 paragraphs.";

    const messages: ModelMessage[] = [
      {
        role: "system",
        content: systemPrompt
      },
      {
        role: "user", 
        content: userInput
      }
    ];

    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model_provider.textModel,
        messages: messages,
        stream: false
      })
    });
```

Test the above api:

```
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"userInput": "What are my rights as a tenant?"}'
```

## AI Models

### Text Generation: Gemma 3:4b
- **Purpose**: Legal reasoning and response generation
- **Capabilities**: 
  - Legal document analysis
  - Contract interpretation
  - Legal advice and guidance
  - Legal research assistance

### Vision Analysis: LLaVA 7b
- **Purpose**: Document and image understanding
- **Capabilities**:
  - Contract and legal document OCR
  - Image-based evidence analysis
 
### Model Performance
- **Response Time**: 2-10 seconds (depending on hardware)
- **Quality**: Professional-grade legal assistance
- **Languages**: Primarily English (expandable)
- **Accuracy**: Continuously improving with model updates

## Usage Guide

### Basic Legal Consultation
1. Type your legal question in the chat interface
2. Get AI-powered legal guidance and advice
3. Ask follow-up questions for clarification

### Document Analysis
1. Upload legal documents, contracts, or images
2. Ask questions about the uploaded content
3. Get detailed analysis and interpretation

### Example Queries
- "What should I know about signing this employment contract?"
- "Can you analyze this lease agreement for any red flags?"
- "What are my rights in this situation?"
- "Help me understand this legal document"

## System Requirements

### Minimum Requirements
- **RAM**: 8GB (models use ~7GB)
- **Storage**: 10GB free space
- **CPU**: Multi-core processor (Intel/AMD/Apple Silicon)
- **OS**: Windows 10+, macOS 10.15+, or Linux

### Recommended
- **RAM**: 16GB+ for better performance
- **Storage**: SSD for faster model loading
- **GPU**: Optional but improves inference speed
- **Network**: For initial model downloads

### Mobile/Low-Resource Devices
- Consider using smaller models for better performance
- Web interface works on tablets and smartphones
- Progressive Web App (PWA) support planned

---

**Remember**: This tool provides general information only. Always consult with a qualified attorney for legal advice specific to your situation.
