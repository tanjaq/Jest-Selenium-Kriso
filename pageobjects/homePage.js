// has everything related to home page
const Page = require('./basePage')
const Cartpage = require('./cartPage')

const { By } = require('selenium-webdriver')

// move all the cliks and element locators here
const homePageUrl = 'https://www.kriso.ee/'

const acceptCookiesBtn = By.className('cc-nb-okagree')
const logoItem = By.className('icon-kriso-logo')
const offerBookLink = By.className('book-img-link')
const addToCartBtn = By.id('btn_addtocart')
const cartMessage = By.css('.item-messagebox')
const cartBackBtn = By.className('cartbtn-event back')
const cartForwardBtn = By.className('cartbtn-event forward')
const search = By.id('top-search-text');
const searchBtn = By.className('btn-search');
const product = By.className('product');
const langSelect = By.className('sel-cat');
const estonian = By.css('option[value="estonian2"]')
const format = By.css('a[href*="format=2"]')
const musicItem = By.css('a[href*="muusika-ja-noodid"]')
const oppematerjalidCategory = By.css('a[title*="Õppematerjalid"]')
const cdFormat = By.css('a[href*="format=CD"]')
const activeFilters = By.className('srcfilter')


module.exports = class Homepage extends Page {

    async openUrl() {
        await super.openUrl(homePageUrl)
    }

    async acceptCookies() {
        await super.findAndClick(acceptCookiesBtn)
    }

    async verifyLogo() {
        const logo = await super.getElement(logoItem)
        expect(logo).toBeDefined()
    }

    async openBookPage(number) {
        const bookLinks = await super.getElements(offerBookLink)
        await super.click(bookLinks[number - 1])
    }

    async addItemToShoppingCart() {
        await super.findAndClick(addToCartBtn)
    }

    async verifyItemAddedToCart() {
        await super.waitUntilElementText(cartMessage, 'Toode lisati ostukorvi')
    }

    async continueShopping() {
        await super.findAndClick(cartBackBtn)
        await super.findAndClick(logoItem)
    }

    async openShoppingCart() {
        await super.findAndClick(cartForwardBtn)
        return new Cartpage(super.getDriver())
    }

    async search(term) {
        const input = await super.getElement(search);
        await input.sendKeys(term);
        await super.findAndClick(searchBtn);
    }

    async searchResults() {
        return await super.getElements(product)
    }

    async filterEstonian() {
        await super.findAndClick(langSelect);
        await super.findAndClick(estonian);
        await super.findAndClick(searchBtn);
    }

    async format() {
        await super.findAndClick(format)
    }

    async verifyMusic() {
        const music = await super.getElement(musicItem)
        expect(music).toBeDefined()
    }

    async clickMusicSection() {
        await super.findAndClick(musicItem)
    }

    async clickOppematerjalid() {
        await super.findAndClick(oppematerjalidCategory)
    }

    async clickCDFormat() {
        await super.findAndClick(cdFormat)
    }

    async getActiveFilters() {
        return await super.getElements(activeFilters)
    }

    async getCurrentUrl() {
        return await this.driver.getCurrentUrl()
    }
}