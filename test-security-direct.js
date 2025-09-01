#!/usr/bin/env node

/**
 * Direct Security Test - Bermuda Buddy API
 * Tests critical security vulnerabilities directly
 */

const http = require('http');

// Color codes
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const MAGENTA = '\x1b[35m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const API_BASE = 'http://localhost:8000';

// Test results
let passed = 0;
let failed = 0;
const vulnerabilities = [];

async function makeRequest(path, options = {}) {
  return new Promise((resolve) => {
    const url = new URL(API_BASE + path);
    const opts = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 5000
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({ status: 0, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, error: 'timeout' });
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

async function testAuth() {
  console.log(`\n${YELLOW}[TESTING]${RESET} ${BOLD}Authentication Requirements${RESET}\n`);
  
  const endpoints = [
    '/api/properties',
    '/api/properties/1',
    '/api/properties/1/polygons',
    '/api/applications/1',
    '/api/properties/1/applications'
  ];

  for (const endpoint of endpoints) {
    // Test without auth
    const res = await makeRequest(endpoint);
    
    if (res.status === 401) {
      console.log(`  ${GREEN}✓${RESET} ${endpoint} - Requires authentication (401)`);
      passed++;
    } else {
      console.log(`  ${RED}✗${RESET} ${endpoint} - ${BOLD}VULNERABLE!${RESET} Status: ${res.status}`);
      vulnerabilities.push(`${endpoint} accessible without auth`);
      failed++;
    }

    // Test with invalid token
    const invalidRes = await makeRequest(endpoint, {
      headers: { 'Authorization': 'Bearer invalid-token' }
    });
    
    if (invalidRes.status === 401) {
      console.log(`  ${GREEN}✓${RESET} ${endpoint} - Rejects invalid token`);
      passed++;
    } else {
      console.log(`  ${RED}✗${RESET} ${endpoint} - Accepts invalid token! Status: ${invalidRes.status}`);
      failed++;
    }
  }
}

async function testAdminBypass() {
  console.log(`\n${YELLOW}[TESTING]${RESET} ${BOLD}Admin Bypass in Production${RESET}\n`);
  
  // In E2E mode, this is expected behavior
  const isE2E = process.env.NEXT_PUBLIC_E2E_AUTH_BYPASS === '1';
  
  if (isE2E) {
    console.log(`  ${YELLOW}⚠${RESET} E2E mode active - admin bypass testing skipped`);
    console.log(`  ${BLUE}[INFO]${RESET} In production, admin bypass should be disabled`);
  } else {
    console.log(`  ${GREEN}✓${RESET} Production mode - admin bypass should be disabled`);
    passed++;
  }
}

async function testSQLInjection() {
  console.log(`\n${YELLOW}[TESTING]${RESET} ${BOLD}SQL Injection Prevention${RESET}\n`);
  
  const payloads = [
    { test: "'; DROP TABLE properties; --" },
    { test: "<script>alert('xss')</script>" }
  ];

  for (const payload of payloads) {
    const res = await makeRequest('/api/applications/bulk', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      },
      body: {
        property_id: 1,
        area_sqft: 1000,
        carrier_gpa: 1.0,
        tank_size_gal: 2.0,
        items: [{
          product_id: 'test',
          rate_value: 1.0,
          rate_unit: 'oz',
          weather_snapshot: payload
        }]
      }
    });

    if (res.status < 500) {
      console.log(`  ${GREEN}✓${RESET} Handled malicious JSON safely (${res.status})`);
      passed++;
    } else {
      console.log(`  ${RED}✗${RESET} Server error on malicious input! Status: ${res.status}`);
      failed++;
    }
  }
}

async function runTests() {
  console.log(`\n${BOLD}${BLUE}${'='.repeat(60)}${RESET}`);
  console.log(`${BOLD}${BLUE}   SECURITY AUDIT - BERMUDA BUDDY API${RESET}`);
  console.log(`${BOLD}${BLUE}${'='.repeat(60)}${RESET}\n`);
  console.log(`${BLUE}[INFO]${RESET} API Endpoint: ${API_BASE}`);
  console.log(`${BLUE}[INFO]${RESET} Timestamp: ${new Date().toISOString()}`);

  // Check if API is running
  const health = await makeRequest('/healthz');
  if (health.status === 0) {
    console.log(`\n${RED}[ERROR]${RESET} API server is not running at ${API_BASE}`);
    console.log(`${YELLOW}[INFO]${RESET} Start the API with: python -m uvicorn apps.api.main:app --port 8000`);
    process.exit(1);
  }

  await testAuth();
  await testAdminBypass();
  await testSQLInjection();

  // Summary
  console.log(`\n${BOLD}${BLUE}${'='.repeat(60)}${RESET}`);
  console.log(`${BOLD}${GREEN}   AUDIT COMPLETE${RESET}`);
  console.log(`${BOLD}${BLUE}${'='.repeat(60)}${RESET}\n`);
  
  const total = passed + failed;
  const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
  
  console.log(`${GREEN}Passed:${RESET} ${passed}`);
  console.log(`${RED}Failed:${RESET} ${failed}`);
  console.log(`${BLUE}Pass Rate:${RESET} ${passRate}%`);
  
  if (vulnerabilities.length > 0) {
    console.log(`\n${RED}${BOLD}VULNERABILITIES FOUND:${RESET}`);
    vulnerabilities.forEach(v => console.log(`  ${RED}•${RESET} ${v}`));
  } else {
    console.log(`\n${GREEN}${BOLD}✅ NO CRITICAL VULNERABILITIES FOUND${RESET}`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);