/**
 * DOM injection helpers for claude.ai
 */

/** Create a container div and append it to the target element */
function createContainer(id: string): HTMLDivElement {
  const existing = document.getElementById(id);
  if (existing) return existing as HTMLDivElement;

  const container = document.createElement("div");
  container.id = id;
  return container;
}

/** Mount the context meter bar at the top of the page */
export function mountContextMeter(): HTMLDivElement {
  const container = createContainer("flint-context-meter");
  container.style.cssText =
    "position:fixed;top:0;left:0;right:0;z-index:99999;pointer-events:none;";
  document.body.prepend(container);
  return container;
}

/** Mount the prompt analyzer badge near the textarea */
export function mountPromptAnalyzer(): HTMLDivElement {
  const container = createContainer("flint-prompt-analyzer");
  container.style.cssText =
    "position:fixed;bottom:100px;right:24px;z-index:99998;";
  document.body.appendChild(container);
  return container;
}

/** Find the main textarea / contenteditable on claude.ai */
export function findTextarea(): HTMLElement | null {
  // Claude uses a contenteditable div with class fieldset or a ProseMirror editor
  return (
    document.querySelector<HTMLElement>('[contenteditable="true"]') ||
    document.querySelector<HTMLElement>("textarea") ||
    null
  );
}

/** Get all visible conversation text for context estimation */
export function getConversationText(): string {
  const messages = document.querySelectorAll(
    "[data-testid*='message'], .font-claude-message, .whitespace-pre-wrap, [class*='Message'], [class*='message']"
  );
  let text = "";
  messages.forEach((el) => {
    text += (el as HTMLElement).innerText + "\n";
  });
  // Fallback: grab main content area
  if (!text.trim()) {
    const main =
      document.querySelector("main") || document.querySelector('[role="main"]');
    if (main) text = (main as HTMLElement).innerText;
  }
  return text;
}

/** Get text from the input area */
export function getInputText(): string {
  const el = findTextarea();
  if (!el) return "";
  if (el.tagName === "TEXTAREA") return (el as HTMLTextAreaElement).value;
  return el.innerText || el.textContent || "";
}

/** Set text in the input area */
export function setInputText(text: string): void {
  const el = findTextarea();
  if (!el) return;

  if (el.tagName === "TEXTAREA") {
    (el as HTMLTextAreaElement).value = text;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  // For contenteditable (ProseMirror)
  el.focus();
  el.innerHTML = "";
  const p = document.createElement("p");
  p.textContent = text;
  el.appendChild(p);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
