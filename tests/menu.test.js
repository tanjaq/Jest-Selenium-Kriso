const HomePage = require("../pageobjects/homePage");
const CategoryPage = require("../pageobjects/categoryPage");
const { buildDriver } = require("../utils/driverFactory");

let driver;

describe("Menu / Category navigation workflow", () => {
  let home;
  let category;

  beforeAll(async () => {
    driver = await buildDriver();
    await driver.manage().setTimeouts({ implicit: 0 });
    await driver.manage().window().setRect({ width: 1400, height: 900 });

    home = new HomePage(driver);
    category = new CategoryPage(driver);

    await home.openUrl();
    try { await home.acceptCookies(); } catch (_) {}
  }, 180000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  test("Navigate via Muusikaraamatud ja noodid + apply Klassikaline and CD filters", async () => {
    await home.verifyLogo();

    // Open the top mega menu
    await category.openTopMenu("Muusikaraamatud ja noodid");

    // Click Genre: Klassikaline
    await category.clickMenuItem("Klassikaline");

    const count1 = await category.countProducts();
    expect(count1).toBeGreaterThan(1);

    // Open menu again if it closes after navigation
    await category.openTopMenu("Muusikaraamatud ja noodid");

    // Click Format: CD
    await category.clickMenuItem("CD");

    const count2 = await category.countProducts();
    expect(count2).toBeLessThanOrEqual(count1);

    // Confirm URL/text reflects navigation/filters
    await category.expectPageContainsAny(["klass", "klassikal", "cd"]);
  });
});