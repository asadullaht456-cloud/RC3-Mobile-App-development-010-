import React, { useEffect, useState } from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import { formatPKRAbs } from '../utils/currency';

interface CountUpTextProps {
  value: number;
  duration?: number;
  style?: StyleProp<TextStyle>;
}

export const CountUpText: React.FC<CountUpTextProps> = ({
  value,
  duration = 700,
  style,
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animFrame: number;

    const startVal = 0;
    const targetVal = value;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (targetVal - startVal) * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animFrame = requestAnimationFrame(step);
      } else {
        setDisplayValue(targetVal);
      }
    };

    animFrame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(animFrame);
  }, [value, duration]);

  return <Text style={style}>{formatPKRAbs(displayValue)}</Text>;
};

