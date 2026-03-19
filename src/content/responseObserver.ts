const RESPONSE_SELECTORS = [
  ".font-claude-message",
  '[data-testid="assistant-message"]',
  '[data-is-streaming="false"]',
];

const captured = new WeakSet<Element>();
const watching = new Map<Element, ReturnType<typeof setTimeout>>();

function getResponseText(el: Element): string {
  return (el as HTMLElement).innerText?.trim() || el.textContent?.trim() || "";
}

function findResponseElements(): Element[] {
  for (const selector of RESPONSE_SELECTORS) {
    const els = document.querySelectorAll(selector);
    if (els.length > 0) return Array.from(els);
  }
  return [];
}

function captureElement(el: Element) {
  if (captured.has(el)) return;
  const text = getResponseText(el);
  if (text.length < 20) return;
  captured.add(el);
  watching.delete(el);
  chrome.runtime.sendMessage({
    type: "ADD_RESPONSE",
    text: text.slice(0, 2000),
  }).catch(() => {});
}

function scheduleCapture(el: Element) {
  const existing = watching.get(el);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => captureElement(el), 1500);
  watching.set(el, timer);
}

export function startResponseObserver() {
  const observer = new MutationObserver(() => {
    const els = findResponseElements();
    for (const el of els) {
      if (!captured.has(el)) {
        scheduleCapture(el);
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  return observer;
}
