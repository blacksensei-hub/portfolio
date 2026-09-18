import { defineConfig } from 'astro/config';

// A throwaway site, built only by `image-optimisation.test.ts`. It is
// deliberately bare: no integrations, no Tailwind, nothing but the one page
// that renders an image, so a failure can only be the image pipeline.
//
// `image` is left at its defaults on purpose. The default service is Astro's
// sharp backed one, which is exactly what the test is guarding; naming a
// service here would let a passthrough slip in and the test would still pass.
export default defineConfig({
  output: 'static',
});
