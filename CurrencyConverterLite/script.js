/**
 * Checks if the plugin is available for the current context.
 * @param {object} context - The context object containing selected text.
 * @returns {boolean} - True if text contains a number.
 */
function isAvailable(context) {
    // Check if there is selected text and if it contains a number
    const text = context.selectedText;
    if (!text || text.trim().length === 0) {
        return { isAvailable: false, isContextMatch: false };
    }

    // Simple regex to check for numbers
    const hasNumber = /\d/.test(text);

    return {
        isAvailable: true,
        isContextMatch: hasNumber
    };
}

/**
 * Performs the currency conversion action.
 * @param {object} context - The context object containing selected text.
 */
function performAction(context) {
    const text = context.selectedText.trim();

    // 1. Parse Input
    const { amount, currency } = parseInput(text);

    if (amount === null) {
        SwiftBiu.showNotification("Error", "Could not find a valid number in selection.");
        return;
    }

    // 2. Determine Source and Target Currencies
    const configTarget = SwiftBiu.getConfig("targetCurrency") || "CNY";
    const configFrom = SwiftBiu.getConfig("fromCurrency") || "USD";
    const includeSymbolConfig = SwiftBiu.getConfig("includeCurrencySymbol");
    const showRateConfig = SwiftBiu.getConfig("showExchangeRate");

    // Defaults to false if config is missing or not 'true'
    const includeCurrencySymbol = includeSymbolConfig === 'true' || includeSymbolConfig === true;
    const showExchangeRate = showRateConfig === 'true' || showRateConfig === true;
    let fromCurrency = currency || configFrom;
    let toCurrency = configTarget;

    // Smart switching: if source is same as target, switch target to USD (or CNY if source was USD)
    // if (fromCurrency === toCurrency) {
    //     if (fromCurrency === "CNY") toCurrency = "USD";
    //     else toCurrency = "CNY";
    // }

    console.log(`Converting ${amount} ${fromCurrency} to ${toCurrency}`);

    // 3. Fetch Rates
    SwiftBiu.showLoadingIndicator(context.screenPosition);

    // Frankfurter API allows amount conversion directly
    const apiUrl = `https://api.frankfurter.app/latest?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`;

    SwiftBiu.fetch(apiUrl, { method: "GET" },
        (response) => {
            SwiftBiu.hideLoadingIndicator();
            if (response.status === 200) {
                try {
                    console.log("Raw response data:", response.data);

                    let data;
                    if (typeof response.data === 'object') {
                        data = response.data;
                    } else if (typeof response.data === 'string') {
                        data = JSON.parse(response.data);
                    } else {
                        throw new Error("Unknown response data type");
                    }

                    const result = data.rates && data.rates[toCurrency];

                    if (result) {
                        // Format result
                        const formatter = new Intl.NumberFormat('en-US', {
                            style: 'decimal',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        });
                        const formattedResult = formatter.format(result);

                        // Copy, Paste and Notify
                        const resultText = includeCurrencySymbol ? `${formattedResult} ${toCurrency}` : formattedResult;
                        SwiftBiu.pasteText(resultText);

                        const notificationTitle = resultText;

                        let notificationSubtitle;
                        if (showExchangeRate) {
                            const baseRate = result / amount;
                            const rateFormatter = new Intl.NumberFormat('en-US', {
                                style: 'decimal',
                                minimumFractionDigits: 4,
                                maximumFractionDigits: 4
                            });
                            const formattedBaseRate = rateFormatter.format(baseRate);
                            notificationSubtitle = `1 ${fromCurrency} ≈ ${formattedBaseRate} ${toCurrency}`;
                        }

                        SwiftBiu.showNotification(
                            notificationTitle,
                            notificationSubtitle
                        );
                    } else {
                        SwiftBiu.showNotification("Error", "Currency pair not supported.");
                    }
                } catch (e) {
                    console.error("Parse error", e);
                    const preview = typeof response.data === 'string' ? response.data.substring(0, 50) : "Object";
                    SwiftBiu.showNotification("Error", `Parse failed: ${e.message}. Data: ${preview}`);
                }
            } else {
                SwiftBiu.showNotification("Error", `API Error: Status ${response.status}`);
            }
        },
        (error) => {
            SwiftBiu.hideLoadingIndicator();
            console.error("Network error", error);
            SwiftBiu.showNotification("Error", "Network request failed.");
        }
    );
}

function parseInput(text) {
    // Try to find a number
    // Remove commas
    const cleanText = text.replace(/,/g, '');
    const numberMatch = cleanText.match(/[\d]+\.?\d*/);

    let amount = null;
    if (numberMatch) {
        amount = parseFloat(numberMatch[0]);
    }

    // Try to find currency codes
    const commonCurrencies = ["AUD", "BGN", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP", "HKD", "HUF", "IDR", "ILS", "INR", "ISK", "JPY", "KRW", "MXN", "MYR", "NOK", "NZD", "PHP", "PLN", "RON", "SEK", "SGD", "THB", "TRY", "USD", "ZAR"];
    const upperText = text.toUpperCase();
    let currency = null;

    for (const code of commonCurrencies) {
        if (upperText.includes(code)) {
            currency = code;
            break;
        }
    }

    // Handle symbols if no code found
    if (!currency) {
        if (text.includes('$')) currency = 'USD';
        else if (text.includes('¥') || text.includes('￥')) currency = 'CNY';
        else if (text.includes('€')) currency = 'EUR';
        else if (text.includes('£')) currency = 'GBP';
    }

    return { amount, currency };
}