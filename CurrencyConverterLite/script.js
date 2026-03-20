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
    const parsed = parseInput(text);

    if (!parsed || parsed.amount === null) {
        SwiftBiu.showNotification("Error", "Could not find a valid number in selection.");
        return;
    }

    if (parsed.isUnsupported) {
        SwiftBiu.showNotification("Error", `Unsupported currency: ${parsed.from}`);
        return;
    }

    const { amount, from: currency } = parsed;

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
    if (!text) return null;

    // 1. Extract amount
    // Match numbers (including decimals and commas)
    const numberMatch = text.match(/[\d,]+\.?\d*/);
    let amount = null;
    if (numberMatch) {
        const cleanNum = numberMatch[0].replace(/,/g, '');
        const val = parseFloat(cleanNum);
        if (!isNaN(val)) {
            amount = val;
        }
    }

    // 2. Extract currency
    let detectedCurrency = null;
    let isUnsupported = false;
    const upperText = text.toUpperCase();

    // Symbols mapping
    const symbols = {
        '￥': 'CNY',
        '¥': 'CNY',
        '$': 'USD',
        '€': 'EUR',
        '£': 'GBP',
        '₩': 'KRW',
        '₽': 'RUB',
        '₹': 'INR',
        '฿': 'THB',
        '₫': 'VND',
        'R$': 'BRL',
        '₪': 'ILS',
        'Rp': 'IDR',
        'RM': 'MYR'
    };

    for (const [symbol, code] of Object.entries(symbols)) {
        if (text.includes(symbol)) {
            detectedCurrency = code;
            break;
        }
    }

    const supportedCurrencies = [
        'AUD', 'BRL', 'CAD', 'CHF', 'CNY', 'CZK', 'DKK', 'EUR', 'GBP', 'HKD',
        'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY', 'KRW', 'MXN', 'MYR', 'NOK',
        'NZD', 'PHP', 'PLN', 'RON', 'SEK', 'SGD', 'THB', 'TRY', 'USD', 'ZAR'
    ];

    if (!detectedCurrency) {
        // Try to find any 3-letter word that looks like a currency code
        const potentialCodes = upperText.match(/[A-Z]{3}/g) || [];
        for (const code of potentialCodes) {
            if (supportedCurrencies.includes(code)) {
                detectedCurrency = code;
                isUnsupported = false;
                break;
            } else {
                // Avoid common 3-letter words that aren't currencies
                const ignoreWords = ['THE', 'AND', 'FOR', 'ANY', 'ALL', 'NOT', 'BUT', 'YOU', 'OUR', 'ARE'];
                if (!ignoreWords.includes(code)) {
                    detectedCurrency = code;
                    isUnsupported = true;
                    // Keep looking for a supported one in case there are multiple codes
                }
            }
        }
    }

    return { 
        amount, 
        from: detectedCurrency,
        isUnsupported: isUnsupported
    };
}