const { until } = require("selenium-webdriver");

async function waitVisible(driver, el, timeout = 15000) {
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
}

async function waitLocated(driver, locator, timeout = 15000) {
  const el = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  return el;
}

async function waitUrlContains(driver, part, timeout = 15000) {
  await driver.wait(async () => (await driver.getCurrentUrl()).includes(part), timeout);
}

module.exports = { waitVisible, waitLocated, waitUrlContains };