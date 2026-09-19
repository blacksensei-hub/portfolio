/*
 * Builds public/resume.pdf from the same content the site renders, so the two
 * can never disagree. Run it with `pnpm resume` after editing src/content.
 *
 * Everything here comes from the YAML files except the EDUCATION block below,
 * which the site does not model. Edit that block when the details change.
 */
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { load } from 'js-yaml';

const read = (file) => load(readFileSync(`src/content/${file}`, 'utf8'));
const { profile } = read('profile.yaml');
const projects = read('projects.yaml').toSorted((a, b) => a.order - b.order);
const skills = read('skills.yaml').toSorted((a, b) => a.order - b.order);
const services = read('services.yaml').toSorted((a, b) => a.order - b.order);
const links = read('links.yaml').toSorted((a, b) => a.order - b.order);

// Not in the content model: update these by hand.
const EDUCATION = [
  {
    title: 'BSc Computer Science',
    org: 'University — update in scripts/build-resume.mjs',
    period: 'Expected 20XX',
    notes: 'Coursework across algorithms, databases, software engineering, and networks.',
  },
];

const LOCATION = 'Ghana';

const esc = (text) =>
  String(text).replace(
    /[&<>]/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char] ?? char,
  );

const contact = links
  .map(({ label, href }) => {
    const shown = href.replace(/^(https?:\/\/|mailto:|tel:)/, '').replace(/\?.*$/, '');
    return `<a href="${esc(href)}">${esc(label === 'Email' || label === 'Phone' ? shown : shown)}</a>`;
  })
  .join('<span class="dot">·</span>');

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${esc(profile.name)} — ${esc(profile.role)}</title>
    <style>
      @page { size: A4; margin: 14mm 15mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, "Segoe UI", system-ui, sans-serif;
        font-size: 10pt;
        line-height: 1.5;
        color: #1c1630;
      }
      a { color: #7a5a12; text-decoration: none; }
      header { border-bottom: 2px solid #c8922b; padding-bottom: 10pt; margin-bottom: 14pt; }
      .name { font-size: 24pt; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; }
      .role { font-size: 11pt; font-weight: 600; color: #7a5a12; margin-top: 2pt; }
      .meta { margin-top: 7pt; font-size: 8.5pt; color: #4b4763; }
      .dot { padding: 0 6pt; color: #b4b0c4; }
      h2 {
        font-size: 8.5pt;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: #4b4763;
        margin: 15pt 0 7pt;
        padding-bottom: 3pt;
        border-bottom: 1px solid #e0dde8;
      }
      .item { margin-bottom: 10pt; break-inside: avoid; }
      .item-head { display: flex; justify-content: space-between; gap: 12pt; align-items: baseline; }
      .item-title { font-weight: 700; font-size: 10.5pt; }
      .item-org { color: #4b4763; font-size: 9pt; }
      .item-period { color: #4b4763; font-size: 8.5pt; white-space: nowrap; }
      ul { margin: 4pt 0 0; padding-left: 14pt; }
      li { margin-bottom: 2pt; }
      .tech { margin-top: 3pt; font-size: 8.5pt; color: #4b4763; }
      .skills { display: grid; grid-template-columns: max-content 1fr; gap: 3pt 12pt; }
      .skills dt { font-weight: 700; }
      .skills dd { margin: 0; color: #35304d; }
      .two { display: grid; grid-template-columns: 1fr 1fr; gap: 3pt 18pt; }
      .summary { margin: 0; }
    </style>
  </head>
  <body>
    <header>
      <div class="name">${esc(profile.name)}</div>
      <div class="role">${esc(profile.role)}</div>
      <div class="meta">${LOCATION}<span class="dot">·</span>${contact}</div>
    </header>

    <h2>Summary</h2>
    <p class="summary">${esc(profile.bio)}</p>

    <h2>Projects</h2>
    ${projects
      .map(
        (project) => `
      <div class="item">
        <div class="item-head">
          <span class="item-title">${esc(project.title)}</span>
          <span class="item-period">${esc([project.demoUrl, project.repoUrl].filter(Boolean).length ? 'Live' : '')}</span>
        </div>
        <div class="item-org">${esc(project.summary)}</div>
        <div class="tech">Stack: ${esc(project.tech.join(', '))}</div>
        <div class="tech">${[project.demoUrl, project.repoUrl]
          .filter(Boolean)
          .map((url) => `<a href="${esc(url)}">${esc(url.replace(/^https?:\/\//, ''))}</a>`)
          .join('<span class="dot">·</span>')}</div>
      </div>`,
      )
      .join('')}

    <h2>Education</h2>
    ${EDUCATION.map(
      (entry) => `
      <div class="item">
        <div class="item-head">
          <span class="item-title">${esc(entry.title)}</span>
          <span class="item-period">${esc(entry.period)}</span>
        </div>
        <div class="item-org">${esc(entry.org)}</div>
        ${entry.notes ? `<div class="tech">${esc(entry.notes)}</div>` : ''}
      </div>`,
    ).join('')}

    <h2>Technical skills</h2>
    <dl class="skills">
      ${skills
        .map((group) => `<dt>${esc(group.group)}</dt><dd>${esc(group.items.join(', '))}</dd>`)
        .join('')}
    </dl>

    <h2>Services</h2>
    <div class="two">
      ${services.map((service) => `<div>• ${esc(service.title)}</div>`).join('')}
    </div>
    ${
      profile.availability
        ? `<p class="tech" style="margin-top:8pt">${esc(profile.availability.note)}</p>`
        : ''
    }
  </body>
</html>`;

const browser = await chromium.launch();
// A4 at 96dpi, so the preview shows the same line breaks as the print.
const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.pdf({ path: 'public/resume.pdf', format: 'A4', printBackground: true });

// `pnpm resume --preview <path>` also writes a PNG, since headless Chromium
// cannot render a PDF back for a look.
const previewIndex = process.argv.indexOf('--preview');
if (previewIndex !== -1) {
  const path = process.argv[previewIndex + 1] ?? 'resume-preview.png';
  await page.screenshot({ path, fullPage: true });
  console.log(`${path} written`);
}

await browser.close();
console.log('public/resume.pdf written');
