
import { useFocusEffect } from 'expo-router';
import { Accelerometer } from 'expo-sensors';
import { useCallback, useEffect, useRef } from 'react';

export function useShake(onShake: () => void, threshold = 1.8) {
  const lastShake = useRef(0);
  const callback = useRef(onShake);

  useEffect(() => {
    callback.current = onShake;
  }, [onShake]);

  useFocusEffect(
    useCallback(() => {
      Accelerometer.setUpdateInterval(200);

      const subscription = Accelerometer.addListener(({ x, y, z }) => {
        const g = Math.hypot(x, y, z);
        const now = Date.now();

        if (g > threshold && now - lastShake.current > 1500) {
          lastShake.current = now;
          callback.current();
        }
      });

      return () => subscription.remove();
    }, [threshold])
  );
}
