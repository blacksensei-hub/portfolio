import { describe, expect, it } from 'vitest';

import { project, rubberband, stepSpring, VelocityTracker } from './spring';

/** Runs a spring for `seconds` at 60fps and records every value. */
function run(
  params: { damping?: number; response?: number },
  from = 0,
  to = 100,
  v = 0,
  seconds = 2,
) {
  let value = from;
  let velocity = v;
  const trail: number[] = [];
  for (let t = 0; t < seconds; t += 1 / 60) {
    ({ value, velocity } = stepSpring(value, velocity, to, params, 1 / 60));
    trail.push(value);
  }
  return { value, velocity, trail };
}

describe('stepSpring', () => {
  it('settles on the target', () => {
    const { value, velocity } = run({ damping: 1, response: 0.4 });
    expect(value).toBeCloseTo(100, 1);
    expect(Math.abs(velocity)).toBeLessThan(0.1);
  });

  it('never overshoots when critically damped', () => {
    const { trail } = run({ damping: 1, response: 0.3 });
    expect(Math.max(...trail)).toBeLessThanOrEqual(100.001);
  });

  it('overshoots a little below a damping of 1', () => {
    const { trail } = run({ damping: 0.8, response: 0.3 });
    const peak = Math.max(...trail);
    expect(peak).toBeGreaterThan(100.5);
    expect(peak).toBeLessThan(110);
  });

  it('gets most of the way within its response time', () => {
    const { trail } = run({ damping: 1, response: 0.4 }, 0, 100, 0, 0.4);
    expect(trail.at(-1)).toBeGreaterThan(90);
  });

  it('carries a handed-off velocity forward before turning back', () => {
    const { trail } = run({ damping: 1, response: 0.4 }, 0, 0, 1500, 0.1);
    expect(Math.max(...trail)).toBeGreaterThan(20);
  });
});

describe('project', () => {
  it('matches Apple’s decay form', () => {
    expect(project(1000)).toBeCloseTo(499, 0);
    expect(project(-500)).toBeCloseTo(-249.5, 1);
    expect(project(0)).toBe(0);
  });

  it('throws shorter with a snappier deceleration rate', () => {
    expect(project(1000, 0.99)).toBeLessThan(project(1000, 0.998));
  });
});

describe('rubberband', () => {
  it('follows less than the overshoot, and less and less of it', () => {
    const near = rubberband(20, 800);
    const far = rubberband(400, 800);
    expect(near).toBeGreaterThan(0);
    expect(near).toBeLessThan(20);
    expect(far / 400).toBeLessThan(near / 20);
  });

  it('keeps the sign and never passes the dimension', () => {
    expect(rubberband(-100, 500)).toBeLessThan(0);
    expect(rubberband(1e6, 500)).toBeLessThan(500);
  });
});

describe('VelocityTracker', () => {
  it('measures px per second over the latest samples', () => {
    const tracker = new VelocityTracker();
    tracker.add(0, 0, 0);
    tracker.add(50, 25, -10);
    tracker.add(100, 50, -20);
    const { vx, vy } = tracker.velocity();
    expect(vx).toBeCloseTo(500, 0);
    expect(vy).toBeCloseTo(-200, 0);
  });

  it('forgets samples older than 100ms', () => {
    const tracker = new VelocityTracker();
    tracker.add(0, 0, 0);
    tracker.add(500, 1000, 0);
    tracker.add(550, 1000, 0);
    tracker.add(600, 1000, 0);
    expect(tracker.velocity().vx).toBeCloseTo(0, 5);
  });

  it('reports no velocity without enough samples', () => {
    expect(new VelocityTracker().velocity()).toEqual({ vx: 0, vy: 0 });
  });
});
