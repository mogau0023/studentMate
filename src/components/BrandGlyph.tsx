import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

type Props = {
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundColor?: string;
};

export default function BrandGlyph({
  size = 24,
  primaryColor = '#1e3a8a',
  secondaryColor = '#6366f1',
  backgroundColor = 'transparent',
}: Props) {
  const s = size;
  const r = s / 2;
  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Circle cx={r} cy={r} r={r} fill={backgroundColor} />
      <Path
        d={`M ${s * 0.15} ${s * 0.35} C ${s * 0.35} ${s * 0.15}, ${s * 0.65} ${s * 0.15}, ${s * 0.85} ${s * 0.35}`}
        stroke={secondaryColor}
        strokeWidth={s * 0.08}
        fill="none"
        strokeLinecap="round"
      />
      <Path
        d={`M ${s * 0.15} ${s * 0.65} C ${s * 0.35} ${s * 0.85}, ${s * 0.65} ${s * 0.85}, ${s * 0.85} ${s * 0.65}`}
        stroke={secondaryColor}
        strokeWidth={s * 0.06}
        fill="none"
        strokeLinecap="round"
        opacity={0.7}
      />
      <Circle cx={s * 0.5} cy={s * 0.5} r={s * 0.12} fill={primaryColor} />
    </Svg>
  );
}
