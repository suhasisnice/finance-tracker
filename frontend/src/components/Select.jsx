import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

/**
 * Custom dark select — dropdown rendered in a portal with position:fixed
 * so it is never clipped by overflow:hidden parents and scrolling doesn't
 * displace it.
 */
export default function Select({ value, onChange, options = [], id, placeholder, minWidth }) {
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({ top: 0, left: 0, width: 0 });
  const triggerRef      = useRef(null);

  const selected = options.find((o) => o.value === value);

  // Measure trigger and store viewport-relative coords
  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const r       = triggerRef.current.getBoundingClientRect();
    const listH   = Math.min(options.length * 41 + 8, 280);
    const below   = window.innerHeight - r.bottom;
    const openUp  = below < listH && r.top > listH;

    setPos({
      top:   openUp ? r.top - listH - 6 : r.bottom + 6,
      left:  r.left,
      width: r.width,
    });
  }, [options.length]);

  function toggle() {
    if (!open) calcPos();
    setOpen((o) => !o);
  }

  useEffect(() => {
    if (!open) return;
    function close(e) {
      if (triggerRef.current && triggerRef.current.contains(e.target)) return;
      setOpen(false);
    }
    // Reposition on scroll so the list tracks the trigger
    function reposition() { calcPos(); }

    document.addEventListener("mousedown", close);
    document.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", close);
    };
  }, [open, calcPos]);

  function pick(val) {
    onChange(val);
    setOpen(false);
  }

  const dropdown = open
    ? createPortal(
        <ul
          className="cselect-list"
          role="listbox"
          style={{
            position: "fixed",
            top:      pos.top,
            left:     pos.left,
            width:    minWidth ? Math.max(pos.width, minWidth) : pos.width,
            zIndex:   9999,
          }}
        >
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={`cselect-option ${o.value === value ? "selected" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); pick(o.value); }}
            >
              {o.label}
            </li>
          ))}
        </ul>,
        document.body
      )
    : null;

  return (
    <div className="cselect" id={id}>
      <button
        ref={triggerRef}
        type="button"
        className={`cselect-trigger ${open ? "open" : ""}`}
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="cselect-value">
          {selected
            ? selected.label
            : <span className="cselect-placeholder">{placeholder}</span>}
        </span>
        <svg className="cselect-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {dropdown}
    </div>
  );
}
