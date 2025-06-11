import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { scaleLinear, scalePoint } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { Group } from '@visx/group';
import { AxisLeft, AxisBottom } from '@visx/axis';
import { curveCatmullRom } from '@visx/curve';
import { localPoint } from '@visx/event';
import { useSpringValue, animated, useSpring } from '@react-spring/web';
import { svgPathProperties } from 'svg-path-properties';

const graphData = [
  { time: '0 seconds', usage: 10 },
  { time: '2 seconds', usage: 15 },
  { time: '4 seconds', usage: 18 },
  { time: '6 seconds', usage: 20 },
  { time: '8 seconds', usage: 25 },
  { time: '10 seconds', usage: 22 },
  { time: '12 seconds', usage: 20 },
  { time: '14 seconds', usage: 24 },
  { time: '16 seconds', usage: 28 },
  { time: '18 seconds', usage: 30 },
  { time: '20 seconds', usage: 34 },
  { time: '22 seconds', usage: 32 },
  { time: '24 seconds', usage: 35 },
  { time: '26 seconds', usage: 40 },
  { time: '28 seconds', usage: 45 },
  { time: '30 seconds', usage: 42 },
  { time: '32 seconds', usage: 50 },
  { time: '34 seconds', usage: 55 },
  { time: '36 seconds', usage: 58 },
  { time: '38 seconds', usage: 50 },
  { time: '40 seconds', usage: 43 },
  { time: '42 seconds', usage: 43 },
  { time: '44 seconds', usage: 25 },
  { time: '46 seconds', usage: 27 },
  { time: '48 seconds', usage: 30 },
  { time: '50 seconds', usage: 22 },
  { time: '52 seconds', usage: 28 },
  { time: '54 seconds', usage: 34 },
  { time: '56 seconds', usage: 38 },
  { time: '58 seconds', usage: 32 },
  { time: '60 seconds', usage: 42 }
];

const width = 800;
const height = 320;
const margin = { top: 12, right: 12, bottom: 36, left: 48 };

const GlowLine = () => {
  const [hoverX, setHoverX] = useState<number>(0);
  const [clampedIndex, setClampedIndex] = useState<number>(0);
  const [glowPoints, setGlowPoints] = useState<{ x: number, y: number }[]>([]);
  const pathRef = useRef<SVGPathElement>(null);
  const [dotPosition, setDotPosition] = useState<{ x: number, y: number, angle?: number } | null>(null);

  const xScale = useMemo(() =>
    scalePoint({
      domain: graphData.map(d => d.time),
      range: [margin.left, width - margin.right],
    }), []);

  const yScale = useMemo(() =>
    scaleLinear({
      domain: [0, 100],
      range: [height - margin.bottom, margin.top],
    }), []);

  const handleMouseMove = useCallback((event: React.MouseEvent<SVGRectElement>) => {
    const { x } = localPoint(event) || { x: 0 };
    setHoverX(x);
  }, []);

  useEffect(() => {
    const distances = graphData.map(d => Math.abs((xScale(d.time) ?? 0) - hoverX));
    const nearest = distances.indexOf(Math.min(...distances));
    setClampedIndex(nearest);
  }, [hoverX]);

  const clampedPoint = graphData[clampedIndex];
  const clampedX = xScale(clampedPoint.time) ?? 0;
  const clampedY = yScale(clampedPoint.usage);

  const [IsHovering, setIsHovering] = useState(false);


  const springX = useSpringValue(clampedX);
  const springY = useSpringValue(clampedY);
  const springGlowX = useSpringValue(clampedX, {
    config: { tension: 60, friction: 50 }
  });

  const rotationSpring = useSpringValue(0);
  const angleSpring = useSpringValue(0);

  const opacitySpring = useSpringValue(0);

  const flareAnim = useSpring({
    from: { opacity: 0.4 },
    to: async (next) => {
      while (true) {
        await next({ opacity: 1 });
        await next({ opacity: 0.4 });
      }
    },
    config: { duration: 1000 },
  });

  useEffect(() => {
    springX.start(clampedX);
    springY.start(clampedY);
    springGlowX.start(clampedX);
  }, [clampedX, clampedY]);

  useEffect(() => {
    if (dotPosition?.angle != null) {
      angleSpring.start(dotPosition.angle);
    }
  }, [dotPosition?.angle]);

  useEffect(() => {
    opacitySpring.start(IsHovering ? 1 : 0);
  }, [IsHovering]);

  useEffect(() => {
    let frameId: number;

    const updateGlow = () => {
      if (!pathRef.current) return;
      const path = pathRef.current;
      const properties = new svgPathProperties(path.getAttribute('d') || '');
      const totalLength = properties.getTotalLength();

      const targetX = springX.get();
      let low = 0;
      let high = totalLength;
      let centerLength = 0;

      for (let i = 0; i < 20; i++) {
        const mid = (low + high) / 2;
        const pt = path.getPointAtLength(mid);
        if (pt.x < targetX) {
          low = mid;
        } else {
          high = mid;
        }
        centerLength = mid;
      }

      const glowStart = 0;
      const glowEnd = Math.min(totalLength, centerLength);

      const newPoints: { x: number; y: number }[] = [];
      for (let i = glowStart; i <= glowEnd; i += 2) {
        const pt = properties.getPointAtLength(i);
        newPoints.push({ x: pt.x, y: pt.y });
      }

      setGlowPoints(newPoints);

      const spin = (glowEnd / totalLength) * 720;
      rotationSpring.start(spin);

      if (newPoints.length > 1) {
        const last = newPoints[newPoints.length - 1];
        const prev = newPoints[newPoints.length - 2];
        const angle = Math.atan2(last.y - prev.y, last.x - prev.x) * (180 / Math.PI);
        setDotPosition({ x: last.x, y: last.y, angle });
      }

      frameId = requestAnimationFrame(updateGlow);
    };

    updateGlow();
    return () => cancelAnimationFrame(frameId);
  }, [springX]);

  return (
    <svg
      width={width}
      height={height}
      className="bg-[#101018] rounded-xl"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <pattern id="pattern" patternUnits="userSpaceOnUse" width="12" height="12">
          <path d="M 0,12 L 12,0" stroke="#1B1B23" strokeWidth="0.5" />
        </pattern>
        <linearGradient id="area-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#3F1AF7" stopOpacity="0.4" />
          <stop offset="20%" stopColor="#3F1AF7" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3F1AF7" stopOpacity="0" />
        </linearGradient>
      </defs>

      <Group top={0} left={0}>
        <rect
          x={margin.left}
          y={margin.top}
          width={width - margin.left - margin.right}
          height={height - margin.top - margin.bottom}
          fill="url(#pattern)"
        />

        {glowPoints.length > 1 && (
          <animated.path
            d={glowPoints.reduce(
              (acc, p, i) => acc + `${i === 0 ? 'M' : 'L'}${p.x},${p.y} `,
              ''
            ) +
              `L ${glowPoints[glowPoints.length - 1].x},${yScale(0)} ` +
              `L ${glowPoints[0].x},${yScale(0)} Z`}
            fill="url(#area-gradient)"
            opacity={0.8}
          />
        )}

        <LinePath
          innerRef={pathRef}
          curve={curveCatmullRom.alpha(0.3)}
          data={graphData}
          x={d => xScale(d.time) ?? 0}
          y={d => yScale(d.usage)}
          stroke="#3A3A44"
          strokeWidth={2}
          fill="none"
        />

        {glowPoints.length > 1 && (
          <path
            d={glowPoints.reduce(
              (acc, p, i) => acc + `${i === 0 ? 'M' : 'L'}${p.x},${p.y} `,
              ''
            )}
            stroke="#D0D4FF"
            strokeWidth={2}
            fill="none"
            style={{
              filter: `
                drop-shadow(0 0 42px rgba(88, 47, 255, 0.2))
                drop-shadow(0 0 20px rgba(88, 47, 255, 0.4))
                drop-shadow(0 0 12px rgba(88, 47, 255, 0.6))
                drop-shadow(0 0 8px rgba(88, 47, 255, 1))`
            }}
          />
        )}

        <AxisLeft
          scale={yScale}
          top={0}
          left={xScale('0 seconds') ?? margin.left}
          tickValues={[20, 40, 60, 80, 100]}
          tickFormat={d => `${d}%`}
          tickLength={0}
          stroke="#1B1B23"
          strokeWidth={2}
          tickLabelProps={() => ({
            fill: '#3A3A44',
            fontSize: 14,
            fontWeight: 500,
            textAnchor: 'end',
            dy: '0.6em',
            dx: '-1em'
          })}
        />

        <AxisBottom
          top={yScale(0)}
          left={0}
          scale={xScale}
          tickValues={['10 seconds', '20 seconds', '30 seconds', '40 seconds', '50 seconds', '60 seconds']}
          tickLength={0}
          stroke="#1B1B23"
          strokeWidth={2}
          tickLabelProps={() => ({
            fill: '#3A3A44',
            fontSize: 14,
            fontWeight: 500,
            textAnchor: 'end',
            dy: '1em'
          })}
        />

        {dotPosition && (
          <animated.g style={flareAnim}>
            <animated.image
              href="/blob.png"
              x={dotPosition?.x - 100}
              y={dotPosition?.y - 100}
              width={200}
              height={200}
              style={{
                transform: rotationSpring.to(r => `rotate(${r}deg)`),
                transformOrigin: `${dotPosition?.x}px ${dotPosition?.y}px`,
                opacity: opacitySpring,
                filter: `drop-shadow(0 0 24px rgba(88, 47, 255,1))`
              }}
            />
          </animated.g>
        )}

        <rect
          width={width}
          height={height}
          fill="transparent"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        />
      </Group>
    </svg>
  );
};

export default GlowLine;