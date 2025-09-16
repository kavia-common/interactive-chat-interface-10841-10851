# Ocean Professional Chat Frontend

Modern, lightweight React UI for an LLM chat experience with file/photo attachments. Integrates with the FastAPI backend.

## Features
- Ocean Professional theme (blue primary, amber accents, minimalist, rounded corners)
- Sidebar with model selector and chat history
- Main chat area with messages and assistant typing indicator
- File/photo uploads (via backend /uploads endpoints)
- Input with optional system prompt
- Top bar with provider health and quick settings
- No UI framework dependencies

## Quickstart
1) Install dependencies:
   npm install

2) Configure backend base URL (optional):
   - Copy .env.example to .env and set REACT_APP_API_BASE (defaults to same origin)

3) Run:
   npm start

The app expects a FastAPI backend exposing endpoints described in the included OpenAPI (e.g., /models, /chat, /chat/sessions, /uploads/file, /uploads/photo).

## Environment Variables
- REACT_APP_API_BASE: Base URL of the FastAPI backend, e.g. http://localhost:8000

## Notes
- History is populated from /chat/sessions and messages from /chat/{session_id}/messages.
- Sending a message to /chat automatically creates a new session if session_id is omitted.
