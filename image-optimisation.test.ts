import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/*
 * Guards AC-8 of spec 0002: a project image must resolve to a real optimised
 * build time asset, not just a hashed URL in the HTML.
 *
 * The regression this exists for: `sharp` is Astro's image service backend but
 * only an optional peer, so under pnpm it can be missing from the root while
 * everything else looks fine. The page then renders a correct `/_astro/*.webp`
 * src and the build dies with `MissingSharp`, never writing the file.
 *
 * It builds a tiny fixture site rather than the real one, because the real
 * `projects.yaml` ships the owner's actual content (AC-11) and `src/assets/`
 * stays empty until there are real screenshots. The fixture keeps the proof
 * alive without parking a fake screenshot in the content.
 */

const fixtureRoot = fileURLToPath(new URL('./tests/fixtures/image-optimisation', import.meta.url));

// The real CLI in a child process, not Astro's JS `build()` API: the API is
// exported for Node, and importing it through Vitest's SSR transform hands back
// a namespace whose `build` is not callable. Shelling out also means the test
// exercises the same code path `pnpm build` takes.
const astroBin = join(
  dirname(createRequire(import.meta.url).resolve('astro/package.json')),
  'bin',
  'astro.mjs',
);

let outDir: string;
let assetNames: string[];

beforeAll(async () => {
  outDir = await mkdtemp(join(tmpdir(), 'astro-image-optimisation-'));

  const result = spawnSync(
    process.execPath,
    [astroBin, 'build', '--root', fixtureRoot, '--outDir', outDir, '--silent'],
    { encoding: 'utf8' },
  );

  // Without sharp the build dies here with `MissingSharp`, so surface its own
  // output rather than a bare "directory not found" from the read below.
  expect(result.status, `${result.stdout ?? ''}\n${result.stderr ?? ''}`).toBe(0);

  assetNames = await readdir(join(outDir, '_astro'));
  // A cold Astro build, so this needs far more than the default per test budget.
}, 180_000);

afterAll(async () => {
  await rm(outDir, { recursive: true, force: true });
});

describe('build time image optimisation', () => {
  it('writes an optimised .webp into _astro', () => {
    // covers: AC-8, the optimiser runs rather than only the `image()` helper.
    expect(assetNames.filter((name) => name.endsWith('.webp'))).not.toHaveLength(0);
  });

  it('writes a real WebP file, not an empty placeholder', async () => {
    // A zero byte or misnamed file would pass the check above, and that is
    // exactly what a half working pipeline leaves behind. Read the bytes.
    const webp = assetNames.find((name) => name.endsWith('.webp'));
    expect(webp).toBeDefined();

    const bytes = await readFile(join(outDir, '_astro', webp as string));

    expect(bytes.byteLength).toBeGreaterThan(0);
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('RIFF');
    expect(bytes.subarray(8, 12).toString('ascii')).toBe('WEBP');
  });
});
