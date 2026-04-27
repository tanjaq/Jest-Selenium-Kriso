const Page = require("./basePage");
const { By, until } = require("selenium-webdriver");

function escXpathText(s) {
  // safe enough for your use-case (no quotes in menu texts)
  return String(s).replace(/"/g, '\\"');
}

async function sleep(driver, ms) {
  try {
    await driver.sleep(ms);
  } catch (_) {}
}

async function isDisplayedSafe(el) {
  try {
    return await el.isDisplayed();
  } catch (_) {
    return false;
  }
}

async function firstVisible(driver, locator, timeout = 15000) {
  const end = Date.now() + timeout;

  while (Date.now() < end) {
    const els = await driver.findElements(locator);
    for (const el of els) {
      if (await isDisplayedSafe(el)) return el;
    }
    await sleep(driver, 200);
  }

  return null;
}

async function clickRobust(driver, el, timeout = 15000) {
  await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el);
  await driver.wait(until.elementIsVisible(el), timeout);

  try {
    await el.click();
    return;
  } catch (_) {}

  // click intercepted / not clickable -> JS click
  await driver.executeScript("arguments[0].click();", el);
}

module.exports = class CategoryPage extends Page {
  constructor(driver) {
    super(driver);

    // ✅ Kriso listings are often "book-list" rather than ".product"
    this.productCardLocators = [
      By.css("div.search-results-wrap ul.book-list > li.list-item"),
      By.css("ul.book-list > li.list-item"),
      By.css("li.list-item"),
      By.css(".product"),
      By.css(".product-item"),
      By.css(".product-list-item"),
      By.css(".search-result"),
    ];

    // ✅ Top navigation link by visible text (try a OR span/strong inside an a)
    this.topNavLink = (text) => {
      const t = escXpathText(text);
      return By.xpath(
        `//header//*[self::a or self::span or self::div][contains(normalize-space(.), "${t}")]
           /ancestor-or-self::a[1]
         | //nav//*[self::a or self::span or self::div][contains(normalize-space(.), "${t}")]
           /ancestor-or-self::a[1]`
      );
    };

    // ✅ Mega menu containers (best effort)
    this.megaMenuContainer = By.css(
      ".nav-submenu, .submenu, .dropdown-menu, .mega-menu, [class*='submenu'], [class*='dropdown'], [class*='mega']"
    );

    // ✅ Clickable menu item by text: prefer <a> or <button> ancestor
    this.megaMenuItemByText = (text) => {
      const t = escXpathText(text);
      return By.xpath(
        `//*[contains(@class,'nav-submenu') or contains(@class,'submenu') or contains(@class,'dropdown') or contains(@class,'mega') or contains(@class,'menu')]
            //*[contains(normalize-space(.), "${t}")]
            /ancestor-or-self::*[self::a or self::button][1]`
      );
    };
  }

  async openTopMenu(menuText) {
    const driver = this.getDriver();
    const urlBefore = await driver.getCurrentUrl();

    // Find a visible top nav element
    const link = await firstVisible(driver, this.topNavLink(menuText), 15000);
    if (!link) throw new Error(`Top menu "${menuText}" not found (visible).`);

    await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", link);
    await sleep(driver, 150);

    // Hover first (mega menu often needs hover)
    try {
      await driver.actions({ bridge: true }).move({ origin: link }).perform();
      await sleep(driver, 200);
    } catch (_) {}

    // Click as fallback
    try {
      await clickRobust(driver, link, 15000);
    } catch (_) {}

    // Wait for mega menu to show OR URL change (some menus navigate)
    await driver.wait(
      async () => {
        const now = await driver.getCurrentUrl();
        if (now !== urlBefore) return true;

        const menus = await driver.findElements(this.megaMenuContainer);
        for (const m of menus) {
          if (await isDisplayedSafe(m)) return true;
        }
        return false;
      },
      15000
    );

    await sleep(driver, 250);
  }

  async clickMenuItem(text) {
    const driver = this.getDriver();
    const urlBefore = await driver.getCurrentUrl();

    // Find a visible clickable item in mega menu
    const item = await firstVisible(driver, this.megaMenuItemByText(text), 15000);
    if (!item) throw new Error(`Menu item "${text}" not found (visible/clickable).`);

    await driver.executeScript("arguments[0].scrollIntoView({block:'center'});", item);
    await sleep(driver, 150);

    await clickRobust(driver, item, 15000);

    // Wait for navigation or products to update/render
    await driver.wait(
      async () => {
        const now = await driver.getCurrentUrl();
        if (now !== urlBefore) return true;

        // products exist?
        for (const loc of this.productCardLocators) {
          const els = await driver.findElements(loc);
          if (els.length > 0) return true;
        }
        return false;
      },
      20000
    );

    await sleep(driver, 400);
  }

  async countProducts() {
    const driver = this.getDriver();

    // Wait until any product locator finds items
    await driver.wait(async () => {
      for (const loc of this.productCardLocators) {
        const cards = await driver.findElements(loc);
        if (cards.length >= 1) return true;
      }
      return false;
    }, 20000);

    // Return the first non-zero count
    for (const loc of this.productCardLocators) {
      const cards = await driver.findElements(loc);
      if (cards.length) return cards.length;
    }

    return 0;
  }

  async expectPageContainsAny(words) {
    const driver = this.getDriver();

    const url = (await driver.getCurrentUrl()).toLowerCase();
    const body = await driver.findElement(By.css("body"));
    const txt = (await body.getText()).toLowerCase();

    const ok = words.some((w) => {
      const k = String(w).toLowerCase();
      return txt.includes(k) || url.includes(k);
    });

    expect(ok).toBe(true);
  }
};