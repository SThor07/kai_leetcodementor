// background.js (Manifest V3 service worker)

// In-memory per-tab storage for code snapshots
// Key: tabId -> { code: string, ts: number }
const tabState = new Map();

/**
 * Handle keyboard shortcut: Ctrl/Cmd + Shift + O
 * This asks the content script to read clipboard (must be user gesture there)
 */
chrome.commands.onCommand.addListener(async (command) => {
    if (command !== "kai_snapshot") return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    chrome.tabs.sendMessage(tab.id, {
        type: "KAI_SNAPSHOT_REQUEST"
    });
});

/**
 * Central message router
 */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    (async () => {
        const tabId = sender?.tab?.id;

        /* -----------------------------------------
         * SAVE SNAPSHOT (from content.js)
         * ----------------------------------------- */
        if (msg?.type === "KAI_SNAPSHOT_SAVE") {
            if (tabId != null) {
                tabState.set(tabId, {
                    code: msg.code || "",
                    ts: Date.now()
                });
            }
            sendResponse({ ok: true });
            return;
        }

        /* -----------------------------------------
         * MENTOR NUDGE (proxy to localhost)
         * ----------------------------------------- */
        if (msg?.type === "KAI_MENTOR") {
            const saved = tabId != null ? tabState.get(tabId) : null;

            const payload = {
                problemTitle: msg.problemTitle || "",
                problemText: msg.problemText || "",
                userCode: saved?.code || "",
                userMessage: msg.userMessage || ""
            };

            try {
                const res = await fetch("http://localhost:3333/mentor", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Mentor request failed");

                sendResponse({ ok: true, reply: data.reply });
            } catch (err) {
                sendResponse({
                    ok: false,
                    error: String(err?.message || err)
                });
            }
            return;
        }

        /* -----------------------------------------
         * EXPLAIN (Beginner / Technical / Complexity)
         * ----------------------------------------- */
        if (msg?.type === "KAI_EXPLAIN") {
            const saved = tabId != null ? tabState.get(tabId) : null;

            const payload = {
                problemTitle: msg.problemTitle || "",
                problemText: msg.problemText || "",
                userCode: saved?.code || "",
                mode: msg.mode || "beginner"
            };

            try {
                const res = await fetch("http://localhost:3333/explain", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Explain request failed");

                sendResponse({ ok: true, reply: data.reply });
            } catch (err) {
                sendResponse({
                    ok: false,
                    error: String(err?.message || err)
                });
            }
            return;
        }

        /* -----------------------------------------
         * SYSTEM NOTIFICATION (optional)
         * ----------------------------------------- */
        if (msg?.type === "KAI_NOTIFY") {
            chrome.notifications.create({
                type: "basic",
                iconUrl:
                    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAK0lEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAAwG4GqQAAAVfX0n0AAAAASUVORK5CYII=",
                title: msg.title || "Kai",
                message: msg.message || "You got this.",
                priority: 2
            });
            sendResponse({ ok: true });
            return;
        }

        sendResponse({ ok: false, error: "Unknown message type" });
    })();

    // IMPORTANT: keep message channel open for async responses
    return true;
});
