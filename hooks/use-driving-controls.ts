"use client";

import { useCallback, useEffect, useRef } from "react";
import type { DriveInput } from "@/lib/driving-config";

const DIRECTIONS: readonly (keyof DriveInput)[] = ["forward", "reverse", "left", "right"];
const KEY_DIRECTIONS: Record<string, keyof DriveInput> = {
  ArrowUp: "forward", KeyW: "forward", w: "forward",
  ArrowDown: "reverse", KeyS: "reverse", s: "reverse",
  ArrowLeft: "left", KeyA: "left", a: "left",
  ArrowRight: "right", KeyD: "right", d: "right",
};
const emptyInput = (): DriveInput => ({ forward: false, reverse: false, left: false, right: false });

function blocksDrivingInput(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  // Buttons and links keep their normal focus while the drive keys still work.
  // Editing controls retain their own arrow-key/text behavior, including an
  // editable ancestor and controls rendered inside an open modal.
  return (target instanceof HTMLElement && target.isContentEditable) || Boolean(target.closest(
    'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="radio"], [role="slider"], [role="spinbutton"], [role="combobox"], [role="textbox"], dialog[open], [role="dialog"]',
  ));
}

export function useDrivingControls(enabled: boolean) {
  const inputRef = useRef<DriveInput>(emptyInput());
  const heldKeys = useRef(new Map<string, keyof DriveInput>());
  const touchInput = useRef<DriveInput>(emptyInput());

  const syncInput = useCallback(() => {
    for (const direction of DIRECTIONS) inputRef.current[direction] = touchInput.current[direction];
    for (const direction of heldKeys.current.values()) inputRef.current[direction] = true;
  }, []);

  const clearInput = useCallback(() => {
    heldKeys.current.clear();
    for (const direction of DIRECTIONS) {
      touchInput.current[direction] = false;
      inputRef.current[direction] = false;
    }
  }, []);

  const setTouchDirection = useCallback((direction: keyof DriveInput, pressed: boolean) => {
    touchInput.current[direction] = enabled && pressed;
    syncInput();
  }, [enabled, syncInput]);

  useEffect(() => {
    if (!enabled) return;

    const keyDown = (event: KeyboardEvent) => {
      const direction = KEY_DIRECTIONS[event.code] ?? KEY_DIRECTIONS[event.key.toLowerCase()]
        ?? KEY_DIRECTIONS[event.key];
      if (!direction || event.altKey || event.ctrlKey || event.metaKey) return;
      if (blocksDrivingInput(event.target) || blocksDrivingInput(document.activeElement)
        || document.querySelector('dialog[open], [role="dialog"][aria-modal="true"]')) {
        clearInput();
        return;
      }
      event.preventDefault();
      heldKeys.current.set(event.code || event.key.toLowerCase(), direction);
      syncInput();
    };
    const keyUp = (event: KeyboardEvent) => {
      // Always release, even if focus moved into a control while a key was held.
      heldKeys.current.delete(event.code || event.key.toLowerCase());
      syncInput();
    };
    const focusIn = (event: FocusEvent) => {
      if (blocksDrivingInput(event.target)) clearInput();
    };
    const visibilityChanged = () => {
      if (document.hidden) clearInput();
    };

    // Capture runs before widgets/browser defaults; passive:false allows the
    // handled arrows to prevent scrolling without changing button focus.
    window.addEventListener("keydown", keyDown, { capture: true, passive: false });
    window.addEventListener("keyup", keyUp, true);
    window.addEventListener("blur", clearInput);
    document.addEventListener("focusin", focusIn, true);
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      window.removeEventListener("keydown", keyDown, true);
      window.removeEventListener("keyup", keyUp, true);
      window.removeEventListener("blur", clearInput);
      document.removeEventListener("focusin", focusIn, true);
      document.removeEventListener("visibilitychange", visibilityChanged);
      clearInput();
    };
  }, [enabled, clearInput, syncInput]);

  return { inputRef, setTouchDirection, clearInput };
}
