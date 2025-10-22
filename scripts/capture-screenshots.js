import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const screenshotsDir = path.join(projectRoot, 'screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...');
  console.log('📁 Screenshots will be saved to:', screenshotsDir);
  
  const browser = await chromium.launch({ 
    headless: false,
    timeout: 30000 
  });
  const page = await browser.newPage();
  
  try {
    // Navigate to homepage
    console.log('🌐 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Capture homepage
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'homepage.png'),
      fullPage: true 
    });
    console.log('✅ Homepage screenshot captured to screenshots/homepage.png');
    
    // Try to navigate to booking
    try {
      await page.click('text=Đặt lịch');
      await page.waitForTimeout(2000);
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'booking-form.png'),
        fullPage: true 
      });
      console.log('✅ Booking form screenshot captured to screenshots/booking-form.png');
    } catch (error) {
      console.log('⚠️  Booking form not found, skipping...');
    }
    
    // Try to navigate to profile page
           try {
             console.log('🌐 Navigating to profile page...');
             await page.goto('http://localhost:3000/profile', {
               waitUntil: 'networkidle',
               timeout: 30000
             });
             await page.screenshot({
               path: path.join(screenshotsDir, 'profile-page.png'),
               fullPage: true
             });
             console.log('✅ Profile page screenshot captured to screenshots/profile-page.png');

             // Navigate to vehicles tab
             try {
               console.log('🚗 Clicking on vehicles tab...');
               await page.click('text=Phương tiện');
               await page.waitForTimeout(2000);
               await page.screenshot({
                 path: path.join(screenshotsDir, 'vehicles-page.png'),
                 fullPage: true
               });
               console.log('✅ Vehicles page screenshot captured to screenshots/vehicles-page.png');
             } catch (error) {
               console.log('⚠️  Vehicles tab not found, skipping...', error.message);
             }
           } catch (error) {
             console.log('⚠️  Profile page not found, skipping...', error.message);
           }
    
    // Try to navigate to confirmation step
    try {
      // Fill some form data if needed
      await page.fill('input[name="fullName"]', 'Test User');
      await page.fill('input[name="phone"]', '0123456789');
      await page.fill('input[name="email"]', 'test@example.com');
      
      // Take screenshot of filled form
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'filled-form.png'),
        fullPage: true 
      });
      console.log('✅ Filled form screenshot captured to screenshots/filled-form.png');
    } catch (error) {
      console.log('⚠️  Form filling failed, skipping...');
    }
    
  } catch (error) {
    console.error('❌ Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  captureScreenshots().catch(console.error);
}

export { captureScreenshots };
