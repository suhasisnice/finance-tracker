"""Pydantic models for request validation and response shaping."""

from datetime import date

from pydantic import BaseModel, Field
from typing import Literal


class UserIn(BaseModel):
    username: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=4)


class LoginIn(BaseModel):
    username: str
    password: str


class TransactionIn(BaseModel):
    username: str
    amount: float = Field(gt=0)
    t_type: Literal["income", "expense"]
    category: str = Field(min_length=1)
    t_date: date
    description: str | None = None
    source: Literal["live", "sample"] = "live"


class CategorizeIn(BaseModel):
    description: str = Field(min_length=1)


class ParseSmsIn(BaseModel):
    text: str = Field(min_length=1)


class InvestmentGoalIn(BaseModel):
    username: str
    name: str = Field(min_length=1, max_length=100)
    target_amount: float = Field(gt=0)
    duration_months: int = Field(gt=0, le=1200)
    risk_profile: Literal["conservative", "moderate", "aggressive"]
    priority: Literal["low", "medium", "high"] = "medium"
    mode: Literal["sip", "lumpsum", "hybrid"]
    monthly_sip: float = Field(default=0, ge=0)
    lumpsum_amount: float = Field(default=0, ge=0)
    step_up_pct: float = Field(default=0, ge=0, le=100)
    notes: str | None = None
    # Custom portfolio as a list of holdings ({id,label,asset,exchange,weight,
    # annualReturn}); None → use the risk-profile template. Capped to keep the
    # stored JSON small.
    allocation: list[dict] | None = Field(default=None, max_length=50)
