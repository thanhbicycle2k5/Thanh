export const calculatePomodoroRemainingSeconds = (durationMs: number, elapsedMs: number): number => {
  return Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000));
};

export const shouldStartPomodoroMusic = ({
  pomodoroRunning,
  pomodoroSoundEnabled,
  isMusicPlaying,
  targetTrackId,
  lastStartedTrackId,
}: {
  pomodoroRunning: boolean;
  pomodoroSoundEnabled: boolean;
  isMusicPlaying: boolean;
  targetTrackId: string | null | undefined;
  lastStartedTrackId: string | null | undefined;
}): boolean => {
  if (!pomodoroRunning || !pomodoroSoundEnabled || isMusicPlaying) return false;
  if (!targetTrackId) return false;

  return lastStartedTrackId !== targetTrackId;
};
