const { Builder, By } = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')
let Homepage = require('../pageobjects/homePage');

let driver;
const TIMEOUT = 30000;

describe('Search products by filter menu', () => {

  beforeAll(async () => {
    driver = await new Builder().forBrowser('firefox')
      //uncomment if you want to run in headless mode
      .setFirefoxOptions(new firefox.Options().addArguments('--headless'))
      .build()
    await driver.manage().window().maximize()
    await driver.manage().setTimeouts({ implicit: TIMEOUT })

    Homepage = new Homepage(driver)
    await Homepage.openUrl()
    await Homepage.acceptCookies()
  }, TIMEOUT);

  afterAll(async () => {
    //uncomment if you want to close the browser in the end
    await driver.quit()
  });

  test('Test logo element is visible', async () => {
    await Homepage.verifyLogo()
  });

  test('section “Muusikaraamatud ja noodid”', async () => {
    await Homepage.verifyMusic()
  });

  test('Click the "Õppematerjalid" category', async () => {
    await Homepage.clickMusicSection()
    await Homepage.clickOppematerjalid()

    const currentUrl = await Homepage.getCurrentUrl()
    // tegemise hetkel õppematerjali produkte ei ole nii et kontrollin lihtsalt üldist muusika kategooriat ja eeltäidetud täpsema otsingu urli
    expect(currentUrl).toMatch(/database=musicsale|muusika-ja-noodid/)
  });

  test('Click on a category ("Bänd ja ansambel")', async () => {
    // ei saa teha eelmise tõttu
  });

  test('Click on a format category ("CD")', async () => {
    await Homepage.openUrl()
    await Homepage.clickMusicSection()
    const resultsBefore = await Homepage.searchResults()

    await Homepage.clickCDFormat()

    const filters = await Homepage.getActiveFilters()
    expect(filters.length).toBeGreaterThan(0)

    const resultsAfter = await Homepage.searchResults()
    expect(resultsAfter.length).toBeLessThan(resultsBefore.length)
  });
}); 