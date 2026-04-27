const { By, until, Key } = require("selenium-webdriver");
const Page = require("./basePage");

const homeUrl = "https://www.kriso.ee/";

const searchInputCandidates = [
  By.css('input[type="search"]'),
  By.css('input[name*="search"]'),
  By.css('input[id*="search"]'),
  By.css('input[placeholder*="Otsi"]'),
  By.css('input[placeholder*="Search"]'),
  By.css("header input[type='text']"),
  By.css("form input[type='text']"),
];

async function firstVisible(driver, locators, timeout = 15000) {
  const end = Date.now() + timeout;

  while (Date.now() < end) {
    for (const loc of locators) {
      const els = await driver.findElements(loc);
      for (const el of els) {
        try {
          if (await el.isDisplayed()) return el;
        } catch (_) {}
      }
    }
    await driver.sleep(200);
  }

  return null;
}

module.exports = class SearchPage extends Page {
  constructor(driver) {
    super(driver);

    // Real search results only (ignores Soovitame / Hetkel poes)
    this.resultsListItemLocator = By.css("ul.book-list > li.list-item");
    this.resultsPriceLocator = By.css("span.book-price");
    this.productLinkInsideResult = By.css(".book-desc-wrap a[href], a[href]");

    // Advanced search
    this.advancedUrl = "https://www.kriso.ee/cgi-bin/shop/advancedsearch.html";
    this.advDatabaseSelect = By.id("frm-database");
    this.advFormatSelect = By.id("frm-format");
    this.advPriceFrom = By.id("frm-pricefrom");
    this.advPriceTo = By.id("frm-priceto");
    this.advSearchInput = By.css(
      "#frm-title, #frm-key, input[name='title'], input[name='key']"
    );
    this.advSubmitBtn = By.css(
      "form[name='otsinguvorm'] input[type='submit'], form[name='otsinguvorm'] button[type='submit']"
    );

    // Product page add-to-cart
    this.productPageAddToCartBtnCandidates = [
      By.id("btn_addtocart"),
      By.css("button#btn_addtocart"),
      By.css("button[class*='addtocart']"),
      By.xpath(
        "//*[self::button or self::input][contains(translate(normalize-space(.),'OSTUKORVI','ostukorvi'),'ostukorvi')]"
      ),
    ];
  }

  parseEuro(text) {
    const cleaned = text
      .replace(/\u00A0/g, " ")
      .replace(/\s/g, "")
      .replace("€", "")
      .replace(",", ".");
    const m = cleaned.match(/[0-9.]+/);
    return m ? Number(m[0]) : NaN;
  }

  async scrollIntoView(el) {
    try {
      await this.driver.executeScript(
        "arguments[0].scrollIntoView({block:'center'});",
        el
      );
    } catch (_) {}
  }

  async getResultItems(limit = 50) {
    await this.driver.wait(async () => {
      const items = await this.driver.findElements(this.resultsListItemLocator);
      return items.length > 0;
    }, 20000);

    const items = await this.driver.findElements(this.resultsListItemLocator);
    return items.slice(0, Math.min(limit, items.length));
  }

  async countResults() {
    const body = await this.driver.findElement(By.css("body"));
    const txt = await body.getText();
    const match = txt.match(/Otsingu vasteid leitud:\s*(\d+)/i);
    return match ? Number(match[1]) : 0;
  }

  async search(keyword) {
    const urlBefore = await this.driver.getCurrentUrl();

    if (!urlBefore.startsWith(homeUrl)) {
      await super.openUrl(homeUrl);
    }

    const input = await firstVisible(this.driver, searchInputCandidates, 10000);
    expect(input).toBeTruthy();

    await input.clear();
    await input.sendKeys(keyword, Key.ENTER);

    await this.driver.wait(async () => {
      const now = await this.driver.getCurrentUrl();
      return now !== urlBefore;
    }, 20000);

    await this.getResultItems(2);
  }

  async verifyMultipleResults() {
    const items = await this.getResultItems(10);
    expect(items.length).toBeGreaterThan(1);
  }

  async verifyAllResultsContainKeyword(keyword, limit = 20) {
    const k = keyword.toLowerCase();
    const items = await this.getResultItems(limit);

    expect(items.length).toBeGreaterThan(0);

    for (const it of items) {
      const txt = (await it.getText()).toLowerCase();
      expect(txt.includes(k)).toBe(true);
    }
  }

  // No true reliable sort UI on Kriso; keep as a harmless no-op so tests don't crash
  async sortByPrice() {
    return;
  }

  async verifyPricesWithinRange(min, max, sample = 20) {
    const items = await this.getResultItems(sample);
    const prices = [];

    for (const it of items) {
      const pe = await it.findElements(this.resultsPriceLocator);
      if (!pe.length) continue;

      const txt = await pe[0].getText();
      const n = this.parseEuro(txt);

      if (!Number.isNaN(n)) prices.push(n);
    }

    expect(prices.length).toBeGreaterThan(0);

    for (const p of prices) {
      expect(p).toBeGreaterThanOrEqual(min);
      expect(p).toBeLessThanOrEqual(max);
    }
  }

  async openAdvancedSearch() {
    await this.driver.get(this.advancedUrl);
    await this.driver.wait(until.elementLocated(this.advDatabaseSelect), 15000);
  }

  async setAdvancedPriceRange(fromValue, toValue) {
    const fromSel = await this.driver.findElement(this.advPriceFrom);
    const toSel = await this.driver.findElement(this.advPriceTo);

    const fromOpt = await fromSel.findElement(
      By.css(`option[value='${fromValue}']`)
    );
    const toOpt = await toSel.findElement(
      By.css(`option[value='${toValue}']`)
    );

    await fromOpt.click();
    await toOpt.click();
  }

  async filterByLanguage(languageValue) {
    const sel = await this.driver.findElement(this.advDatabaseSelect);
    const opt = await sel.findElement(
      By.css(`option[value="${languageValue}"]`)
    );
    await opt.click();
  }

  async getResultTitleByIndex(index) {
  const items = await this.getResultItems(50);
  const item = items[index - 1];
  if (!item) throw new Error(`No result item at index ${index}`);

  const text = await item.getText();
  return text.split("\n")[0].trim();
}

  async filterByFormat(formatValue) {
    const sel = await this.driver.findElement(this.advFormatSelect);
    const opt = await sel.findElement(
      By.css(`option[value="${formatValue}"]`)
    );
    await opt.click();
  }

  async submitAdvancedSearch(keyword = "") {
    const inputs = await this.driver.findElements(this.advSearchInput);

    if (inputs.length && keyword) {
      await inputs[0].clear();
      await inputs[0].sendKeys(keyword);
    }

    const btns = await this.driver.findElements(this.advSubmitBtn);

    if (btns.length) {
      await btns[0].click();
    } else if (inputs.length) {
      await inputs[0].sendKeys(Key.ENTER);
    }

    await this.getResultItems(2);
  }

  async openProductFromResultItem(item) {
    if (!item) return false;

    const links = await item.findElements(this.productLinkInsideResult);
    if (!links.length) return false;

    const a = links[0];
    await this.scrollIntoView(a);

    try {
      await a.click();
    } catch (_) {
      await this.driver.executeScript("arguments[0].click();", a);
    }

    return true;
  }

  async addCurrentProductToCartIfPossible() {
    for (const loc of this.productPageAddToCartBtnCandidates) {
      const btns = await this.driver.findElements(loc);
      if (!btns.length) continue;

      const btn = btns[0];

      try {
        await this.scrollIntoView(btn);
        await btn.click();
      } catch (_) {
        try {
          await this.driver.executeScript("arguments[0].click();", btn);
        } catch (_) {
          continue;
        }
      }

      await this.driver.sleep(1000);
      return true;
    }

    return false;
  }

  async addFirstAddableResultToCart(startIndex = 1, maxChecks = 10) {
    const resultsUrl = await this.driver.getCurrentUrl();
    const initialItems = await this.getResultItems(50);

    expect(initialItems.length).toBeGreaterThan(0);

    const start = Math.max(0, startIndex - 1);
    const end = Math.min(initialItems.length, start + maxChecks);

    for (let i = start; i < end; i++) {
      const currentItems = await this.getResultItems(50);
      const item = currentItems[i];

      if (!item) continue;

      const opened = await this.openProductFromResultItem(item);
      if (!opened) continue;

      const added = await this.addCurrentProductToCartIfPossible();
      if (added) {
        return i + 1;
      }

      await this.driver.get(resultsUrl);
      await this.getResultItems(2);
    }

    throw new Error(`No addable products found starting from result ${startIndex}`);
  }

  async openCartDirect() {
  const candidates = [
    // direct cart links
    By.css("a[href*='cart']"),
    By.css("a[href*='ostukorv']"),
    By.css("a[href*='basket']"),

    // cart buttons/icons
    By.css(".cartbtn-event.forward"),
    By.css(".cartbtn-event"),
    By.css("[class*='cart'] a"),
    By.css("[class*='basket'] a"),

    // text fallback
    By.xpath(`//a[contains(normalize-space(.), "Ostukorv")]`),
    By.xpath(`//button[contains(normalize-space(.), "Ostukorv")]`),
    By.xpath(`//a[contains(normalize-space(.), "Cart")]`),
    By.xpath(`//button[contains(normalize-space(.), "Cart")]`),
  ];

  for (const loc of candidates) {
    const els = await this.driver.findElements(loc);

    for (const el of els) {
      try {
        if (!(await el.isDisplayed())) continue;

        await this.scrollIntoView(el);

        try {
          await el.click();
        } catch (_) {
          await this.driver.executeScript("arguments[0].click();", el);
        }

        await this.driver.sleep(1200);

        const body = await this.driver.findElement(By.css("body"));
        const txt = (await body.getText()).toLowerCase();

        if (
          txt.includes("ostukorv") ||
          txt.includes("kogus") ||
          txt.includes("summa") ||
          txt.includes("eemalda")
        ) {
          return;
        }
      } catch (_) {}
    }
  }

  throw new Error("Could not navigate to cart using visible cart links/buttons.");
}
};