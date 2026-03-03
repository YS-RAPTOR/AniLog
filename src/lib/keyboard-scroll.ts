/**
 * keyboard-scroll.ts
 *
 * Scrolls the focused input/textarea into view when the Android keyboard opens.
 * Uses the native `keyboard-visibility-change` event from MainActivity.
 *
 *   import { initKeyboardScroll } from "@/lib/keyboard-scroll";
 *   const dispose = initKeyboardScroll();
 */

interface ImeChangeDetail {
    imeVisible: boolean;
    imeHeightCssPx: number;
}

declare global {
    interface WindowEventMap {
        "keyboard-visibility-change": CustomEvent<ImeChangeDetail>;
    }
}

const PADDING_PX = 32;
const RETRY_DELAYS = [0, 60, 150, 300];
const EDITABLE_SELECTOR = "input, textarea, [contenteditable]";

function isEditable(el: EventTarget | null): el is HTMLElement {
    if (!(el instanceof HTMLElement)) return false;
    return el.matches(EDITABLE_SELECTOR);
}

function ensureVisible(el: HTMLElement, imeHeightCssPx: number): void {
    const rect = el.getBoundingClientRect();
    const keyboardTop = window.innerHeight - imeHeightCssPx;
    const targetBottom = keyboardTop - PADDING_PX;

    // Already above the keyboard — nothing to do.
    if (rect.bottom <= targetBottom) return;

    const delta = rect.bottom - targetBottom;
    window.scrollBy({ top: delta, behavior: "instant" });
}

export function initKeyboardScroll(): () => void {
    let activeElement: HTMLElement | null = null;
    let imeHeight = 0;
    let retryTimers: number[] = [];

    function clearRetries() {
        for (const id of retryTimers) clearTimeout(id);
        retryTimers = [];
    }

    function scheduleScroll() {
        clearRetries();
        if (!activeElement || imeHeight <= 0) return;
        const el = activeElement;
        const height = imeHeight;
        for (const delay of RETRY_DELAYS) {
            retryTimers.push(
                window.setTimeout(() => {
                    if (document.activeElement !== el) return;
                    ensureVisible(el, height);
                }, delay),
            );
        }
    }

    function onFocusIn(e: FocusEvent) {
        if (!isEditable(e.target)) return;
        activeElement = e.target;
        scheduleScroll();
    }

    function onFocusOut(e: FocusEvent) {
        if (e.target === activeElement) {
            activeElement = null;
            clearRetries();
        }
    }

    function onImeChange(e: CustomEvent<ImeChangeDetail>) {
        imeHeight = e.detail.imeVisible ? e.detail.imeHeightCssPx : 0;
        scheduleScroll();
    }

    document.addEventListener("focusin", onFocusIn, { passive: true });
    document.addEventListener("focusout", onFocusOut, { passive: true });
    window.addEventListener("keyboard-visibility-change", onImeChange, {
        passive: true,
    });

    return () => {
        clearRetries();
        document.removeEventListener("focusin", onFocusIn);
        document.removeEventListener("focusout", onFocusOut);
        window.removeEventListener("keyboard-visibility-change", onImeChange);
    };
}
