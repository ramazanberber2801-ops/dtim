import { useEffect, useRef } from 'react';
import { Lock } from 'lucide-react';

interface SecretTapDetectorProps {
  onTrigger: () => void;
  tapCount?: number;
  resetDelay?: number;
}

/**
 * Invisible secret tap detector.
 * Requires exactly N rapid taps within resetDelay to trigger.
 */
export function SecretTapDetector({
  onTrigger,
  tapCount = 5,
  resetDelay = 1500,
}: SecretTapDetectorProps) {
  const countRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleTap = () => {
    countRef.current += 1;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      countRef.current = 0;
    }, resetDelay);

    if (countRef.current >= tapCount) {
      countRef.current = 0;
      if (timerRef.current) clearTimeout(timerRef.current);
      onTrigger();
    }
  };

  return (
    <button
      onClick={handleTap}
      aria-label="secret"
      className="flex items-center justify-center w-6 h-6 opacity-30 hover:opacity-60 transition-opacity"
      style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
    >
      <Lock size={12} className="text-[#2D2A26]/40" strokeWidth={1.5} />
    </button>
  );
}
