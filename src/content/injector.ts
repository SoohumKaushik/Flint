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
    "position:fixed;bottom:120px;right:24px;z-index:99998;";
  document.body.appendChild(container);
  return container;
}

/** Find the main textarea / contenteditable on claude.ai */
export function findTextarea(): HTMLElement | null {
  return (
    document.querySelector('.ProseMirror[contenteditable="true"]') as HTMLElement ||
    document.querySelector('[data-placeholder][contenteditable="true"]') as HTMLElement ||
    document.querySelector('div[contenteditable="true"]') as HTMLElement ||
    document.querySelector('textarea') as HTMLElement ||
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
  if (!el) {
    navigator.clipboard.writeText(text).catch(() => {});
    return;
  }

  if (el.tagName === "TEXTAREA") {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype, "value"
    )?.set;
    nativeInputValueSetter?.call(el, text);
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return;
  }

  // ProseMirror contenteditable (claude.ai)
  try {
    el.focus();
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(el);
      selection.removeAllRanges();
      selection.addRange(range);
      selection.deleteFromDocument();
      const textNode = document.createTextNode(text);
      const newRange = document.createRange();
      newRange.setStart(el, 0);
      newRange.collapse(true);
      newRange.insertNode(textNode);
      newRange.setStartAfter(textNode);
      newRange.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
  } catch {
    // execCommand fallback
    try {
      el.focus();
      document.execCommand("selectAll", false);
      document.execCommand("insertText", false, text);
    } catch {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }
}
