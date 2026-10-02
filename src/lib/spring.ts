/*
 * Springs and gesture physics (spec 0018), after Apple's "Designing Fluid
 * Interfaces". A spring is described the way Apple describes it: a damping
 * ratio (1 settles with no overshoot, below 1 bounces) and a response in
 * seconds (how quickly it gets there; not a duration). It always continues
 * from its current value and velocity, so any animation can be grabbed,
 * redirected, or reversed mid-flight without a jump.
 */

export type SpringParams = {
  /** 1 = critically damped, no overshoot. Below 1 overshoots; 0.8 is a gentle bounce. */
  damping?: number;
  /** Seconds to get most of the way there. Lower is snappier. */
  response?: number;
};

const SUBSTEP = 1 / 240;

/** Advances a spring by `dt` seconds. Pure, so it can be tested without frames. */
export function stepSpring(
  value: number,
  velocity: number,
  target: number,
  { damping = 1, response = 0.35 }: SpringParams,
  dt: number,
): { value: number; velocity: number } {
  const omega = (2 * Math.PI) / response;
  const stiffness = omega * omega;
  const friction = 2 * damping * omega;
  const steps = Math.max(1, Math.ceil(dt / SUBSTEP));
  const h = dt / steps;
  let x = value;
  let v = velocity;
  for (let n = 0; n < steps; n++) {
    v += (-stiffness * (x - target) - friction * v) * h;
    x += v * h;
  }
  return { value: x, velocity: v };
}

/**
 * Where a flick would come to rest, given its release velocity in units per
 * second. Apple's exponential-decay form (scroll deceleration), not v²/2a.
 */
export function project(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** How far an element follows a drag past its edge: less and less the further it goes. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  if (dimension <= 0) return 0;
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Release velocity from the last 100ms of pointer samples, in px per second. */
export class VelocityTracker {
  private samples: { t: number; x: number; y: number }[] = [];

  add(t: number, x: number, y: number): void {
    this.samples.push({ t, x, y });
    while (this.samples.length > 2 && t - (this.samples[0]?.t ?? t) > 100) this.samples.shift();
  }

  velocity(): { vx: number; vy: number } {
    const first = this.samples[0];
    const last = this.samples.at(-1);
    if (!first || !last || last.t - first.t < 1) return { vx: 0, vy: 0 };
    const dt = (last.t - first.t) / 1000;
    return { vx: (last.x - first.x) / dt, vy: (last.y - first.y) / dt };
  }

  reset(): void {
    this.samples = [];
  }
}

export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * A spring driven by requestAnimationFrame. `to` retargets from wherever the
 * value is now, keeping its velocity unless a new one is given (a gesture's
 * release speed). `onRest` runs once when the value settles at the target,
 * and is dropped if the spring is retargeted first.
 */
export class Spring {
  value: number;
  velocity = 0;
  target: number;
  private params: SpringParams;
  private precision: number;
  private frame = 0;
  private last = 0;
  private onRest: (() => void) | undefined;

  constructor(
    value: number,
    private readonly onUpdate: (value: number) => void,
    params: SpringParams = {},
    precision = 0.01,
  ) {
    this.value = value;
    this.target = value;
    this.params = params;
    this.precision = precision;
  }

  to(
    target: number,
    options: { velocity?: number; params?: SpringParams; onRest?: () => void } = {},
  ): this {
    this.target = target;
    if (options.velocity !== undefined) this.velocity = options.velocity;
    if (options.params) this.params = options.params;
    this.onRest = options.onRest;
    if (!this.frame) {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }
    return this;
  }

  /** Sets the value at once, with no motion and no velocity. */
  jump(value: number): this {
    this.stop();
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.onUpdate(value);
    return this;
  }

  stop(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.onRest = undefined;
  }

  get moving(): boolean {
    return this.frame !== 0;
  }

  private tick = (now: number) => {
    // A long gap (a hidden tab) shouldn't fling the value: cap the step.
    const dt = Math.min(0.064, (now - this.last) / 1000);
    this.last = now;
    const next = stepSpring(this.value, this.velocity, this.target, this.params, dt);
    this.value = next.value;
    this.velocity = next.velocity;
    const settled =
      Math.abs(this.value - this.target) < this.precision &&
      Math.abs(this.velocity) < this.precision * 10;
    if (settled) {
      this.value = this.target;
      this.velocity = 0;
      this.frame = 0;
      this.onUpdate(this.value);
      const done = this.onRest;
      this.onRest = undefined;
      done?.();
      return;
    }
    this.onUpdate(this.value);
    this.frame = requestAnimationFrame(this.tick);
  };
}
