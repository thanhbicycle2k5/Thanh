export const calculatePomodoroRemainingSeconds = (durationMs: number, elapsedMs: number): number => {
  return Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000));
};
