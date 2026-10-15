import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent))

import pytest
from fastapi.testclient import TestClient

from app.auth import AuthUser, get_current_user
from app.db import get_db
from app.main import app
from memory_db import MemoryDB

USER_A = AuthUser(id="user-a", email="a@example.com", token="token-a")
USER_B = AuthUser(id="user-b", email="b@example.com", token="token-b")


@pytest.fixture()
def db():
    return MemoryDB()


@pytest.fixture()
def client_for(db):
    """Returns a function giving a TestClient signed in as a given user, sharing one DB."""

    def make(user: AuthUser) -> TestClient:
        app.dependency_overrides[get_current_user] = lambda: user
        app.dependency_overrides[get_db] = lambda: db
        return TestClient(app)

    yield make
    app.dependency_overrides.clear()
