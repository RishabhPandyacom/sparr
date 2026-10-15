"""Request models. Validation lives here so the API rejects bad input with a
clear message before anything touches the database."""

from __future__ import annotations

import re
from typing import Annotated, Literal

from pydantic import BaseModel, Field, field_validator

_CTRL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")


def _clean(value: str) -> str:
    return _CTRL.sub("", value).strip()


Currency = Literal["AUD", "USD", "GBP"]
Strategy = Literal["collaborative", "data_driven", "assertive", "flexible"]
Status = Literal["wishlist", "applied", "interviewing", "offer", "rejected"]


class ResumeInput(BaseModel):
    target_role: Annotated[str, Field(min_length=2, max_length=80)]
    key_skills: Annotated[str, Field(min_length=2, max_length=1200)]
    experience: Annotated[str, Field(min_length=20, max_length=4000)]
    years_experience: Annotated[int, Field(ge=0, le=40)] = 0
    job_description: Annotated[str, Field(max_length=8000)] | None = None

    @field_validator("target_role", "key_skills", "experience", mode="before")
    @classmethod
    def _strip(cls, v):
        return _clean(v) if isinstance(v, str) else v

    @field_validator("job_description", mode="before")
    @classmethod
    def _strip_optional(cls, v):
        if isinstance(v, str):
            v = _clean(v)
            return v or None
        return v


class SalaryInput(BaseModel):
    current_offer: Annotated[float, Field(ge=0, le=5_000_000)] | None = None
    target_salary: Annotated[float, Field(gt=0, le=5_000_000)]
    location: Annotated[str, Field(min_length=2, max_length=80)]
    currency: Currency = "AUD"
    strategy: Strategy = "collaborative"

    @field_validator("location", mode="before")
    @classmethod
    def _strip(cls, v):
        return _clean(v) if isinstance(v, str) else v


class PlanCreate(BaseModel):
    title: Annotated[str, Field(min_length=1, max_length=80)] = "My career plan"


class EstimateRequest(BaseModel):
    role: Annotated[str, Field(min_length=2, max_length=80)]
    location: Annotated[str, Field(min_length=2, max_length=80)]
    experience_years: Annotated[int, Field(ge=0, le=40)] = 0
    currency: Currency = "AUD"
    current_offer: Annotated[float, Field(ge=0, le=5_000_000)] | None = None
    target_salary: Annotated[float, Field(gt=0, le=5_000_000)] | None = None
    strategy: Strategy = "collaborative"


class ReadinessRequest(BaseModel):
    target_role: Annotated[str, Field(min_length=2, max_length=80)]
    key_skills: Annotated[str, Field(max_length=1200)] = ""
    experience: Annotated[str, Field(max_length=4000)] = ""
    job_description: Annotated[str, Field(max_length=8000)] | None = None


class ApplicationCreate(BaseModel):
    company: Annotated[str, Field(min_length=1, max_length=120)]
    role: Annotated[str, Field(min_length=1, max_length=120)]
    status: Status = "wishlist"
    job_url: Annotated[str, Field(max_length=500)] | None = None
    location: Annotated[str, Field(max_length=120)] | None = None
    notes: Annotated[str, Field(max_length=2000)] | None = None
    applied_on: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")

    @field_validator("company", "role", mode="before")
    @classmethod
    def _strip(cls, v):
        return _clean(v) if isinstance(v, str) else v

    @field_validator("job_url")
    @classmethod
    def _url(cls, v):
        if v and not re.match(r"^https?://", v):
            raise ValueError("Job link must start with http:// or https://")
        return v


class ApplicationUpdate(BaseModel):
    company: Annotated[str, Field(min_length=1, max_length=120)] | None = None
    role: Annotated[str, Field(min_length=1, max_length=120)] | None = None
    status: Status | None = None
    job_url: Annotated[str, Field(max_length=500)] | None = None
    location: Annotated[str, Field(max_length=120)] | None = None
    notes: Annotated[str, Field(max_length=2000)] | None = None
    applied_on: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")

    @field_validator("job_url")
    @classmethod
    def _url(cls, v):
        if v and not re.match(r"^https?://", v):
            raise ValueError("Job link must start with http:// or https://")
        return v


class DeleteAccountRequest(BaseModel):
    confirm: Literal["DELETE MY ACCOUNT"]
