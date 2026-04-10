# Personal Finance Tracker (PoC 17)

A full-stack Personal Finance Graph application built as a Proof of Concept (PoC). The project visualizes financial data, including income, outflows, and recurring spends, using an intelligence sidebar and an interactive main stage view.

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS, Recharts.
- **Backend**: Python, FastAPI, Pandas, Pydantic.

## Prerequisites

- **Node.js**: v18 or higher
- **Python**: v3.9 or higher

## Installation Guide

Follow these steps to set up and run the project locally.

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd "PoC 17 Personal finance tracker"
```

### 2. Backend Setup

The backend serves financial data processing and provides insights like daily noise rate and runway estimation.

```bash
# 1. Create a virtual environment in the project root
python -m venv venv

# 2. Activate the virtual environment
source venv/bin/activate  # On Windows, use: .\venv\Scripts\activate

# 3. Install required dependencies
pip install fastapi uvicorn pandas pydantic

# 4. Navigate into the backend directory
cd backend

# 5. Start the FastAPI development server
uvicorn main:app --reload
```

**Backend Endpoints:**
- Local API Base: `http://127.0.0.1:8000`
- Swagger UI (Docs): [http://127.0.0.1:8000/docs#/](http://127.0.0.1:8000/docs#/)
- Intelligence Data JSON: [http://127.0.0.1:8000/intelligence/rail-data](http://127.0.0.1:8000/intelligence/rail-data)

### 3. Frontend Setup

The frontend consumes the FastAPI backend and visualizes the structured data.

```bash
# 1. Open a new terminal window and navigate to the frontend directory
cd "PoC 17 Personal finance tracker/frontend"

# 2. Install dependencies
npm install

# 3. Start the Next.js development server
npm run dev
```

**Frontend Interface:**
- Available at: [http://localhost:3000](http://localhost:3000)

## Useful Commands

- **Repomix Generator**: `npx repomix` (Used to generate a comprehensive XML file of the repository `repomix-output.xml` for AI context).
