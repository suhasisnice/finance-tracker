/**
 * Currency configuration — sorted A→Z by country name.
 * All amounts are stored in INR on the backend.
 * Rates are approximate mid-market as of mid-2025 (1 INR → X foreign).
 */

export const CURRENCIES = [
  { code: "AFN", symbol: "؋",   name: "Afghan Afghani",          country: "Afghanistan",           rate: 0.85    },
  { code: "ALL", symbol: "L",   name: "Albanian Lek",             country: "Albania",               rate: 1.11    },
  { code: "DZD", symbol: "د.ج", name: "Algerian Dinar",           country: "Algeria",               rate: 1.62    },
  { code: "AOA", symbol: "Kz",  name: "Angolan Kwanza",           country: "Angola",                rate: 10.3    },
  { code: "ARS", symbol: "$",   name: "Argentine Peso",           country: "Argentina",             rate: 12.1    },
  { code: "AMD", symbol: "֏",   name: "Armenian Dram",            country: "Armenia",               rate: 4.68    },
  { code: "AUD", symbol: "A$",  name: "Australian Dollar",        country: "Australia",             rate: 0.018   },
  { code: "AZN", symbol: "₼",   name: "Azerbaijani Manat",        country: "Azerbaijan",            rate: 0.020   },
  { code: "BHD", symbol: ".د.ب",name: "Bahraini Dinar",           country: "Bahrain",               rate: 0.0045  },
  { code: "BDT", symbol: "৳",   name: "Bangladeshi Taka",         country: "Bangladesh",            rate: 1.32    },
  { code: "BYN", symbol: "Br",  name: "Belarusian Ruble",         country: "Belarus",               rate: 0.039   },
  { code: "BZD", symbol: "BZ$", name: "Belize Dollar",            country: "Belize",                rate: 0.024   },
  { code: "BOB", symbol: "Bs.", name: "Bolivian Boliviano",        country: "Bolivia",               rate: 0.083   },
  { code: "BAM", symbol: "KM",  name: "Bosnia-Herzegovina Mark",  country: "Bosnia & Herzegovina",  rate: 0.022   },
  { code: "BWP", symbol: "P",   name: "Botswana Pula",            country: "Botswana",              rate: 0.16    },
  { code: "BRL", symbol: "R$",  name: "Brazilian Real",           country: "Brazil",                rate: 0.071   },
  { code: "BND", symbol: "B$",  name: "Brunei Dollar",            country: "Brunei",                rate: 0.016   },
  { code: "BGN", symbol: "лв",  name: "Bulgarian Lev",            country: "Bulgaria",              rate: 0.022   },
  { code: "KHR", symbol: "៛",   name: "Cambodian Riel",           country: "Cambodia",              rate: 48.6    },
  { code: "CAD", symbol: "C$",  name: "Canadian Dollar",          country: "Canada",                rate: 0.016   },
  { code: "CLP", symbol: "$",   name: "Chilean Peso",             country: "Chile",                 rate: 11.4    },
  { code: "CNY", symbol: "¥",   name: "Chinese Yuan",             country: "China",                 rate: 0.087   },
  { code: "COP", symbol: "$",   name: "Colombian Peso",           country: "Colombia",              rate: 49.5    },
  { code: "CRC", symbol: "₡",   name: "Costa Rican Colón",        country: "Costa Rica",            rate: 6.25    },
  { code: "HRK", symbol: "kn",  name: "Croatian Kuna",            country: "Croatia",               rate: 0.085   },
  { code: "CZK", symbol: "Kč",  name: "Czech Koruna",             country: "Czech Republic",        rate: 0.28    },
  { code: "DKK", symbol: "kr",  name: "Danish Krone",             country: "Denmark",               rate: 0.084   },
  { code: "DOP", symbol: "RD$", name: "Dominican Peso",           country: "Dominican Republic",    rate: 0.71    },
  { code: "EGP", symbol: "£",   name: "Egyptian Pound",           country: "Egypt",                 rate: 0.59    },
  { code: "ETB", symbol: "Br",  name: "Ethiopian Birr",           country: "Ethiopia",              rate: 1.46    },
  { code: "EUR", symbol: "€",   name: "Euro",                     country: "Eurozone",              rate: 0.011   },
  { code: "FJD", symbol: "FJ$", name: "Fijian Dollar",            country: "Fiji",                  rate: 0.027   },
  { code: "GEL", symbol: "₾",   name: "Georgian Lari",            country: "Georgia",               rate: 0.032   },
  { code: "GHS", symbol: "GH₵", name: "Ghanaian Cedi",            country: "Ghana",                 rate: 0.18    },
  { code: "GTQ", symbol: "Q",   name: "Guatemalan Quetzal",       country: "Guatemala",             rate: 0.093   },
  { code: "GNF", symbol: "FG",  name: "Guinean Franc",            country: "Guinea",                rate: 104.0   },
  { code: "HNL", symbol: "L",   name: "Honduran Lempira",         country: "Honduras",              rate: 0.30    },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar",         country: "Hong Kong",             rate: 0.094   },
  { code: "HUF", symbol: "Ft",  name: "Hungarian Forint",         country: "Hungary",               rate: 4.38    },
  { code: "ISK", symbol: "kr",  name: "Icelandic Króna",          country: "Iceland",               rate: 1.64    },
  { code: "INR", symbol: "₹",   name: "Indian Rupee",             country: "India",                 rate: 1       },
  { code: "IDR", symbol: "Rp",  name: "Indonesian Rupiah",        country: "Indonesia",             rate: 196.0   },
  { code: "IRR", symbol: "﷼",   name: "Iranian Rial",             country: "Iran",                  rate: 506.0   },
  { code: "IQD", symbol: "ع.د", name: "Iraqi Dinar",              country: "Iraq",                  rate: 15.7    },
  { code: "ILS", symbol: "₪",   name: "Israeli Shekel",           country: "Israel",                rate: 0.044   },
  { code: "JMD", symbol: "J$",  name: "Jamaican Dollar",          country: "Jamaica",               rate: 1.88    },
  { code: "JPY", symbol: "¥",   name: "Japanese Yen",             country: "Japan",                 rate: 1.79    },
  { code: "JOD", symbol: "JD",  name: "Jordanian Dinar",          country: "Jordan",                rate: 0.0085  },
  { code: "KZT", symbol: "₸",   name: "Kazakhstani Tenge",        country: "Kazakhstan",            rate: 5.86    },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling",          country: "Kenya",                 rate: 1.55    },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar",            country: "Kuwait",                rate: 0.0037  },
  { code: "KGS", symbol: "с",   name: "Kyrgyzstani Som",          country: "Kyrgyzstan",            rate: 1.02    },
  { code: "LAK", symbol: "₭",   name: "Lao Kip",                  country: "Laos",                  rate: 262.0   },
  { code: "LBP", symbol: "£",   name: "Lebanese Pound",           country: "Lebanon",               rate: 1080.0  },
  { code: "LYD", symbol: "ل.د", name: "Libyan Dinar",             country: "Libya",                 rate: 0.059   },
  { code: "MOP", symbol: "P",   name: "Macanese Pataca",          country: "Macau",                 rate: 0.097   },
  { code: "MKD", symbol: "ден", name: "Macedonian Denar",         country: "North Macedonia",       rate: 0.69    },
  { code: "MYR", symbol: "RM",  name: "Malaysian Ringgit",        country: "Malaysia",              rate: 0.055   },
  { code: "MVR", symbol: "Rf",  name: "Maldivian Rufiyaa",        country: "Maldives",              rate: 0.185   },
  { code: "MXN", symbol: "$",   name: "Mexican Peso",             country: "Mexico",                rate: 0.24    },
  { code: "MDL", symbol: "L",   name: "Moldovan Leu",             country: "Moldova",               rate: 0.21    },
  { code: "MNT", symbol: "₮",   name: "Mongolian Tögrög",         country: "Mongolia",              rate: 41.3    },
  { code: "MAD", symbol: "د.م.", name: "Moroccan Dirham",          country: "Morocco",               rate: 0.12    },
  { code: "MZN", symbol: "MT",  name: "Mozambican Metical",       country: "Mozambique",            rate: 0.77    },
  { code: "MMK", symbol: "K",   name: "Myanmar Kyat",             country: "Myanmar",               rate: 25.2    },
  { code: "NAD", symbol: "N$",  name: "Namibian Dollar",          country: "Namibia",               rate: 0.22    },
  { code: "NPR", symbol: "₨",   name: "Nepali Rupee",             country: "Nepal",                 rate: 1.60    },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar",       country: "New Zealand",           rate: 0.020   },
  { code: "NIO", symbol: "C$",  name: "Nicaraguan Córdoba",       country: "Nicaragua",             rate: 0.44    },
  { code: "NGN", symbol: "₦",   name: "Nigerian Naira",           country: "Nigeria",               rate: 18.5    },
  { code: "NOK", symbol: "kr",  name: "Norwegian Krone",          country: "Norway",                rate: 0.13    },
  { code: "OMR", symbol: "ر.ع.",name: "Omani Rial",               country: "Oman",                  rate: 0.0046  },
  { code: "PKR", symbol: "₨",   name: "Pakistani Rupee",          country: "Pakistan",              rate: 3.35    },
  { code: "PGK", symbol: "K",   name: "Papua New Guinean Kina",   country: "Papua New Guinea",      rate: 0.048   },
  { code: "PYG", symbol: "₲",   name: "Paraguayan Guaraní",       country: "Paraguay",              rate: 90.5    },
  { code: "PEN", symbol: "S/.", name: "Peruvian Sol",             country: "Peru",                  rate: 0.045   },
  { code: "PHP", symbol: "₱",   name: "Philippine Peso",          country: "Philippines",           rate: 0.68    },
  { code: "PLN", symbol: "zł",  name: "Polish Złoty",             country: "Poland",                rate: 0.048   },
  { code: "QAR", symbol: "ر.ق", name: "Qatari Rial",              country: "Qatar",                 rate: 0.044   },
  { code: "RON", symbol: "lei", name: "Romanian Leu",             country: "Romania",               rate: 0.056   },
  { code: "RUB", symbol: "₽",   name: "Russian Ruble",            country: "Russia",                rate: 1.10    },
  { code: "RWF", symbol: "Fr",  name: "Rwandan Franc",            country: "Rwanda",                rate: 16.4    },
  { code: "SAR", symbol: "ر.س", name: "Saudi Riyal",              country: "Saudi Arabia",          rate: 0.045   },
  { code: "RSD", symbol: "дин", name: "Serbian Dinar",            country: "Serbia",                rate: 1.32    },
  { code: "SLL", symbol: "Le",  name: "Sierra Leonean Leone",     country: "Sierra Leone",          rate: 267.0   },
  { code: "SGD", symbol: "S$",  name: "Singapore Dollar",         country: "Singapore",             rate: 0.016   },
  { code: "SOS", symbol: "Sh",  name: "Somali Shilling",          country: "Somalia",               rate: 6.85    },
  { code: "ZAR", symbol: "R",   name: "South African Rand",       country: "South Africa",          rate: 0.22    },
  { code: "KRW", symbol: "₩",   name: "South Korean Won",         country: "South Korea",           rate: 16.7    },
  { code: "LKR", symbol: "₨",   name: "Sri Lankan Rupee",         country: "Sri Lanka",             rate: 3.60    },
  { code: "SDG", symbol: "£",   name: "Sudanese Pound",           country: "Sudan",                 rate: 6.60    },
  { code: "SEK", symbol: "kr",  name: "Swedish Krona",            country: "Sweden",                rate: 0.125   },
  { code: "CHF", symbol: "Fr",  name: "Swiss Franc",              country: "Switzerland",           rate: 0.011   },
  { code: "TWD", symbol: "NT$", name: "Taiwan Dollar",            country: "Taiwan",                rate: 0.39    },
  { code: "TZS", symbol: "Sh",  name: "Tanzanian Shilling",       country: "Tanzania",              rate: 31.5    },
  { code: "THB", symbol: "฿",   name: "Thai Baht",                country: "Thailand",              rate: 0.43    },
  { code: "TTD", symbol: "TT$", name: "Trinidad & Tobago Dollar", country: "Trinidad & Tobago",     rate: 0.082   },
  { code: "TND", symbol: "د.ت", name: "Tunisian Dinar",           country: "Tunisia",               rate: 0.037   },
  { code: "TRY", symbol: "₺",   name: "Turkish Lira",             country: "Turkey",                rate: 0.39    },
  { code: "UGX", symbol: "Sh",  name: "Ugandan Shilling",         country: "Uganda",                rate: 44.5    },
  { code: "UAH", symbol: "₴",   name: "Ukrainian Hryvnia",        country: "Ukraine",               rate: 0.50    },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham",               country: "United Arab Emirates",  rate: 0.044   },
  { code: "GBP", symbol: "£",   name: "British Pound",            country: "United Kingdom",        rate: 0.0095  },
  { code: "USD", symbol: "$",   name: "US Dollar",                country: "United States",         rate: 0.012   },
  { code: "UYU", symbol: "$U",  name: "Uruguayan Peso",           country: "Uruguay",               rate: 0.50    },
  { code: "UZS", symbol: "лв",  name: "Uzbekistani Som",          country: "Uzbekistan",            rate: 153.0   },
  { code: "VES", symbol: "Bs.S",name: "Venezuelan Bolívar",       country: "Venezuela",             rate: 0.44    },
  { code: "VND", symbol: "₫",   name: "Vietnamese Đồng",          country: "Vietnam",               rate: 307.0   },
  { code: "YER", symbol: "﷼",   name: "Yemeni Rial",              country: "Yemen",                 rate: 3.00    },
  { code: "ZMW", symbol: "ZK",  name: "Zambian Kwacha",           country: "Zambia",                rate: 0.32    },
  { code: "ZWL", symbol: "Z$",  name: "Zimbabwean Dollar",        country: "Zimbabwe",              rate: 15.5    },
];

export function getCurrency(code) {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES.find((c) => c.code === "INR");
}

/**
 * Compact amount for large figures (projections, corpora) so they don't collide
 * in tight cards. INR uses lakh/crore; other currencies use Intl compact
 * notation. For small values it falls through to the normal formatter.
 */
export function formatCompactAmount(inrAmount, currency) {
  const value = (inrAmount ?? 0) * currency.rate;
  const abs = Math.abs(value);

  if (currency.code === "INR") {
    const sign = value < 0 ? "-" : "";
    if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2)} L`;
    if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1)}K`;
    return `${sign}₹${abs.toFixed(0)}`;
  }

  // Non-INR: only compact once the number is genuinely large.
  if (abs >= 1000) {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency", currency: currency.code, notation: "compact", maximumFractionDigits: 2,
      }).format(value);
    } catch {
      return `${currency.symbol}${(value / 1000).toFixed(1)}K`;
    }
  }
  return formatAmount(inrAmount, currency);
}

/**
 * Format an INR amount into the target currency.
 * @param {number} inrAmount  – raw value from the API (always INR)
 * @param {{ code, symbol, rate }} currency
 */
export function formatAmount(inrAmount, currency) {
  const value = (inrAmount ?? 0) * currency.rate;
  // JPY, KRW, IDR etc. have no decimal places
  const noDecimals = ["JPY","KRW","IDR","VND","IRR","LBP","UZS","MMK","GNF","SLL","MNT","LAK","RWF","UGX","TZS"].includes(currency.code);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.code,
      maximumFractionDigits: noDecimals ? 0 : 2,
    }).format(value);
  } catch {
    // Fallback for any code Intl doesn't support
    return `${currency.symbol}${value.toFixed(noDecimals ? 0 : 2)}`;
  }
}
