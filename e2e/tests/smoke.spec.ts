import { expect, test, request as pwRequest } from '@playwright/test';
import fs from 'fs';
import path from 'path';

let seedPid: number | null = null;

test.beforeAll(async () => {
  // Seed a property with Dallas coords and a polygon via API so dashboard/applications have data
  const api = await pwRequest.newContext({ baseURL: 'http://localhost:8100' });
  const r1 = await api.post('/api/properties', { data: { address: '123 Bermuda Ln', state: 'TX', hoc_in: 0.75, program_goal: 'premium', lat: 32.78, lon: -96.80 } });
  if (r1.ok()) {
    const js = await r1.json();
    seedPid = js.id;
    await api.post(`/api/properties/${seedPid}/polygons`, { data: { name: 'Front Lawn', geojson: '{}', area_sqft: 4500 } });
    await api.post('/api/applications/bulk', { data: { property_id: seedPid, area_sqft: 4500, carrier_gpa: 1.0, tank_size_gal: 2.0, gdd_model: 'gdd10', items: [{ product_id: 'tenex', rate_value: 1.0, rate_unit: 'fl_oz_per_1k' }] } });
  }
});

test.beforeEach(async ({ context }) => {
  // Set E2E auth bypass cookie so middleware allows protected routes
  await context.addCookies([
    { name: 'bb_e2e', value: '1', domain: 'localhost', path: '/' },
    { name: 'bb_onboarding_complete', value: 'true', domain: 'localhost', path: '/' },
  ]);
});

test('home page renders and screenshots', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveText(/Bermuda Buddy/);
  const dir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, 'home.png'), fullPage: true });
});

test('onboarding page renders and screenshots', async ({ page }) => {
  await page.goto('/onboarding');
  await expect(page.locator('h1')).toHaveText(/Onboarding/);
  // If Mapbox is configured, the canvas should exist; wait briefly but don't fail hard
  try {
    await page.waitForSelector('.mapboxgl-canvas', { timeout: 2000 });
  } catch {
    // Mapbox might not be loaded, continue anyway
  }
  await page.getByLabel('Address').fill('123 Bermuda Ln');
  await page.getByLabel('State').selectOption('TX');
  await page.getByLabel('Area (ft²)').fill('4500');
  await page.getByLabel('Height of Cut (in)').fill('0.75');
  await page.getByRole('button', { name: 'Save and Continue' }).click();
  const dir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, 'onboarding.png'), fullPage: true });
});

test('account menu screenshot', async ({ page }) => {
  await page.goto('/');
  const dir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // Open the account menu (top right)
  await page.getByRole('button', { name: /Account menu|Account|Profile|Settings/ }).click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(dir, 'account-menu.png'), fullPage: true });
});

test('ok-to-spray drawer screenshot', async ({ page }) => {
  await page.goto('/ok-to-spray');
  const dir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.getByRole('button', { name: 'Fetch for Dallas, TX' }).click();
  await page.waitForTimeout(500); // allow fetch + render
  await page.screenshot({ path: path.join(dir, 'ok-to-spray.png'), fullPage: true });
});

test('dashboard screenshot', async ({ page }) => {
  // Ensure property id is present for richer dashboard
  if (seedPid) {
    await page.addInitScript(([pid]) => localStorage.setItem('bb_property_id', String(pid)), [seedPid]);
  }
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  const dir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(dir, 'dashboard.png'), fullPage: true });
});

test('dashboard weather source toggle screenshot', async ({ page }) => {
  await page.goto('/dashboard');
  const dir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // Switch wind source to NWS and wait briefly
  await page.getByLabel('Wind Source').selectOption('nws');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(dir, 'dashboard-nws.png'), fullPage: true });
});

test('dashboard mobile screenshot', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/dashboard');
  const dir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(dir, 'dashboard-mobile.png'), fullPage: true });
});

test('settings page screenshot', async ({ page }) => {
  await page.goto('/settings');
  const dir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dir, 'settings.png'), fullPage: true });
});

test('profile page screenshot', async ({ page }) => {
  await page.goto('/profile');
  const dir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dir, 'profile.png'), fullPage: true });
});

test('mix builder WALES + jar test screenshot', async ({ page }) => {
  await page.goto('/mix');
  await expect(page.getByRole('heading', { name: 'Mix Builder' })).toBeVisible();
  const dir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  // Select Prodiamine if not selected
  await page.getByText('Prodiamine 65 WDG').click();
  await page.getByRole('button', { name: 'Calculate' }).click();
  await page.getByRole('button', { name: 'Jar Test' }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(dir, 'mix-wales.png'), fullPage: true });
  // Open print view
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.getByRole('link', { name: /Open Garage Sheet/ }).click(),
  ]);
  await popup.waitForLoadState('domcontentloaded');
  await popup.waitForTimeout(400);
  await popup.screenshot({ path: path.join(dir, 'mix-garage-sheet.png'), fullPage: true });
});

test('applications list screenshot', async ({ page }) => {
  if (seedPid) {
    await page.addInitScript(([pid]) => localStorage.setItem('bb_property_id', String(pid)), [seedPid]);
  }
  await page.goto('/applications');
  await expect(page.getByRole('heading', { name: 'Saved Applications' })).toBeVisible();
  const dir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(dir, 'applications.png'), fullPage: true });
});
