export function useIpc() {
  if (typeof window === 'undefined' || !window.notchPrompter) {
    return null;
  }
  return window.notchPrompter;
}
