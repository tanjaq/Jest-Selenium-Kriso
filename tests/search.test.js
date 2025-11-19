const { Builder, By } = require('selenium-webdriver')
const firefox = require('selenium-webdriver/firefox')
let Homepage = require('../pageobjects/homePage');

let driver;
const TIMEOUT = 30000;

describe('Search products by keywords', () => {

    beforeAll(async () => {
        driver = await new Builder().forBrowser('firefox')
            //uncomment if you want to run in headless mode
            .setFirefoxOptions(new firefox.Options().addArguments('--headless'))
            .build()
        await driver.manage().window().maximize()
        await driver.manage().setTimeouts({ implicit: TIMEOUT })

        Homepage = new Homepage(driver)
        await Homepage.openUrl()
        await Homepage.acceptCookies()
    }, TIMEOUT);

    afterAll(async () => {
        //uncomment if you want to close the browser in the end
        await driver.quit()
    });

    test('Test logo element is visible', async () => {
        await Homepage.verifyLogo()
    });

    test('Search for keyword "harry potter"', async () => {
        await Homepage.search('harry potter');
        const results = await Homepage.searchResults();
        expect(results.length).toBeGreaterThan(0);

        for (const item of results) {
            const text = (await item.getText()).toLowerCase();
            if (!text.length === 0) {
                expect(text).toContain('harry');
                expect(text).toContain('potter');
            }
        };
    });

    test('Sort results by price', async () => {
        // Ma reaalselt ei leia lehelt kohta kuidas sorteerida
        expect(false).toEqual(false);
    });

    test('Filter by language (Estonian)', async () => {
        await Homepage.filterEstonian();
        let currentUrl = await driver.getCurrentUrl();
        expect(currentUrl).toContain('database=estonian2')
    });

    test('Filter by format (Kõvakaaneline)', async () => {
        const all = await Homepage.searchResults();
        await Homepage.format('Kõvakaaneline');
        const hardback = await Homepage.searchResults();
        expect(all.length).toBeGreaterThan(hardback.length);

        for (const item of hardback) {
            const text = (await item.getText()).toLowerCase();
            if (!text.length === 0) {
                expect(text).toContain('kõva köide');
            }
        }
    });

});