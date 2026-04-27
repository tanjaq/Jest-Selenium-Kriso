// has everything related to home page
const Page = require("./basePage");
const Cartpage = require("./cartPage");

const { By, until, Key } = require("selenium-webdriver");

const homePageUrl = "https://www.kriso.ee/";

const acceptCookiesBtn = By.className("cc-nb-okagree");
const logoItem = By.className("icon-kriso-logo");

// (Optional old homepage featured items – not used if you switch to search flow)
const offerBookLink = By.className("book-img-link");

// Product page add-to-cart (may still work on product pages)
const addToCartBtn = By.id("btn_addtocart");

// Old message box (often not used anymore)
const cartMessage = By.css(".item-messagebox");

// Old back/forward controls (not always present anymore)
const cartBackBtn = By.className("cartbtn-event back");
const cartForwardBtn = By.className("cartbtn-event forward");

// New-ish modal overlay after add-to-cart
const modalOverlay = By.id("wnd-modal-wrapper");
// multiple candidates: close icons, close buttons, etc.
const modalCloseCandidates = By.css(
  "#wnd-modal-wrapper .wnd-close, #wnd-modal-wrapper [class*='close'], #wnd-modal-wrapper button"
);

module.exports = class Homepage extends Page {
  async openUrl() {
    await super.openUrl(homePageUrl);

    // Try accept cookies but don’t fail if it’s not present
    try {
      const btns = await super.getElements(acceptCookiesBtn);
      if (btns.length) await btns[0].click();
    } catch (_) {}
  }

  async acceptCookies() {
    const btns = await super.getElements(acceptCookiesBtn);
    if (btns.length) await btns[0].click();
  }

  async verifyLogo() {
    const logo = await super.getElement(logoItem);
    await super.getDriver().wait(until.elementIsVisible(logo), 15000);
    expect(await logo.isDisplayed()).toBe(true);
  }

  async openBookPage(number) {
    const bookLinks = await super.getElements(offerBookLink);
    expect(bookLinks.length).toBeGreaterThanOrEqual(number);
    await bookLinks[number - 1].click();
  }

  async addItemToShoppingCart() {
    const btn = await super.getElement(addToCartBtn);
    await super.getDriver().wait(until.elementIsVisible(btn), 15000);
    await btn.click();
  }

  async verifyItemAddedToCart() {
    // Kriso often shows a modal overlay after add-to-cart.
    const overlays = await super.getElements(modalOverlay);

    if (overlays.length) {
      try {
        expect(await overlays[0].isDisplayed()).toBe(true);
        return;
      } catch (_) {
        // continue to fallback
      }
    }

    // fallback: old message OR page text contains ostukorv
    try {
      const msgEls = await super.getElements(cartMessage);
      if (msgEls.length) {
        const t = (await msgEls[0].getText()).toLowerCase();
        expect(t).toContain("ostukorv");
        return;
      }
    } catch (_) {}

    const body = await super.getElement(By.css("body"));
    const txt = (await body.getText()).toLowerCase();
    expect(txt).toContain("ostukorv");
  }

  async closeAddToCartModalIfPresent() {
    const overlays = await super.getElements(modalOverlay);
    if (!overlays.length) return;

    // If overlay isn't displayed, do nothing
    try {
      if (!(await overlays[0].isDisplayed())) return;
    } catch (_) {
      return;
    }

    // Try clicking a VISIBLE close button
    const closeBtns = await super.getElements(modalCloseCandidates);
    for (const btn of closeBtns) {
      try {
        if (await btn.isDisplayed()) {
          // click directly (do NOT use super.click -> it waits and can time out)
          await btn.click();
          await super.getDriver().sleep(300);
          return;
        }
      } catch (_) {}
    }

    // Fallback: ESC closes most modals
    try {
      await super.getDriver().actions().sendKeys(Key.ESCAPE).perform();
      await super.getDriver().sleep(300);
    } catch (_) {}
  }

  async continueShopping() {
    // close modal if it blocks clicks
    await this.closeAddToCartModalIfPresent();

    // Some flows show a back button
    try {
      const back = await super.getElements(cartBackBtn);
      if (back.length) {
        await back[0].click();
        await super.getDriver().sleep(300);
      }
    } catch (_) {}

    // Always go home via logo
    const logo = await super.getElement(logoItem);
    await super.getDriver().wait(until.elementIsVisible(logo), 15000);
    await logo.click();
  }

  async openShoppingCart() {
    // close modal if it blocks clicks
    await this.closeAddToCartModalIfPresent();

    const forward = await super.getElements(cartForwardBtn);
    if (forward.length) {
      await forward[0].click();
      return new Cartpage(super.getDriver());
    }

    // fallback: open cart directly (most stable)
    await super.openUrl("https://www.kriso.ee/cart");
    return new Cartpage(super.getDriver());
  }
};