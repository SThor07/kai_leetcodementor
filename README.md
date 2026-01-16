# Kai.v3 LeetCode Mentor (Extension + Local Server)

Kai is a lightweight Chrome extension that sits on LeetCode problem pages and gives
short, non-solution nudges. It talks to a local Express server that calls Ollama
for responses. The goal is to keep you thinking, not to hand you the full answer.

## What you get
- A floating "K" button on LeetCode problems with quick actions (Hint/Debug/Optimize).
- One-click explanations of your own solution (Beginner/Technical/Complexity).
- Automatic nudges after Run/Submit results (WA/TLE/RE/MLE/AC).
- A snapshot hotkey (Cmd/Ctrl+Shift+O) that captures your code from clipboard.

## Screenshots

```
<img width="585" height="715" alt="Screenshot 2026-01-16 at 1 57 31 PM" src="https://github.com/user-attachments/assets/4f749145-9cdc-4724-b2b1-26d519bb1d37" />

<img width="585" height="715" alt="Screenshot 2026-01-16 at 1 59 16 PM" src="https://github.com/user-attachments/assets/eda4d613-6d01-457b-90a6-e316ca5a8000" />

```

## Repo layout
- `leetcode-mentor-extension/` Chrome extension (Manifest V3)
- `mentor-server/` Express server that talks to Ollama

## How it works (high level)
1) The content script injects the Kai UI into LeetCode pages.
2) The background worker proxies requests to `http://localhost:3333`.
3) The server builds a strict "no full solution" prompt and calls Ollama.

## Requirements
- Node.js 18+ (for global `fetch` in the server).
- Ollama running locally with a model pulled (default: `llama3.2:3b`).
- Chrome (or a Chromium-based browser that supports MV3 extensions).

## Setup

### 1) Start the mentor server
```
cd /Users/shree/Vibe101\ copy/mentor-server
npm install
node server.js
```

By default the server runs at `http://localhost:3333` and uses:
```
const MODEL = "llama3.2:3b";
```
Edit `mentor-server/server.js` if you want a different model.

### 2) Load the Chrome extension
1. Open `chrome://extensions`.
2. Enable "Developer mode".
3. Click "Load unpacked".
4. Select `leetcode-mentor-extension/`.

## Usage
- Open any LeetCode problem page.
- Click the "K" button to open Kai.
- Paste your code in the editor, then press Cmd/Ctrl+Shift+O to snapshot.
- Use Hint/Debug/Optimize or Explain (Beginner/Technical/Complexity).

## Troubleshooting
- "Couldn’t reach mentor server"
  - Make sure `node server.js` is running.
  - Check `http://localhost:3333/health` in your browser.
- "Clipboard access failed"
  - Click into the editor and copy (Cmd/Ctrl+A then Cmd/Ctrl+C), then retry.
- Ollama errors
  - Ensure Ollama is running and the model name matches `MODEL`.

## Safety & behavior guardrails
The server prompt explicitly avoids full solutions and clamps responses that look
like raw code or complete answers.

## License
MIT (add a LICENSE file if you want to publish publicly).
