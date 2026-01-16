// ---- CLEANUP any older injected UIs (prevents "still same" problem) ----
(() => {
  console.log("[Kai] content script loaded", location.href);
  document.documentElement.setAttribute("data-kai", "loaded");
  const oldIds = [
    "kai-host",
    "kai-host-v2",
    "kai-host-v3",
    "kai-host-lc",
    "mentor-kai-host"
  ];
  for (const id of oldIds) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
})();
(() => {
  const INJECT_VERSION = "ui-lc-orange-2";
  if (window.__kaiLCInjectedVersion === INJECT_VERSION) return;
  window.__kaiLCInjectedVersion = INJECT_VERSION;

  // ---- Shadow host ----
  const host = document.createElement("div");
  host.id = "mentor-kai-host";
  Object.assign(host.style, {
    position: "fixed",
    inset: "0",
    pointerEvents: "none",
    zIndex: "2147483647"
  });
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      * { box-sizing: border-box; }

      /* LeetCode-logo palette */
      :root{
        --lc-green: #FF6A00;     /* vivid orange */
        --lc-green-2: #FFB000;   /* bright amber */

        --bg: #FF6A00;           /* loud orange panel */
        --fg: #111827;           /* primary text */
        --muted: #9CA3AF;        /* secondary */

        --border: #FF6A00;
        --accent: rgba(255,106,0,0.75);
        --shadow: 0 16px 44px rgba(0,0,0,0.70);

        --chip: #1F1F1F;
        --chipHover: #262626;
        --chipfg: #E5E7EB;

        --btn: #FF6A00;
        --btnfg: #FFFFFF;

        --good: #22C55E;
        --warn: #FF6A00;
        --bad: #EF4444;
      }

      /* Light mode (still LC-feel) */
      @media (prefers-color-scheme: light){
        :root{
          --lc-green: #FFA116;
          --lc-green-2: #D97706;

        --bg: #FFF6E8;
        --fg: #1F2937;
          --muted: #6B7280;

        --border: #FF6A00;
        --accent: rgba(255,106,0,0.55);
          --shadow: 0 14px 32px rgba(0,0,0,0.16);

          --chip: #F3F4F6;
          --chipHover: #EAECEF;
          --chipfg: #111827;

        --btn: #FF6A00;
          --btnfg: #FFFFFF;

          --good: #16A34A;
        --warn: #FF6A00;
          --bad: #DC2626;
        }
      }

      .wrap{
        position: fixed;
        top: 74px;
        right: 16px;
        pointer-events: auto;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
      }

      /* K button matches LC action style */
      .k{
        width: 40px; height: 40px;
        border-radius: 14px;
        border: 2px solid #FF6A00;
        background: #FFB000;
        color: var(--btnfg);
        font-weight: 950;
        display: grid;
        place-items: center;
        cursor: pointer;
        box-shadow:
          0 0 0 2px rgba(255,106,0,0.35),
          var(--shadow);
        user-select: none;
      }
      .k:hover{ transform: translateY(-1px); filter: brightness(1.03); }

      .toast{
        width: 340px;
        background: var(--bg);              /* fully opaque */
        color: var(--fg);
        border: 2px solid var(--border);
        border-radius: 16px;
        box-shadow:
          0 0 0 1px var(--accent),
          var(--shadow);
        outline: none;
        opacity: 1;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        overflow: hidden;
        display: none;
      }

      .head{
        display:flex; align-items:center; justify-content:space-between;
        padding: 10px 12px;
        border-bottom: 1px solid var(--border);
        background: #FFB000;
      }
      .hleft{display:flex; align-items:center; gap:10px;}

      .dot{
        width:10px; height:10px; border-radius:99px;
        background: var(--warn);
        box-shadow: 0 0 0 4px rgba(245,158,11,0.18);
      }

      .title{font-weight: 900; font-size: 13px;}

      .x{
        border: 1px solid var(--border);
        background: transparent;
        color: var(--fg);
        border-radius: 12px;
        padding: 6px 10px;
        font-weight: 800;
        font-size: 12px;
        cursor: pointer;
      }
      .x:hover{ background: rgba(127,127,127,0.12); }

      .body{
        padding: 12px;
        background: #FFF6E8;
        color: #1F2937;
      }
      .msg{ font-size: 13px; line-height: 1.35; white-space: pre-wrap; margin-bottom: 10px; }
      .muted{ font-size: 12px; color: var(--muted); font-weight: 700; margin-bottom: 10px; }

      .chips{ display:flex; flex-wrap:wrap; gap:8px; margin-bottom: 10px; }

      .chip{
        padding: 7px 10px;
        border-radius: 999px;
        border: 1px solid #FF6A00;
        background: var(--chip);
        color: var(--chipfg);
        font-weight: 800;
        font-size: 12px;
        cursor: pointer;
        user-select: none;
      }
      .chip:hover{
        background: var(--chipHover);
        filter: none;
      }

      textarea{
        width: 100%;
        min-height: 54px;
        resize: none;
        border: 1px solid #FF6A00;
        border-radius: 14px;
        padding: 10px 12px;
        font-size: 13px;
        outline: none;
        background: transparent;
        color: var(--fg);
      }
      textarea:focus{
        box-shadow: 0 0 0 4px rgba(0,175,155,0.18);
        border-color: rgba(0,175,155,0.55);
      }

      .row{ display:flex; align-items:center; gap:10px; margin-top: 10px; }

      .btn{
        flex: 1;
        border: none;
        border-radius: 14px;
        padding: 10px 12px;
        background: var(--lc-green);
        color: var(--btnfg);
        font-weight: 900;
        cursor:pointer;
      }
      .btn:hover{ filter: brightness(1.03); }

      .status{ margin-top: 8px; font-size: 12px; color: var(--muted); font-weight: 800; }

      .divider{
        height: 1px;
        background: var(--border);
        margin: 10px 0;
      }
    </style>

    <div class="wrap">
      <div class="k" id="k" title="Kai">K</div>

      <div class="toast" id="toast">
        <div class="head">
          <div class="hleft">
            <div class="dot" id="dot"></div>
            <div class="title" id="tTitle">
              <span id="tTitleName">Kai.v3</span>
            </div>
          </div>
          <button class="x" id="close">Close</button>
        </div>

        <div class="body">
          <div class="msg" id="msg"></div>
          <div class="muted" id="hint"></div>

          <div class="chips">
            <div class="chip" id="cDebug">Debug</div>
            <div class="chip" id="cHint">Hint</div>
            <div class="chip" id="cOptimize">Optimize</div>
            <div class="chip" id="cSnap">Snapshot (⌘/Ctrl+Shift+O)</div>
          </div>

          <div class="divider"></div>

          <div class="chips">
            <div class="chip" id="cBeginner">Explain (Beginner)</div>
            <div class="chip" id="cTech">Explain (Technical)</div>
            <div class="chip" id="cCx">Complexity</div>
          </div>

          <textarea id="q" placeholder="Ask Kai (quick)…"></textarea>

          <div class="row">
            <button class="btn" id="send">Ask</button>
          </div>

          <div class="status" id="status"></div>
        </div>
      </div>
    </div>
  `;

  const $ = (id) => shadow.getElementById(id);
  const toast = $("toast");
  const msg = $("msg");
  const hint = $("hint");
  const status = $("status");

  const SESSION = { lastOutcome: "", lastShown: 0 };

  function showToast({ title = "Kai.v3", text = "", level = "warn", helper = "" }) {
    const now = Date.now();
    if (now - SESSION.lastShown < 350) return;
    SESSION.lastShown = now;

    $("tTitleName").textContent = title;
    msg.textContent = text;
    hint.textContent = helper;

    const dot = $("dot");
    dot.style.background =
      level === "bad" ? "var(--bad)" : level === "good" ? "var(--good)" : "var(--warn)";

    toast.style.display = "block";
  }

  function hideToast() {
    toast.style.display = "none";
    status.textContent = "";
  }

  $("close").onclick = hideToast;

  $("k").onclick = () => {
    if (toast.style.display === "block") {
      hideToast();
      return;
    }
    showToast({
      title: "Kai.v3",
      text: "I’m here if you want a nudge (no solutions).",
      helper: "For code-aware help: copy code (Cmd+A/Cmd+C) → ⌘/Ctrl+Shift+O → then Hint/Explain.",
      level: "warn"
    });
  };

  function extractProblemTitle() {
    return (document.title || "").replace(" - LeetCode", "").trim();
  }

  function extractProblemText() {
    const candidate =
      document.querySelector("div[data-track-load='description_content']") ||
      document.querySelector("div[class*='content__']") ||
      document.querySelector("main") ||
      document.body;
    return (candidate?.innerText || "").slice(0, 6500);
  }

  // ---- Mentor via background proxy ----
  function askMentor(userMessage) {
    status.textContent = "Thinking…";
    chrome.runtime.sendMessage(
      {
        type: "KAI_MENTOR",
        problemTitle: extractProblemTitle(),
        problemText: extractProblemText(),
        userMessage
      },
      (resp) => {
        status.textContent = "";
        if (!resp?.ok) {
          showToast({
            title: "Kai.v3",
            text: "Couldn’t reach mentor server.",
            helper: `Error: ${resp?.error || "Failed"} • Is node server.js running?`,
            level: "bad"
          });
          return;
        }
        showToast({ title: "Kai.v3", text: resp.reply, level: "warn" });
      }
    );
  }

  function askExplain(mode) {
    status.textContent = "Explaining…";
    chrome.runtime.sendMessage(
      {
        type: "KAI_EXPLAIN",
        problemTitle: extractProblemTitle(),
        problemText: extractProblemText(),
        mode
      },
      (resp) => {
        status.textContent = "";
        if (!resp?.ok) {
          showToast({
            title: "Explain",
            text: "Couldn’t reach /explain endpoint.",
            helper: `Error: ${resp?.error || "Failed"} • Add /explain in mentor-server.`,
            level: "bad"
          });
          return;
        }
        showToast({ title: "Explain", text: resp.reply, level: "warn" });
      }
    );
  }

  $("send").onclick = () => {
    const q = ($("q").value || "").trim();
    if (!q) return;
    $("q").value = "";
    askMentor(q);
  };

  $("cDebug").onclick = () => askMentor("I got an error. Help me debug with a nudge (no solution).");
  $("cHint").onclick = () => askMentor("Give me one leading question, two hints, and a next action (no solution).");
  $("cOptimize").onclick = () => askMentor("My approach is too slow. Nudge me to optimize (no solution).");

  $("cSnap").onclick = () =>
    showToast({
      title: "Snapshot",
      text: "Shortcut: ⌘/Ctrl+Shift+O",
      helper: "Copy code first: click editor → Cmd+A → Cmd+C",
      level: "warn"
    });

  $("cBeginner").onclick = () => askExplain("beginner");
  $("cTech").onclick = () => askExplain("technical");
  $("cCx").onclick = () => askExplain("complexity");

  // Receive snapshot request from background (hotkey)
  chrome.runtime.onMessage.addListener((m) => {
    if (m?.type === "KAI_SNAPSHOT_REQUEST") snapshotClipboard();
  });

  async function snapshotClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        showToast({
          title: "Snapshot",
          text: "Clipboard empty.",
          helper: "Click editor → Cmd+A → Cmd+C → ⌘/Ctrl+Shift+O",
          level: "warn"
        });
        return;
      }
      chrome.runtime.sendMessage({ type: "KAI_SNAPSHOT_SAVE", code: text.slice(0, 12000) });
      showToast({
        title: "Snapshot saved ✅",
        text: "Nice — Debug/Hint/Explain will use your code now.",
        helper: "",
        level: "good"
      });
    } catch {
      showToast({
        title: "Snapshot blocked",
        text: "Clipboard access failed.",
        helper: "Try: click editor → Cmd+A → Cmd+C → ⌘/Ctrl+Shift+O",
        level: "bad"
      });
    }
  }

  // ---- Trigger detection: watch Test Result ----
  const OUTCOMES = [
    { text: "Runtime Error", kind: "re", level: "bad" },
    { text: "Wrong Answer", kind: "wa", level: "bad" },
    { text: "Time Limit Exceeded", kind: "tle", level: "bad" },
    { text: "Memory Limit Exceeded", kind: "mle", level: "bad" },
    { text: "Accepted", kind: "ac", level: "good" }
  ];

  function findTestResultRoot() {
    const els = Array.from(document.querySelectorAll("div,span"));
    for (const el of els) {
      const t = (el.textContent || "").trim();
      if (t === "Test Result" || t.includes("Test Result")) {
        let cur = el;
        for (let i = 0; i < 6 && cur?.parentElement; i++) cur = cur.parentElement;
        return cur;
      }
    }
    return null;
  }

  let root = null;
  let userTriggered = false;
  let lastText = "";
  let initialized = false;
  let lastUrl = location.href;
  const boot = setInterval(() => {
    if (root) return clearInterval(boot);
    root = findTestResultRoot();
    if (!root) return;

    // Mark when the user runs/submits so we only show results after an action.
    const markUserTriggered = () => {
      userTriggered = true;
    };
    document.addEventListener(
      "click",
      (e) => {
        const btn = e.target?.closest?.("button,div[role='button']");
        if (!btn) return;
        const label = (btn.textContent || "").trim().toLowerCase();
        const aria = (btn.getAttribute("aria-label") || "").trim().toLowerCase();
        const title = (btn.getAttribute("title") || "").trim().toLowerCase();
        const e2e = (btn.getAttribute("data-e2e-locator") || "").trim().toLowerCase();
        const isRun =
          label.includes("run") ||
          aria.includes("run") ||
          title.includes("run") ||
          e2e.includes("run");
        const isSubmit =
          label.includes("submit") ||
          aria.includes("submit") ||
          title.includes("submit") ||
          e2e.includes("submit");
        if (isRun || isSubmit) markUserTriggered();
      },
      { capture: true }
    );

    lastText = root.innerText || "";
    initialized = false;

    const obs = new MutationObserver(() => {
      const t = root.innerText || "";
      if (!initialized) {
        initialized = true;
        lastText = t;
        return; // ignore existing result on initial page load
      }
      if (t === lastText) return;
      lastText = t;
      if (!userTriggered) return; // ignore changes before a user run/submit
      for (const o of OUTCOMES) {
        if (t.includes(o.text)) {
          if (SESSION.lastOutcome === o.kind) return;
          SESSION.lastOutcome = o.kind;

          if (o.kind === "ac") {
            showToast({
              title: "Accepted ✅",
              text: "Nice. Want a breakdown?",
              helper: "Try Explain (Beginner) or Explain (Technical) — then check Complexity.",
              level: "good"
            });
          } else {
            showToast({
              title: o.text,
              text: "Want help? I’ll nudge you without giving the solution.",
              helper: "Best results: copy code → ⌘/Ctrl+Shift+O → then Hint/Debug.",
              level: o.level
            });
          }
          return;
        }
      }
    });

    obs.observe(root, { childList: true, subtree: true, characterData: true });
  }, 800);

  // Reset per navigation in LeetCode SPA so old state doesn't carry over.
  setInterval(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    userTriggered = false;
    initialized = false;
    lastText = root?.innerText || "";
    SESSION.lastOutcome = "";
    hideToast();
  }, 800);
})();
