#!/usr/bin/env node
// Simple bundle-size budget check for Next.js app router.
// Reads .next/app-build-manifest.json and sums gzipped sizes of client JS per route.

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const root = process.cwd();
const webDir = path.join(root, 'apps', 'web');
const nextDir = path.join(webDir, '.next');
const budgetKB = Number(process.env.BUDGET_KB || '200');
let overrides = {};
let defaultKB = budgetKB;
const budgetsPath = path.join(root, 'scripts', 'budgets.json');
if (fs.existsSync(budgetsPath)) {
  try {
    const cfg = JSON.parse(fs.readFileSync(budgetsPath, 'utf8'));
    if (typeof cfg.defaultKB === 'number') defaultKB = cfg.defaultKB;
    if (cfg.overrides && typeof cfg.overrides === 'object') overrides = cfg.overrides;
  } catch {}
}

function gzipSize(buf) {
  const gz = zlib.gzipSync(buf, { level: 9 });
  return gz.length;
}

function loadJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function fileSizeGzip(relative) {
  const p = path.join(nextDir, relative);
  if (!fs.existsSync(p)) return 0;
  const buf = fs.readFileSync(p);
  return gzipSize(buf);
}

function unique(arr) {
  return Array.from(new Set(arr));
}

function summarizeRouteFiles(routeFiles) {
  const jsFiles = routeFiles.filter(f => f.endsWith('.js'));
  const uniqueFiles = unique(jsFiles);
  const totalGz = uniqueFiles.reduce((acc, f) => acc + fileSizeGzip(f), 0);
  return { files: uniqueFiles, totalGz };
}

function formatKB(bytes) {
  return (bytes / 1024).toFixed(1);
}

function main() {
  const appManifestPath = path.join(nextDir, 'app-build-manifest.json');
  const buildManifestPath = path.join(nextDir, 'build-manifest.json');
  if (!fs.existsSync(appManifestPath)) {
    console.error(`Missing ${appManifestPath}. Did you run next build?`);
    process.exit(1);
  }
  const appManifest = loadJSON(appManifestPath);
  const legacyManifest = fs.existsSync(buildManifestPath) ? loadJSON(buildManifestPath) : { pages: {} };
  const results = [];
  const pages = appManifest.pages || {};
  for (const [route, files] of Object.entries(pages)) {
    const { totalGz } = summarizeRouteFiles(files);
    results.push({ route, totalGz });
  }
  // Include legacy pages (/_app etc.) if any
  for (const [route, files] of Object.entries(legacyManifest.pages || {})) {
    if (route === '/_app') continue;
    const { totalGz } = summarizeRouteFiles(files);
    results.push({ route, totalGz });
  }

  if (results.length === 0) {
    console.warn('No routes found in app-build-manifest; skipping budgets.');
    process.exit(0);
  }

  let ok = true;
  console.log('Bundle budget check (gzipped):');
  const getBudgetFor = (route) => {
    for (const [k, v] of Object.entries(overrides)) {
      if (route === k || route.includes(k)) return Number(v);
    }
    return Number(process.env.BUDGET_KB || defaultKB);
  };
  const report = [];
  for (const r of results) {
    const kb = Number(formatKB(r.totalGz));
    const limit = getBudgetFor(r.route);
    const pass = kb <= limit;
    ok = ok && pass;
    console.log(`- ${r.route}: ${kb} KB ${pass ? 'OK' : `> ${limit} KB FAIL`}`);
    report.push({ route: r.route, kb, limit, pass });
  }

  try {
    const outJson = path.join(root, 'budget-report.json');
    const outTxt = path.join(root, 'budget-report.txt');
    fs.writeFileSync(outJson, JSON.stringify({ results: report }, null, 2));
    const lines = ['Route\tSize(KB)\tLimit(KB)\tPass'];
    for (const r of report) lines.push(`${r.route}\t${r.kb}\t${r.limit}\t${r.pass ? 'OK' : 'FAIL'}`);
    fs.writeFileSync(outTxt, lines.join('\n'));
  } catch {}
  if (!ok) {
    console.error(`One or more routes exceed ${budgetKB} KB gzipped. Consider code-splitting or reducing deps.`);
    process.exit(1);
  }
}

main();
