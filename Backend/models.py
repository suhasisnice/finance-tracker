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
