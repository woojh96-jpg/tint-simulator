import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { DriveInput } from "../lib/driving-config";

type DirectionButtonProps = {
  direction: keyof DriveInput;
  label: string;
  arrow: string;
  enabled: boolean;
  onDirectionChange: (direction: keyof DriveInput, pressed: boolean) => void;
};

function DirectionButton({ direction, label, arrow, enabled, onDirectionChange }: DirectionButtonProps) {
  const pointers = useRef(new Set<number>());
  const keyboardHeld = useRef(false);
  const [pressed, setPressed] = useState(false);

  function publish() {
    const active = pointers.current.size > 0 || keyboardHeld.current;
    onDirectionChange(direction, active);
    setPressed(active);
  }

  function pointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!enabled || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.add(event.pointerId);
    publish();
  }

  function pointerRelease(event: PointerEvent<HTMLButtonElement>) {
    if (!pointers.current.delete(event.pointerId)) return;
    publish();
  }

  function keyboardChange(event: KeyboardEvent<HTMLButtonElement>, held: boolean) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (!enabled || keyboardHeld.current === held) return;
    keyboardHeld.current = held;
    publish();
  }

  return (
    <button type="button" className="drive-direction" aria-label={label} aria-pressed={enabled && pressed} disabled={!enabled} onPointerDown={pointerDown} onPointerUp={pointerRelease} onPointerCancel={pointerRelease} onLostPointerCapture={pointerRelease} onContextMenu={(event) => event.preventDefault()} onKeyDown={(event) => keyboardChange(event, true)} onKeyUp={(event) => keyboardChange(event, false)} onBlur={() => { if (keyboardHeld.current) { keyboardHeld.current = false; publish(); } }}><span aria-hidden="true">{arrow}</span><small>{label}</small></button>
  );
}

export default function DriveControls({ enabled, onDirectionChange }: Pick<DirectionButtonProps, "enabled" | "onDirectionChange">) {
  return (
    <div className="drive-touch-controls" role="group" aria-label="터치 운전 조작: 길게 누르세요">
      <div className="drive-touch-cluster"><DirectionButton direction="left" label="좌회전" arrow="←" enabled={enabled} onDirectionChange={onDirectionChange} /><DirectionButton direction="right" label="우회전" arrow="→" enabled={enabled} onDirectionChange={onDirectionChange} /></div>
      <div className="drive-touch-cluster"><DirectionButton direction="reverse" label="후진" arrow="↓" enabled={enabled} onDirectionChange={onDirectionChange} /><DirectionButton direction="forward" label="전진" arrow="↑" enabled={enabled} onDirectionChange={onDirectionChange} /></div>
    </div>
  );
}
