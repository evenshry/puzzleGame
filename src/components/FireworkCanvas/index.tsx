import { memo, useEffect, useRef } from "react";
import { Firework, FireworkParticle, FireworkType } from "@/types";

const FIREWORK_COLORS = [
  "#E699A0",
  "#E6C6A0",
  "#E6E6A0",
  "#A0E6B0",
  "#A0C8E6",
  "#D0A0E6",
  "#E69AD0",
  "#B0E6A0",
  "#A0E6E6",
  "#E6D0A0",
  "#D0D0E6",
  "#E6B8C3",
  "#E6DFB3",
  "#C7E6C7",
  "#D8E0E6",
  "#E6E3B3",
];

const PARTICLE_COUNT = 180;
const TRAIL_LENGTH = 20;

function generateId(): string {
  return `${Date.now()}-${Math.random()}`;
}

function getRandomColor(): string {
  return FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)];
}

function isValidNumber(value: any): value is number {
  return typeof value === "number" && isFinite(value);
}

function createSparkParticle(x: number, y: number, angle: number, speed: number, color: string, type: FireworkType): FireworkParticle {
  const velocityMultiplier = type === "willow" ? 0.8 : type === "chrysanthemum" ? 1.5 : 1.2;
  const size = type === "chrysanthemum" ? Math.random() * 4 + 3.5 : Math.random() * 4 + 3;
  const decay = type === "willow" ? 0.01 : 0.015;
  const gravity = type === "willow" ? 0.12 : 0.08;

  return {
    id: generateId(),
    x,
    y,
    vx: Math.cos(angle) * speed * velocityMultiplier * 1.4,
    vy: Math.sin(angle) * speed * velocityMultiplier * 1.4,
    size,
    color,
    alpha: 1,
    decay,
    gravity,
    trail: [],
    type: "spark",
  };
}

function createFireworkBlast(x: number, y: number, type: FireworkType): FireworkParticle[] {
  const particles: FireworkParticle[] = [];
  const colors = [getRandomColor(), getRandomColor(), getRandomColor()];

  switch (type) {
    case "burst":
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = ((Math.PI * 2) / PARTICLE_COUNT) * i + Math.random() * 0.2;
        const speed = Math.random() * 6 + 4;
        const color = colors[i % colors.length];
        particles.push(createSparkParticle(x, y, angle, speed, color, type));
      }
      break;

    case "willow":
      for (let i = 0; i < PARTICLE_COUNT * 1.5; i++) {
        const angle = ((Math.PI * 2) / (PARTICLE_COUNT * 1.5)) * i;
        const speed = Math.random() * 3 + 2;
        const color = colors[i % 2];
        particles.push(createSparkParticle(x, y, angle, speed, color, type));
      }
      break;

    case "spiral":
      for (let i = 0; i < PARTICLE_COUNT * 2; i++) {
        const angle = ((Math.PI * 4) / (PARTICLE_COUNT * 2)) * i;
        const speed = Math.random() * 5 + 3;
        const color = colors[Math.floor(i / (PARTICLE_COUNT / 4)) % colors.length];
        particles.push(createSparkParticle(x, y, angle, speed, color, type));
      }
      break;

    case "double":
      for (let ring = 0; ring < 2; ring++) {
        const ringOffset = ring * 0.3;
        for (let i = 0; i < PARTICLE_COUNT / 2; i++) {
          const angle = ((Math.PI * 2) / (PARTICLE_COUNT / 2)) * i + ringOffset;
          const speed = Math.random() * 4 + 3 + ring * 2;
          const color = colors[ring];
          particles.push(createSparkParticle(x, y, angle, speed, color, type));
        }
      }
      break;

    case "chrysanthemum":
      for (let ring = 0; ring < 3; ring++) {
        const ringOffset = ring * 0.15;
        const count = PARTICLE_COUNT / 3;
        for (let i = 0; i < count; i++) {
          const angle = ((Math.PI * 2) / count) * i + ringOffset;
          const speed = Math.random() * 2 + 4 + ring * 2;
          const color = colors[ring % colors.length];
          particles.push(createSparkParticle(x, y, angle, speed, color, type));
        }
      }
      break;

    default:
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = ((Math.PI * 2) / PARTICLE_COUNT) * i;
        const speed = Math.random() * 5 + 3;
        const color = colors[0];
        particles.push(createSparkParticle(x, y, angle, speed, color, "burst"));
      }
  }

  return particles;
}

interface FireworkItem {
  id: string;
  x: number;
  y: number;
  targetY: number;
  vy: number;
  color: string;
  type: FireworkType;
  exploded: boolean;
  particles: FireworkParticle[];
  bornTime: number;
  // 保存烟花飞行时的轨迹
  flightTrail: Array<{ x: number; y: number }>;
}

interface FireworkCanvasProps {
  fireworks: Firework[];
  onRemoveFirework: (id: string) => void;
}

const FireworkCanvas = memo(function FireworkCanvas({ fireworks, onRemoveFirework }: FireworkCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const fireworksListRef = useRef<FireworkItem[]>([]);
  const frameCountRef = useRef(0);

  useEffect(() => {
    fireworks.forEach((firework) => {
      if (!isValidNumber(firework.x) || !isValidNumber(firework.y)) {
        return;
      }

      const exists = fireworksListRef.current.find((f) => f.id === firework.id);
      if (!exists) {
        fireworksListRef.current.push({
          id: firework.id,
          x: firework.x,
          y: firework.y,
          targetY: firework.targetY,
          vy: firework.vy,
          color: firework.color,
          type: firework.type,
          exploded: firework.exploded,
          particles: [],
          bornTime: Date.now(),
          flightTrail: [],
        });
      } else if (firework.exploded && !exists.exploded) {
        exists.exploded = true;
        exists.particles = createFireworkBlast(exists.x, exists.y, exists.type);
      }
    });
  }, [fireworks]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      frameCountRef.current++;

      // 每次完全清空画布，保持透明
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      fireworksListRef.current = fireworksListRef.current.filter((fw) => {
        if (!isValidNumber(fw.x) || !isValidNumber(fw.y)) {
          return false;
        }

        if (!fw.exploded) {
          // 保存飞行轨迹
          fw.flightTrail.unshift({ x: fw.x, y: fw.y });
          if (fw.flightTrail.length > 10) {
            fw.flightTrail.pop();
          }

          // 绘制飞行拖尾
          fw.flightTrail.forEach((pos, index) => {
            const trailAlpha = (1 - index / fw.flightTrail.length) * 0.8;
            const trailSize = 4 * (1 - (index / fw.flightTrail.length) * 0.5);

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, trailSize, 0, Math.PI * 2);
            const alphaHex = Math.floor(trailAlpha * 255)
              .toString(16)
              .padStart(2, "0");
            ctx.fillStyle = "#FFFFE0" + alphaHex;
            ctx.fill();
          });

          fw.y += fw.vy;

          // 绘制当前烟花
          ctx.beginPath();
          ctx.arc(fw.x, fw.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFE0";
          ctx.fill();

          if (isValidNumber(fw.x) && isValidNumber(fw.y)) {
            const gradient = ctx.createRadialGradient(fw.x, fw.y, 0, fw.x, fw.y, 10);
            gradient.addColorStop(0, "#FFFFE0");
            gradient.addColorStop(0.5, "#FFFFE0");
            gradient.addColorStop(1, "#FFFFFF");
            ctx.beginPath();
            ctx.arc(fw.x, fw.y, 10, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
          }

          if (fw.y <= fw.targetY) {
            fw.exploded = true;
            fw.particles = createFireworkBlast(fw.x, fw.y, fw.type);
          }

          return fw.y > 0 && fw.y < canvas.height;
        } else {
          fw.particles = fw.particles.filter((particle) => {
            particle.vy += particle.gravity;
            particle.x += particle.vx;
            particle.y += particle.vy;

            particle.trail.unshift({ x: particle.x, y: particle.y });
            if (particle.trail.length > TRAIL_LENGTH) {
              particle.trail.pop();
            }

            particle.alpha -= particle.decay;
            particle.vx *= 0.97;
            particle.vy *= 0.97;

            return particle.alpha > 0;
          });

          fw.particles.forEach((particle) => {
            particle.trail.forEach((pos, index) => {
              if (!isValidNumber(pos.x) || !isValidNumber(pos.y)) {
                return;
              }

              const trailAlpha = particle.alpha * (1 - index / TRAIL_LENGTH) * 0.4;
              const trailSize = particle.size * (1 - (index / TRAIL_LENGTH) * 0.5);

              ctx.beginPath();
              ctx.arc(pos.x, pos.y, trailSize, 0, Math.PI * 2);
              const alphaHex = Math.floor(trailAlpha * 255)
                .toString(16)
                .padStart(2, "0");
              ctx.fillStyle = particle.color + alphaHex;
              ctx.fill();
            });

            if (isValidNumber(particle.x) && isValidNumber(particle.y)) {
              ctx.beginPath();
              ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
              ctx.fillStyle = particle.color;
              ctx.globalAlpha = particle.alpha;
              ctx.fill();

              ctx.globalAlpha = 1;
            }
          });

          if (fw.particles.length === 0) {
            onRemoveFirework(fw.id);
            return false;
          }

          return true;
        }
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [onRemoveFirework]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10000,
      }}
    />
  );
});

export default FireworkCanvas;

export function launchFirework(
  setFireworks: React.Dispatch<React.SetStateAction<Firework[]>>,
  type: FireworkType = "burst",
  delay: number = 0,
): void {
  setTimeout(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (!isValidNumber(width) || !isValidNumber(height)) {
      return;
    }

    const minExplosionY = height * 0.15;
    const maxExplosionY = height * 0.45;
    const explosionY = minExplosionY + Math.random() * (maxExplosionY - minExplosionY);
    const speed = 10;

    const newFirework: Firework = {
      id: generateId(),
      x: width * 0.2 + Math.random() * width * 0.6,
      y: height - 100,
      targetY: explosionY,
      vy: -speed,
      color: getRandomColor(),
      explosionColors: [],
      type,
      exploded: false,
      particles: [],
      delay,
    };

    setFireworks((prev) => [...prev, newFirework]);
  }, delay);
}

export function launchFireworkShow(setFireworks: React.Dispatch<React.SetStateAction<Firework[]>>, duration: number = 5000): () => void {
  const types: FireworkType[] = ["burst", "willow", "spiral", "double", "chrysanthemum"];
  const timeoutIds: ReturnType<typeof setTimeout>[] = [];

  const startTime = Date.now();
  let isStopped = false;

  const scheduleNext = () => {
    if (isStopped) return;

    const elapsed = Date.now() - startTime;
    if (elapsed < duration) {
      const delay = Math.random() * 300;
      const type = types[Math.floor(Math.random() * types.length)];
      launchFirework(setFireworks, type, delay);
      const nextDelay = 300 + Math.random() * 500;
      const timeoutId = setTimeout(scheduleNext, nextDelay);
      timeoutIds.push(timeoutId);
    }
  };

  scheduleNext();

  return () => {
    isStopped = true;
  };
}
