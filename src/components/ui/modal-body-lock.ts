const BODY_LOCK_CLASS = "modal-open";

let lockCount = 0;
let prevOverflow = "";
let prevPaddingRight = "";

/** Ref-counted body scroll lock — safe when multiple modals stack. */
export function acquireModalBodyLock() {
  if (typeof document === "undefined") return;
  if (lockCount === 0) {
    prevOverflow = document.body.style.overflow;
    prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.classList.add(BODY_LOCK_CLASS);
  }
  lockCount += 1;
}

export function releaseModalBodyLock() {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = prevOverflow;
    document.body.style.paddingRight = prevPaddingRight;
    document.body.classList.remove(BODY_LOCK_CLASS);
  }
}
