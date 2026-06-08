let peekCloseTimer: ReturnType<typeof setTimeout> | undefined;

export function clearSidebarPeekTimer() {
  if (peekCloseTimer) {
    clearTimeout(peekCloseTimer);
    peekCloseTimer = undefined;
  }
}

export function scheduleSidebarPeekClose(onClose: () => void, duration: number) {
  clearSidebarPeekTimer();
  peekCloseTimer = setTimeout(() => {
    onClose();
    peekCloseTimer = undefined;
  }, duration);
}
