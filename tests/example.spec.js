// @ts-check
const { test, expect } = require('@playwright/test');

test('homepage has title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/EV Service Center/);
});

test('booking flow works', async ({ page }) => {
  await page.goto('/');
  
  // Click on booking button
  await page.click('text=Đặt lịch');
  
  // Check if booking form is visible
  await expect(page.locator('form')).toBeVisible();
});

test('UI improvements screenshot', async ({ page }) => {
  await page.goto('/');
  
  // Take full page screenshot
  await page.screenshot({ 
    path: 'screenshots/homepage.png',
    fullPage: true 
  });
  
  // Navigate to booking if possible
  try {
    await page.click('text=Đặt lịch');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: 'screenshots/booking-form.png',
      fullPage: true 
    });
  } catch (error) {
    console.log('Booking form not found, skipping...');
  }
});
