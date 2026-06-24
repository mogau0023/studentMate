import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Stop } from 'react-native-svg';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface LogoLoaderProps {
  size?: number;
}

function usePulse(delay: number, duration = 1800) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, {
          toValue: 1,
          duration: duration * 0.5,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: duration * 0.5,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
}

function useBounce(delay: number) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: -4, duration: 280, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0,  duration: 280, useNativeDriver: true }),
        Animated.delay(840),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
}

export default function LogoLoader({ size = 220 }: LogoLoaderProps) {
  const scale = size / 220;

  // Stem opacity pulses — staggered
  const s0 = usePulse(0);
  const s1 = usePulse(150);
  const s2 = usePulse(300);
  const s3 = usePulse(450);
  const s4 = usePulse(100);
  const s5 = usePulse(250);
  const s6 = usePulse(400);
  const s7 = usePulse(550);

  // Peripheral stem pulses
  const p0 = usePulse(50);
  const p1 = usePulse(200);
  const p2 = usePulse(350);
  const p3 = usePulse(500);
  const p4 = usePulse(650);
  const p5 = usePulse(750);
  const p6 = usePulse(850);
  const p7 = usePulse(700);
  const p8 = usePulse(600);

  // Node pulses
  const n0 = usePulse(50,  1600);
  const n1 = usePulse(200, 1600);
  const n2 = usePulse(350, 1600);
  const n3 = usePulse(500, 1600);
  const n4 = usePulse(650, 1600);
  const n5 = usePulse(550, 1600);
  const n6 = usePulse(900, 1600);
  const n7 = usePulse(750, 1600);
  const n8 = usePulse(750, 1600);
  const n9 = usePulse(600, 1600);
  const n10 = usePulse(400, 1600);
  const n11 = usePulse(250, 1600);
  const n12 = usePulse(200, 1600);
  const n13 = usePulse(350, 1600);
  const n14 = usePulse(550, 1600);
  const n15 = usePulse(700, 1600);

  // Dot bounces
  const d0 = useBounce(0);
  const d1 = useBounce(180);
  const d2 = useBounce(360);

  // SVG coordinate system: viewBox 0 0 220 220
  // Grid: 4 cols × 4 rows, origin (40,40), step 40
  // Cols: 40, 80, 120, 160   Rows: 40, 80, 120, 160

  const strokeW = 3.5;
  const nodeR   = 7;
  const coreR   = 3;

  const stemProps = (opacity: Animated.Value, color: string, x1: number, y1: number, x2: number, y2: number) => ({
    x1: String(x1), y1: String(y1), x2: String(x2), y2: String(y2),
    stroke: color,
    strokeWidth: strokeW,
    strokeLinecap: 'round' as const,
    opacity,
  });

  const nodeProps = (opacity: Animated.Value, color: string, cx: number, cy: number, r: number, filled: boolean) => ({
    cx: String(cx), cy: String(cy), r: String(r),
    stroke: filled ? 'none' : color,
    fill: filled ? color : 'none',
    strokeWidth: strokeW,
    opacity,
  });

  return (
    <View style={[styles.container, { width: size, height: size + 30 }]}>
      <Svg width={size} height={size} viewBox="0 0 220 220">
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%"   stopColor="#E5621F" />
            <Stop offset="40%"  stopColor="#4A7DC4" />
            <Stop offset="100%" stopColor="#2B3590" />
          </LinearGradient>
        </Defs>

        {/* ── Horizontal grid lines ── */}
        <AnimatedLine {...stemProps(s0, '#4A7DC4', 40, 40,  160, 40)} />
        <AnimatedLine {...stemProps(s1, '#3C6DB8', 40, 80,  160, 80)} />
        <AnimatedLine {...stemProps(s2, '#2E5FAC', 40, 120, 160, 120)} />
        <AnimatedLine {...stemProps(s3, '#2B3590', 40, 160, 160, 160)} />

        {/* ── Vertical grid lines ── */}
        <AnimatedLine {...stemProps(s4, '#C85A20', 40,  40, 40,  160)} />
        <AnimatedLine {...stemProps(s5, '#4A7DC4', 80,  40, 80,  160)} />
        <AnimatedLine {...stemProps(s6, '#3A60A8', 120, 40, 120, 160)} />
        <AnimatedLine {...stemProps(s7, '#2B3590', 160, 40, 160, 160)} />

        {/* ── Top peripheral stems ── */}
        <AnimatedLine {...stemProps(p0, '#4A7DC4', 80,  40, 80,  10)} />
        <AnimatedLine {...stemProps(p1, '#3A60A8', 120, 40, 120, 15)} />
        <AnimatedLine {...stemProps(p2, '#2B3590', 160, 40, 160, 10)} />
        <AnimatedLine {...stemProps(p3, '#2B3590', 160, 40, 195, 40)} />
        <AnimatedLine {...stemProps(p4, '#2B3590', 195, 40, 195, 12)} />

        {/* ── Bottom peripheral stems ── */}
        <AnimatedLine {...stemProps(p5, '#2B3590', 40,  160, 40,  195)} />
        <AnimatedLine {...stemProps(p6, '#2B3590', 80,  160, 80,  205)} />
        <AnimatedLine {...stemProps(p7, '#2B3590', 120, 160, 120, 195)} />
        <AnimatedLine {...stemProps(p8, '#2B3590', 160, 160, 160, 200)} />

        {/* ── Left peripheral stems ── */}
        <AnimatedLine {...stemProps(p0, '#C85A20', 40,  40, 10,  40)} />
        <AnimatedLine {...stemProps(p1, '#B04C1A', 40,  80, 8,   80)} />
        <AnimatedLine {...stemProps(p2, '#8C3B14', 40, 120, 10, 120)} />

        {/* ── Right peripheral stems ── */}
        <AnimatedLine {...stemProps(p3, '#2B3590', 160,  80, 198,  80)} />
        <AnimatedLine {...stemProps(p4, '#2B3590', 160, 120, 198, 120)} />
        <AnimatedLine {...stemProps(p5, '#2B3590', 160, 160, 198, 160)} />

        {/* ── Terminal nodes — top ── */}
        <AnimatedCircle {...nodeProps(n0, '#4A7DC4', 80,  4,  nodeR, false)} />
        <AnimatedCircle {...nodeProps(n0, '#4A7DC4', 80,  4,  coreR, true)} />
        <AnimatedCircle {...nodeProps(n1, '#3A60A8', 120, 8,  nodeR, false)} />
        <AnimatedCircle {...nodeProps(n1, '#3A60A8', 120, 8,  coreR, true)} />
        <AnimatedCircle {...nodeProps(n2, '#2B3590', 160, 4,  nodeR, false)} />
        <AnimatedCircle {...nodeProps(n2, '#2B3590', 160, 4,  coreR, true)} />
        <AnimatedCircle {...nodeProps(n3, '#2B3590', 195, 5,  nodeR, false)} />
        <AnimatedCircle {...nodeProps(n3, '#2B3590', 195, 5,  coreR, true)} />

        {/* ── Terminal nodes — left ── */}
        <AnimatedCircle {...nodeProps(n4,  '#C85A20', 3,   40,  nodeR, false)} />
        <AnimatedCircle {...nodeProps(n4,  '#C85A20', 3,   40,  coreR, true)} />
        <AnimatedCircle {...nodeProps(n5,  '#B04C1A', 1,   80,  nodeR, false)} />
        <AnimatedCircle {...nodeProps(n5,  '#B04C1A', 1,   80,  coreR, true)} />
        <AnimatedCircle {...nodeProps(n6,  '#8C3B14', 3,  120,  nodeR, false)} />
        <AnimatedCircle {...nodeProps(n6,  '#8C3B14', 3,  120,  coreR, true)} />

        {/* ── Terminal nodes — right ── */}
        <AnimatedCircle {...nodeProps(n7,  '#2B3590', 205,  80,  nodeR, false)} />
        <AnimatedCircle {...nodeProps(n7,  '#2B3590', 205,  80,  coreR, true)} />
        <AnimatedCircle {...nodeProps(n8,  '#2B3590', 205, 120,  nodeR, false)} />
        <AnimatedCircle {...nodeProps(n8,  '#2B3590', 205, 120,  coreR, true)} />
        <AnimatedCircle {...nodeProps(n9,  '#2B3590', 205, 160,  nodeR, false)} />
        <AnimatedCircle {...nodeProps(n9,  '#2B3590', 205, 160,  coreR, true)} />

        {/* ── Terminal nodes — bottom ── */}
        <AnimatedCircle {...nodeProps(n10, '#2B3590', 40,  203, nodeR, false)} />
        <AnimatedCircle {...nodeProps(n10, '#2B3590', 40,  203, coreR, true)} />
        <AnimatedCircle {...nodeProps(n11, '#2B3590', 80,  213, nodeR, false)} />
        <AnimatedCircle {...nodeProps(n11, '#2B3590', 80,  213, coreR, true)} />
        <AnimatedCircle {...nodeProps(n12, '#2B3590', 120, 203, nodeR, false)} />
        <AnimatedCircle {...nodeProps(n12, '#2B3590', 120, 203, coreR, true)} />
        <AnimatedCircle {...nodeProps(n13, '#2B3590', 160, 208, nodeR, false)} />
        <AnimatedCircle {...nodeProps(n13, '#2B3590', 160, 208, coreR, true)} />
      </Svg>

      {/* ── Bouncing dots ── */}
      <View style={styles.dots}>
        <Animated.View style={[styles.dot, { backgroundColor: '#4A7DC4', transform: [{ translateY: d0 }] }]} />
        <Animated.View style={[styles.dot, { backgroundColor: '#3A60A8', transform: [{ translateY: d1 }] }]} />
        <Animated.View style={[styles.dot, { backgroundColor: '#2B3590', transform: [{ translateY: d2 }] }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
});