import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ParticleConfig {
  id: number;
  size: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  duration: number;
  colorType: 'primary' | 'glow' | 'accent' | 'mint';
  opacityRange: [number, number];
  scaleRange: [number, number];
}

const PARTICLES: ParticleConfig[] = [
  // Ambient large glowing orbs
  {
    id: 1,
    size: 190,
    startX: -40,
    startY: 60,
    deltaX: 45,
    deltaY: 35,
    duration: 5200,
    colorType: 'glow',
    opacityRange: [0.25, 0.45],
    scaleRange: [0.95, 1.15],
  },
  {
    id: 2,
    size: 220,
    startX: SCREEN_WIDTH - 120,
    startY: 180,
    deltaX: -50,
    deltaY: 40,
    duration: 6400,
    colorType: 'primary',
    opacityRange: [0.18, 0.35],
    scaleRange: [0.9, 1.1],
  },
  {
    id: 3,
    size: 160,
    startX: SCREEN_WIDTH * 0.25,
    startY: SCREEN_HEIGHT * 0.65,
    deltaX: -30,
    deltaY: -40,
    duration: 5800,
    colorType: 'accent',
    opacityRange: [0.2, 0.4],
    scaleRange: [0.95, 1.12],
  },
  // Medium floating bubbles
  {
    id: 4,
    size: 54,
    startX: 40,
    startY: SCREEN_HEIGHT * 0.35,
    deltaX: 30,
    deltaY: -35,
    duration: 4100,
    colorType: 'mint',
    opacityRange: [0.35, 0.7],
    scaleRange: [0.85, 1.2],
  },
  {
    id: 5,
    size: 46,
    startX: SCREEN_WIDTH - 70,
    startY: SCREEN_HEIGHT * 0.45,
    deltaX: -35,
    deltaY: -45,
    duration: 4700,
    colorType: 'primary',
    opacityRange: [0.3, 0.65],
    scaleRange: [0.9, 1.15],
  },
  {
    id: 6,
    size: 38,
    startX: SCREEN_WIDTH * 0.75,
    startY: 90,
    deltaX: -25,
    deltaY: 30,
    duration: 3800,
    colorType: 'mint',
    opacityRange: [0.4, 0.75],
    scaleRange: [0.8, 1.25],
  },
  {
    id: 7,
    size: 42,
    startX: 30,
    startY: SCREEN_HEIGHT * 0.75,
    deltaX: 40,
    deltaY: -30,
    duration: 4400,
    colorType: 'glow',
    opacityRange: [0.35, 0.65],
    scaleRange: [0.9, 1.18],
  },
  // Small buoyant twinkling circular particles
  {
    id: 8,
    size: 14,
    startX: SCREEN_WIDTH * 0.15,
    startY: 190,
    deltaX: 20,
    deltaY: -25,
    duration: 2900,
    colorType: 'mint',
    opacityRange: [0.4, 0.9],
    scaleRange: [0.7, 1.3],
  },
  {
    id: 9,
    size: 18,
    startX: SCREEN_WIDTH * 0.85,
    startY: SCREEN_HEIGHT * 0.32,
    deltaX: -20,
    deltaY: -35,
    duration: 3300,
    colorType: 'accent',
    opacityRange: [0.45, 0.95],
    scaleRange: [0.8, 1.25],
  },
  {
    id: 10,
    size: 12,
    startX: SCREEN_WIDTH * 0.45,
    startY: 120,
    deltaX: -15,
    deltaY: 20,
    duration: 2600,
    colorType: 'primary',
    opacityRange: [0.5, 1],
    scaleRange: [0.6, 1.4],
  },
  {
    id: 11,
    size: 16,
    startX: SCREEN_WIDTH * 0.65,
    startY: SCREEN_HEIGHT * 0.78,
    deltaX: 25,
    deltaY: -30,
    duration: 3500,
    colorType: 'mint',
    opacityRange: [0.4, 0.85],
    scaleRange: [0.75, 1.3],
  },
  {
    id: 12,
    size: 10,
    startX: SCREEN_WIDTH * 0.28,
    startY: SCREEN_HEIGHT * 0.48,
    deltaX: 18,
    deltaY: -20,
    duration: 3100,
    colorType: 'glow',
    opacityRange: [0.5, 0.95],
    scaleRange: [0.7, 1.35],
  },
];

const AnimatedCircle: React.FC<{
  config: ParticleConfig;
  colors: { primary: string; glow: string; text: string };
}> = ({ config, colors }) => {
  const transX = useSharedValue(0);
  const transY = useSharedValue(0);
  const opacity = useSharedValue(config.opacityRange[0]);
  const scale = useSharedValue(config.scaleRange[0]);

  useEffect(() => {
    transX.value = withRepeat(
      withSequence(
        withTiming(config.deltaX, {
          duration: config.duration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: config.duration,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );

    transY.value = withRepeat(
      withSequence(
        withTiming(config.deltaY, {
          duration: config.duration * 1.15,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: config.duration * 1.15,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(config.opacityRange[1], {
          duration: config.duration * 0.85,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(config.opacityRange[0], {
          duration: config.duration * 0.85,
          easing: Easing.inOut(Easing.quad),
        })
      ),
      -1,
      true
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(config.scaleRange[1], {
          duration: config.duration * 0.95,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(config.scaleRange[0], {
          duration: config.duration * 0.95,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: transX.value },
      { translateY: transY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const getBackgroundColor = () => {
    switch (config.colorType) {
      case 'primary':
        return colors.primary;
      case 'glow':
        return colors.glow;
      case 'accent':
        return '#0D9488'; // Deep Teal
      case 'mint':
        return '#2DD4BF'; // Bright Mint
      default:
        return colors.primary;
    }
  };

  const isOrb = config.size > 100;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: config.startX,
          top: config.startY,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: getBackgroundColor(),
          shadowColor: '#14B8A6',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: isOrb ? 0.3 : 0.6,
          shadowRadius: isOrb ? 24 : 10,
          elevation: isOrb ? 0 : 4,
          borderWidth: isOrb ? 0 : 1,
          borderColor: 'rgba(255, 255, 255, 0.25)',
        },
        animatedStyle,
      ]}
    />
  );
};

export const ParticleBackground: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PARTICLES.map((particle) => (
        <AnimatedCircle key={particle.id} config={particle} colors={colors} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
  },
});
