const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const chromedriver = require("chromedriver");
const path = require("path");
const os = require("os");

async function buildDriver() {
  console.log("[driverFactory] building chrome driver...");
  console.log("[driverFactory] chromedriver path:", chromedriver.path);

  const options = new chrome.Options();

  // ✅ unique profile (prevents “profile in use” deadlocks)
  const userDataDir = path.join(
    os.tmpdir(),
    `kriso-profile-${process.pid}-${Date.now()}`
  );
  options.addArguments(`--user-data-dir=${userDataDir}`);

  // Optional headless
  if (process.env.HEADLESS === "1") {
    options.addArguments("--headless=new");
  }

  // ✅ Core stability flags
  options.addArguments(
    "--window-size=1400,900",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--remote-allow-origins=*",

    // 🔥 Additional crash-prevention flags
    "--disable-features=TranslateUI",
    "--disable-background-networking",
    "--disable-renderer-backgrounding",
    "--disable-background-timer-throttling",
    "--disable-client-side-phishing-detection",
    "--disable-hang-monitor",
    "--disable-popup-blocking",
    "--disable-notifications",
    "--disable-blink-features=AutomationControlled"
  );

  // ❗ Do NOT exclude enable-automation while debugging stability
  // options.excludeSwitches(["enable-automation"]);

  // ✅ Force driver binary + enable logging
  const logPath = path.join(process.cwd(), "chromedriver.log");
  const service = new chrome.ServiceBuilder(chromedriver.path)
    .enableVerboseLogging()
    .loggingTo(logPath);

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .setChromeService(service)
    // If your selenium version supports it, this reduces page load hangs:
    .build();

  console.log("[driverFactory] driver built, setting timeouts...");

  await driver.manage().setTimeouts({
    pageLoad: 30000,
    script: 30000,
    implicit: 0,
  });

  console.log("[driverFactory] opening about:blank...");
  await driver.get("about:blank");
  console.log("[driverFactory] about:blank opened OK.");

  return driver;
}

module.exports = { buildDriver };