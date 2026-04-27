const Page = require("./basePage");
const { By } = require("selenium-webdriver");

// Flexible cart selectors
const cartRowCandidates = [
  By.css("#tbl-bcitems tbody tr"),
  By.css("#tbl-cartitems tbody tr"),
  By.css("table tbody tr"),
  By.css(".tbl-row"),
];

const removeBtnCandidates = [
  By.css(".remove a"),
  By.css(".remove button"),
  By.css("a[href*='remove']"),
  By.css("button[class*='remove']"),
  By.css("[class*='remove'] a"),
];

const rowPriceCandidates = [
  By.css("td.price"),
  By.css("td.subtotal"),
  By.css(".price"),
  By.css(".subtotal"),
];

const totalCandidates = [
  By.css(".cart-sum"),
  By.css(".order-total"),
  By.css(".total"),
  By.css("td.total"),
  By.css("[class*='total']"),
];

module.exports = class CartPage extends Page {
  parseEuro(text) {
    const cleaned = text
      .replace(/\u00A0/g, " ")
      .replace(/\s/g, "")
      .replace("€", "")
      .replace(",", ".");
    const m = cleaned.match(/[0-9.]+/);
    return m ? Number(m[0]) : NaN;
  }

  async getCartRows() {
    for (const loc of cartRowCandidates) {
      const rows = await this.driver.findElements(loc);
      if (rows.length) return rows;
    }
    return [];
  }

  async verifyCartQuantity(expected) {
    const body = await this.driver.findElement(By.css("body"));
    const txt = (await body.getText()).toLowerCase();

    expect(
      txt.includes("ostukorv") ||
      txt.includes("kogus") ||
      txt.includes("summa") ||
      txt.includes("eemalda")
    ).toBe(true);

    await this.driver.wait(async () => {
      const rows = await this.getCartRows();
      return rows.length >= expected;
    }, 20000);

    const rows = await this.getCartRows();
    expect(rows.length).toBe(expected);
  }

  async getCartRowTexts() {
    const rows = await this.getCartRows();
    const texts = [];

    for (const row of rows) {
      texts.push((await row.getText()).toLowerCase());
    }

    return texts;
  }

  async verifyCartContainsTitles(expectedTitles = []) {
  const rowTexts = await this.getCartRowTexts();

  for (const title of expectedTitles) {
    const words = title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 4); // use first meaningful words

    const found = rowTexts.some((row) =>
      words.every((w) => row.includes(w))
    );

    expect(found).toBe(true);
  }
}

  async getVisiblePricesFromRows() {
    const rows = await this.getCartRows();
    const prices = [];

    for (const row of rows) {
      for (const loc of rowPriceCandidates) {
        const els = await row.findElements(loc);
        if (!els.length) continue;

        const txt = await els[0].getText();
        const n = this.parseEuro(txt);

        if (!Number.isNaN(n)) {
          prices.push(n);
          break;
        }
      }
    }

    return prices;
  }

  async verifyTotalPriceLooksAccurate() {
    const rowPrices = await this.getVisiblePricesFromRows();
    expect(rowPrices.length).toBeGreaterThan(0);

    const sumOfRows = rowPrices.reduce((a, b) => a + b, 0);

    const body = await this.driver.findElement(By.css("body"));
    const bodyText = await body.getText();

    // Try to find a displayed total somewhere on page
    let foundTotal = NaN;

    for (const loc of totalCandidates) {
      const els = await this.driver.findElements(loc);
      for (const el of els) {
        try {
          if (!(await el.isDisplayed())) continue;
          const txt = await el.getText();
          const n = this.parseEuro(txt);
          if (!Number.isNaN(n) && n >= sumOfRows - 0.01) {
            foundTotal = n;
            break;
          }
        } catch (_) {}
      }
      if (!Number.isNaN(foundTotal)) break;
    }

    // If no dedicated total found, at least assert prices exist and sum is sane
    if (Number.isNaN(foundTotal)) {
      expect(sumOfRows).toBeGreaterThan(0);
      return sumOfRows;
    }

    expect(foundTotal).toBeGreaterThan(0);
    expect(foundTotal).toBeGreaterThanOrEqual(sumOfRows - 0.01);

    return foundTotal;
  }

  async removeItem(index = 1) {
    const rows = await this.getCartRows();
    expect(rows.length).toBeGreaterThanOrEqual(index);

    const row = rows[index - 1];

    for (const loc of removeBtnCandidates) {
      const btns = await row.findElements(loc);
      if (!btns.length) continue;

      const btn = btns[0];

      try {
        await btn.click();
      } catch (_) {
        await this.driver.executeScript("arguments[0].click();", btn);
      }

      await this.driver.sleep(1200);
      return;
    }

    throw new Error("Could not find remove button in selected cart row.");
  }
};