import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Countdown timer for "resend code" UX. Starts at `initial` seconds,
 * ticks down to 0, then `canResend` becomes true.
 */
export function useResendCountdown(initial: number) {
  const [secondsLeft, setSecondsLeft] = useState(initial);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback((seconds = initial) => {
    clear();
    setSecondsLeft(seconds);
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clear();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initial, clear]);

  useEffect(() => () => clear(), [clear]);

  const canResend = secondsLeft === 0;

  return { secondsLeft, start, canResend };
}
