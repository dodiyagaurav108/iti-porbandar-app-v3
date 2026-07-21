import puppeteer from 'puppeteer';

async function run() {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    page.on('console', msg => {
      console.log('BROWSER LOG:', msg.text(), msg.location());
    });
    
    page.on('pageerror', err => {
      console.error('BROWSER ERROR:', err.message, err.stack);
    });

    console.log('Loading page...');
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    console.log('Page loaded successfully');
    await browser.close();
  } catch (err) {
    console.error('Puppeteer run failed:', err);
  }
}

run();
