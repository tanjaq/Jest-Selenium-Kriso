
---

# Test Scenarios

## 🔍 Search for Books

The following behaviours are tested:

- Opening the homepage
- Verifying the site logo
- Searching for books using the keyword **"harry potter"**
- Verifying that multiple search results appear
- Confirming search results contain the keyword
- Filtering results by:
  - **Language (English)**
  - **Format (Kõvakaaneline / Hardback)**
- Applying **price filtering through Advanced Search**

---

## 🛒 Shopping Cart

Cart workflow tests include:

- Adding books from search results
- Verifying the cart contains **2 items**
- Verifying the **correct books appear in the cart**
- Verifying the **total price is calculated**
- Removing an item from the cart
- Confirming the cart updates to **1 remaining item**
- Confirming the total price updates after removal

---

## 🧭 Category Navigation

Navigation tests verify:

- Opening the category menu
- Navigating to **Muusikaraamatud ja noodid**
- Selecting subcategories
- Verifying product counts change after filters
- Confirming the URL reflects navigation state

---

# Important Implementation Notes

## Price Sorting

The assignment required verifying **sorting by price (low → high or high → low)**.

However, the current Kriso.ee interface does **not expose a reliable sorting control** for price ordering in search results.

Instead, the test suite validates **price-based filtering using the Advanced Search page**, confirming that:

- result counts decrease when a price range is applied
- returned items fall within the selected price range

This approach tests the closest available price-related functionality.

---

## Category Adjustment

The assignment example referenced categories such as **"Bänd ja ansambel"**.

During implementation it was found that some categories vary or are dynamically rendered in the menu structure.  
The navigation test therefore targets **available and stable categories within the same menu section** to ensure reliable automation.

---

# Running the Tests

Install dependencies:
npm install

Run the test suite:
npm test

The tests run sequentially using:
jest --runInBand --detectOpenHandles --verbose
---

# Test Results

The final test suite covers:

- Search functionality
- Product filtering
- Cart functionality
- Category navigation

All implemented tests pass successfully.