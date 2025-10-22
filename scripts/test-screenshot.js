import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const screenshotsDir = path.join(projectRoot, 'screenshots');

console.log('📁 Project root:', projectRoot);
console.log('📁 Screenshots dir:', screenshotsDir);

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
  console.log('✅ Created screenshots directory');
} else {
  console.log('✅ Screenshots directory already exists');
}

async function testScreenshot() {
  console.log('🚀 Starting screenshot test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    timeout: 30000 
  });
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('📸 Taking screenshot...');
    const screenshotPath = path.join(screenshotsDir, 'test-homepage.png');
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved to:', screenshotPath);
    
    // Check if file actually exists
    if (fs.existsSync(screenshotPath)) {
      const stats = fs.statSync(screenshotPath);
      console.log('✅ File exists, size:', stats.size, 'bytes');
    } else {
      console.log('❌ File not found after screenshot');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('🔚 Browser closed');
  }
}

testScreenshot().catch(console.error);
