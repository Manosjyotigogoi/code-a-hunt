/**
 * useSession — tracks user activity and sends heartbeats to the backend.
 *
 * Heartbeat sent every 60s.
 * A "break" is detected when the page becomes hidden for >5 minutes.
 * Focus level = active time / total online time × 10.
 */
import { useEffect, useRef } from 'react';
import api from '../utils/api';

const HEARTBEAT_MS = 60_000;       // 60 seconds
const BREAK_THRESHOLD_MS = 5 * 60_000; // 5 min hidden = break

export function useSession() {
  const hiddenAt = useRef(null);
  const activeRef = useRef(true);

  useEffect(() => {
    let interval = null;

    const sendHeartbeat = (isBreak = false) => {
      api.post('/session/heartbeat', {
        activeSeconds: activeRef.current ? 60 : 0,
        isBreak,
      }).catch(() => {}); // silently ignore network errors
    };

    // Visibility change — detect breaks
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        activeRef.current = false;
      } else {
        const hiddenMs = hiddenAt.current ? Date.now() - hiddenAt.current : 0;
        const isBreak = hiddenMs >= BREAK_THRESHOLD_MS;
        hiddenAt.current = null;
        activeRef.current = true;
        if (isBreak) sendHeartbeat(true);
      }
    };

    // Mouse/key activity resets active flag
    const onActivity = () => { activeRef.current = true; };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('mousemove', onActivity);
    document.addEventListener('keydown', onActivity);

    // First heartbeat after 60s
    interval = setInterval(() => {
      sendHeartbeat(false);
      // Reset active flag each tick (requires activity to stay active)
      activeRef.current = false;
    }, HEARTBEAT_MS);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('mousemove', onActivity);
      document.removeEventListener('keydown', onActivity);
    };
  }, []);
}
