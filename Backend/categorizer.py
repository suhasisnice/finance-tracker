"""Transaction categorization: swappable interface + a deterministic baseline.

`Categorizer` is the contract every implementation (rule-based today, an ML
model later) must satisfy. Callers should depend on `get_categorizer()`, not
on `RuleBasedCategorizer` directly, so swapping the baseline for a trained
model later is a one-line change here rather than a call-site rewrite.
"""

import re
from abc import ABC, abstractmethod

UNCATEGORIZED = "Uncategorized"


class Categorizer(ABC):
    """Contract: map a free-text transaction description to a category."""

    @abstractmethod
    def categorize(self, description: str) -> str:
        raise NotImplementedError


# Keyword -> category. Checked as whole-word matches against the lowercased
# description so "amazon" doesn't also fire on a merchant like "amazonite".
# Ordered roughly by specificity; first match wins.
_KEYWORD_CATEGORY_MAP = {
    # Food delivery
    "swiggy": "Food Delivery",
    "zomato": "Food Delivery",

    # Quick commerce / groceries
    "blinkit": "Groceries",
    "zepto": "Groceries",
    "bigbasket": "Groceries",
    "dmart": "Groceries",

    # Ride-hailing
    "uber": "Travel",
    "ola": "Travel",
    "rapido": "Travel",
    "irctc": "Travel",

    # Shopping
    "amazon": "Shopping",
    "flipkart": "Shopping",

    # Utilities / telecom
    "jio": "Bills",
    "airtel": "Bills",

    # Entertainment
    "bookmyshow": "Entertainment",
}

# Longest keyword first so e.g. a hypothetical "amazon pay" style entry
# matches the more specific token before a shorter substring could.
_SORTED_KEYWORDS = sorted(_KEYWORD_CATEGORY_MAP, key=len, reverse=True)


class RuleBasedCategorizer(Categorizer):
    """Deterministic keyword-lookup baseline for Indian merchants.

    Not ML: a fixed dict of merchant keyword -> category, matched with a
    word-boundary regex against the lowercased description. Falls back to
    "Uncategorized" when nothing matches. Intended to be replaced by a
    trained classifier later behind the same `categorize()` signature.
    """

    def categorize(self, description: str) -> str:
        if not description:
            return UNCATEGORIZED

        text = description.lower()
        for keyword in _SORTED_KEYWORDS:
            if re.search(rf"\b{re.escape(keyword)}\b", text):
                return _KEYWORD_CATEGORY_MAP[keyword]

        return UNCATEGORIZED


def get_categorizer() -> Categorizer:
    """Single point of construction: swap the returned implementation to upgrade."""
    return RuleBasedCategorizer()
