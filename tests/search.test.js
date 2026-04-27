const HomePage = require("../pageobjects/homePage");
const SearchPage = require("../pageobjects/searchPage");
const { buildDriver } = require("../utils/driverFactory");

let driver;

describe("Search workflow", () => {
  let home;
  let search;

  beforeAll(async () => {
    driver = await buildDriver();
    await driver.manage().setTimeouts({ implicit: 0 });
    await driver.manage().window().setRect({ width: 1400, height: 900 });

    home = new HomePage(driver);
    search = new SearchPage(driver);

    await home.openUrl();
    try {
      await home.acceptCookies();
    } catch (_) {}
  }, 180000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  test("Search 'harry potter' shows multiple products and keyword appears", async () => {
    await home.verifyLogo();

    await search.search("harry potter");
    await search.verifyMultipleResults();
    await search.verifyAllResultsContainKeyword("harry potter", 20);
  });

  test("Advanced price filter (20€ - 40€) reduces results", async () => {
    await search.search("harry potter");
    const before = await search.countResults();

    await search.openAdvancedSearch();
    await search.setAdvancedPriceRange("20", "40");
    await search.submitAdvancedSearch("harry potter");

    const after = await search.countResults();

    expect(after).toBeLessThan(before);
    await search.verifyPricesWithinRange(20, 40);
  });

  test("Filter by language (english2) + format (Kõvakaaneline) via Advanced Search", async () => {
    await search.openAdvancedSearch();
    await search.filterByLanguage("english2");
    await search.filterByFormat("2");
    await search.submitAdvancedSearch("harry potter");

    await search.verifyMultipleResults();
    await search.verifyAllResultsContainKeyword("harry potter", 20);
  });
});