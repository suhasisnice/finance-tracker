"""Bank/UPI SMS parsing: swappable interface + a deterministic regex baseline.

`SmsParser` is the contract every implementation (regex today, an NER model
later) must satisfy. Callers should depend on `get_sms_parser()`, not on
`RegexSmsParser` directly, so swapping the baseline for a trained model later
is a one-line change here rather than a call-site rewrite.
"""

import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, asdict
from datetime import datetime

_MONTHS = {
    "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
    "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12,
}

_DEBIT_WORDS = r"debited|debit|spent|sent|paid|withdrawn|purchase of"
_CREDIT_WORDS = r"credited|credit|received|deposited"

_AMOUNT_RE = re.compile(r"(?:rs\.?|inr|₹)\s?([\d,]+(?:\.\d{1,2})?)", re.IGNORECASE)

# Tried in order; first that matches wins. Groups: day, month(word-or-num), year.
_DATE_PATTERNS = [
    re.compile(r"\b(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{2,4})\b"),   # 24-Jul-26 / 24/Jul/2026
    re.compile(r"\b(\d{1,2})([A-Za-z]{3})(\d{2,4})\b"),           # 24Jul26
    re.compile(r"\b(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\b"),       # 24-07-26 / 24/07/2026
    re.compile(r"\b(\d{4})-(\d{2})-(\d{2})\b"),                   # 2026-07-24 (ISO, y-m-d)
]

# Merchant extraction: ordered list of regexes, first match wins.
# Applied to the raw (not lowercased) text so merchant casing is preserved.
_MERCHANT_PATTERNS = [
    re.compile(r"\bVPA\s+([\w.\-]+?)@[\w.\-]+", re.IGNORECASE),           # to VPA swiggy@ybl
    re.compile(r"\bUPI/(?:P2M|P2A)/\d+/([\w .\-]+?)(?:[.,]|\s+on\b|\s+Ref\b|$)", re.IGNORECASE),  # UPI/P2M/123/swiggy
    re.compile(r"\bto\s+([\w.\-]+?)@[\w.\-]+", re.IGNORECASE),            # to swiggy@ybl
    re.compile(r"\bfrom\s+([\w.\-]+?)@[\w.\-]+", re.IGNORECASE),          # from ramesh@okhdfcbank
    re.compile(r"([\w.\-]+?)@[\w.\-]+\s+credited\b", re.IGNORECASE),      # blinkit@ybl credited (ICICI style)
    re.compile(r"\b(?:towards|to)\s+([A-Za-z][\w .&\-]{1,30}?)(?:\s+on\b|\s+Ref\b|[.,]|$)", re.IGNORECASE),
    re.compile(r"\bat\s+([A-Za-z][\w .&\-]{1,30}?)(?:\s+on\b|[.,]|$)", re.IGNORECASE),
]

_BANK_KEYWORDS = [
    ("HDFC", re.compile(r"\bhdfc\b", re.IGNORECASE)),
    ("SBI", re.compile(r"\bsbi\b", re.IGNORECASE)),
    ("ICICI", re.compile(r"\bicici\b", re.IGNORECASE)),
    ("Axis", re.compile(r"\baxis\b", re.IGNORECASE)),
]


@dataclass
class ParsedSms:
    amount: float | None
    merchant: str | None
    date: str | None          # ISO yyyy-mm-dd, or None if undetermined
    direction: str | None     # "debit" | "credit" | None
    bank: str                 # "HDFC" | "SBI" | "ICICI" | "Axis" | "UPI" | "Unknown"
    raw_text: str

    def to_dict(self):
        return asdict(self)


class SmsParser(ABC):
    """Contract: extract structured transaction data from a bank/UPI SMS."""

    @abstractmethod
    def parse(self, text: str) -> ParsedSms:
        raise NotImplementedError


class RegexSmsParser(SmsParser):
    """Deterministic regex baseline covering HDFC, SBI, ICICI, Axis and generic UPI SMS.

    Not ML: pattern-matches amount / merchant / date / debit-vs-credit against
    known phrasing used by these senders. Fields that can't be confidently
    extracted come back as None rather than guessed. Intended to be replaced
    by a trained NER model later behind the same `parse()` signature.
    """

    def parse(self, text: str) -> ParsedSms:
        clean = " ".join(text.strip().split())

        return ParsedSms(
            amount=self._extract_amount(clean),
            merchant=self._extract_merchant(clean),
            date=self._extract_date(clean),
            direction=self._extract_direction(clean),
            bank=self._extract_bank(clean),
            raw_text=text,
        )

    @staticmethod
    def _extract_amount(text: str) -> float | None:
        m = _AMOUNT_RE.search(text)
        if not m:
            return None
        try:
            return float(m.group(1).replace(",", ""))
        except ValueError:
            return None

    @staticmethod
    def _extract_direction(text: str) -> str | None:
        lower = text.lower()
        debit_m = re.search(_DEBIT_WORDS, lower)
        credit_m = re.search(_CREDIT_WORDS, lower)
        if debit_m and credit_m:
            # Both words present (e.g. "debited ... and credited to VPA merchant@bank"
            # for a UPI payment): whichever appears first describes the account's
            # own movement.
            return "debit" if debit_m.start() < credit_m.start() else "credit"
        if debit_m:
            return "debit"
        if credit_m:
            return "credit"
        return None

    @staticmethod
    def _extract_date(text: str) -> str | None:
        for pattern in _DATE_PATTERNS:
            m = pattern.search(text)
            if not m:
                continue
            groups = m.groups()
            try:
                if pattern is _DATE_PATTERNS[3]:  # ISO y-m-d
                    year, month, day = int(groups[0]), int(groups[1]), int(groups[2])
                elif groups[1].isalpha():         # day-MonWord-year
                    day = int(groups[0])
                    month = _MONTHS.get(groups[1].lower()[:3])
                    year = int(groups[2])
                    if month is None:
                        continue
                else:                              # day-month-year, numeric
                    day, month, year = int(groups[0]), int(groups[1]), int(groups[2])
                if year < 100:
                    year += 2000
                return datetime(year, month, day).strftime("%Y-%m-%d")
            except (ValueError, TypeError):
                continue
        return None

    @staticmethod
    def _extract_merchant(text: str) -> str | None:
        for pattern in _MERCHANT_PATTERNS:
            m = pattern.search(text)
            if m:
                merchant = m.group(1).strip(" .-")
                if merchant:
                    return merchant
        return None

    @staticmethod
    def _extract_bank(text: str) -> str:
        for name, pattern in _BANK_KEYWORDS:
            if pattern.search(text):
                return name
        if re.search(r"\bupi\b", text, re.IGNORECASE):
            return "UPI"
        return "Unknown"


def get_sms_parser() -> SmsParser:
    """Single point of construction: swap the returned implementation to upgrade."""
    return RegexSmsParser()
