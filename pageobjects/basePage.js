// parent page for all the functions across the site
const { By, until } = require("selenium-webdriver");

const TIMEOUT = 15000;

module.exports = class Page {
  constructor(driver) {
    this.driver = driver;
  }

  getDriver() {
    return this.driver;
  }

  async openUrl(url) {
    return await this.driver.get(url);
  }

  async findAndClick(locator) {
    const el = await this.waitForLocated(locator);
    await this.waitForVisible(el);
    return await el.click();
  }

  async click(element) {
    await this.waitForVisible(element);
    return await element.click();
  }

  async clickByVisibleText(text, timeout = 20000) {
  const els = await this.driver.wait(async () => {
    const found = await this.driver.findElements(By.xpath(`//*[contains(normalize-space(.), "${text}")]`));
    const visible = [];
    for (const el of found) {
      try { if (await el.isDisplayed()) visible.push(el); } catch (_) {}
    }
    return visible.length ? visible : false;
  }, timeout);

  const el = els[0];
  await this.driver.executeScript("arguments[0].scrollIntoView({block:'center'});", el);
  await this.driver.wait(until.elementIsVisible(el), timeout);

  try { await el.click(); }
  catch (_) { await this.driver.executeScript("arguments[0].click();", el); }
}

  async getElement(locator) {
    return await this.driver.findElement(locator);
  }

  async getElements(locator) {
    return await this.driver.findElements(locator);
  }

  async getElementText(locator) {
    const el = await this.waitForLocated(locator);
    await this.waitForVisible(el);
    return await el.getText();
  }

  async waitUntilElementText(locator, text) {
    const element = await this.waitForLocated(locator);
    return this.driver.wait(until.elementTextIs(element, text), TIMEOUT);
  }

  async getElementFromInsideElement(element, locator) {
    return await element.findElement(locator);
  }


  async waitForLocated(locator, timeout = TIMEOUT) {
    return await this.driver.wait(until.elementLocated(locator), timeout);
  }

  async waitForVisible(element, timeout = TIMEOUT) {
    return await this.driver.wait(until.elementIsVisible(element), timeout);
  }

  async waitForLocatorVisible(locator, timeout = TIMEOUT) {
    const el = await this.waitForLocated(locator, timeout);
    await this.waitForVisible(el, timeout);
    return el;
  }

  async waitForClickable(locator, timeout = TIMEOUT) {
    const el = await this.waitForLocatorVisible(locator, timeout);
    await this.driver.wait(until.elementIsEnabled(el), timeout);
    return el;
  }

  async safeClick(locator, timeout = TIMEOUT) {
    const el = await this.waitForClickable(locator, timeout);
    return await el.click();
  }

  async clickByText(text, timeout = TIMEOUT) {
    const xpath = `//*[contains(normalize-space(.), "${text}")]`;
    const el = await this.waitForLocatorVisible(By.xpath(xpath), timeout);
    return await el.click();
  }

  async maybeAcceptCookies() {
    const candidates = ["Nõustu", "Nõustun", "Accept", "OK", "Sain aru"];
    for (const t of candidates) {
      try {
        const btns = await this.driver.findElements(
          By.xpath(`//button[contains(normalize-space(.), "${t}")]`)
        );
        if (btns.length) {
          await btns[0].click();
          return true;
        }
      } catch (_) {}
    }
    return false;
  }

  async scrollIntoView(locator) {
    const el = await this.waitForLocated(locator);
    await this.driver.executeScript("arguments[0].scrollIntoView({block: 'center'});", el);
    return el;
  }
};