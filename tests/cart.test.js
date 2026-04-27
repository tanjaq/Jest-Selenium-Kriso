const HomePage = require("../pageobjects/homePage");
const SearchPage = require("../pageobjects/searchPage");
const CartPage = require("../pageobjects/cartPage");
const { buildDriver } = require("../utils/driverFactory");

let driver;

describe("Shopping cart workflow", () => {
  let home;
  let search;
  let cart;

  beforeAll(async () => {
    driver = await buildDriver();
    await driver.manage().setTimeouts({ implicit: 0 });
    await driver.manage().window().setRect({ width: 1400, height: 900 });

    home = new HomePage(driver);
    search = new SearchPage(driver);
    cart = new CartPage(driver);

    await home.openUrl();
    try {
      await home.acceptCookies();
    } catch (_) {}
  }, 180000);

  afterAll(async () => {
    if (driver) await driver.quit();
  });

  test("Logo element is visible", async () => {
    await home.verifyLogo();
  });

  test("Add 2 books from search results, verify cart, total, and remove one item", async () => {
    await search.search("harry potter");
    await search.verifyMultipleResults();

    // Store titles of first two added products
    const firstIndex = await search.addFirstAddableResultToCart(1, 10);

await driver.get("https://www.kriso.ee/");
await search.search("harry potter");

const secondIndex = await search.addFirstAddableResultToCart(firstIndex + 1, 10);

// Get the actual titles of the books that were added
await driver.get("https://www.kriso.ee/");
await search.search("harry potter");

const firstTitle = await search.getResultTitleByIndex(firstIndex);
const secondTitle = await search.getResultTitleByIndex(secondIndex);
    await search.openCartDirect();

    await cart.verifyCartQuantity(2);
    await cart.verifyCartContainsTitles([firstTitle, secondTitle]);

    const totalBefore = await cart.verifyTotalPriceLooksAccurate();

    const rowsBefore = await cart.getCartRowTexts();
    const removedRowText = rowsBefore[0];

    await cart.removeItem(1);
    await cart.verifyCartQuantity(1);

    const rowsAfter = await cart.getCartRowTexts();
    expect(rowsAfter.length).toBe(1);
    expect(rowsAfter[0]).not.toBe(removedRowText);

    const totalAfter = await cart.verifyTotalPriceLooksAccurate();
    expect(totalAfter).toBeLessThanOrEqual(totalBefore);
  });
});