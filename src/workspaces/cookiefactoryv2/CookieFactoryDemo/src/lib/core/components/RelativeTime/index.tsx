import { useEffect, useState } from 'react';
import { getRelativeTimeString, type RelativeTimeOptions } from '../../utils/time';

type Options = RelativeTimeOptions & { updateInterval?: number };

const DEFAULT_OPTIONS: Options = {
  updateInterval: 0
};

export function RelativeTime({ timestamp, options = {} }: { timestamp: number; options?: Options }) {
  const { updateInterval, ...opts } = { ...DEFAULT_OPTIONS, ...options };
  const [, setTick] = useState(true);

  useEffect(() => {
    let intervalId: NodeJS.Timer;

    if (updateInterval && updateInterval > 0) {
      intervalId = setInterval(() => setTick((state) => !state), updateInterval);
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [updateInterval]);

  return <>{getRelativeTimeString(timestamp, opts)}</>;
}
