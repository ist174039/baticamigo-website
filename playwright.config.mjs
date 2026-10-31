import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./e2e/tests',
  timeout:30000,
  expect:{timeout:12000},
  retries:process.env.CI?1:0,
  workers:1,
  reporter:process.env.CI?[['list'],['html',{open:'never',outputFolder:'playwright-report'}]]:'list',
  use:{baseURL:'http://127.0.0.1:3106',trace:'retain-on-failure',screenshot:'only-on-failure',video:'retain-on-failure'},
  projects:[
    {name:'chromium',use:{...devices['Desktop Chrome']}},
    // Browser-critical journeys run on all engines; data-intensive API scenarios
    // run once in Chromium to avoid creating duplicate synthetic records.
    {name:'firefox',testMatch:'**/browser-journeys.spec.mjs',use:{...devices['Desktop Firefox']}},
    {name:'webkit',testMatch:'**/browser-journeys.spec.mjs',use:{...devices['Desktop Safari']}},
  ],
  webServer:{
    command:'node e2e/server.mjs',
    url:'http://127.0.0.1:3106/platform/login',
    reuseExistingServer:!process.env.CI,
    timeout:120000
  }
});
