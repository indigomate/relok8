from fastapi.testclient import TestClient

from app.main import app


class FakeTranslator:
    def translate(self, source: str, target: str, text: str) -> str:
        if (source, target, text) == ("pl", "en", "Dzień dobry"):
            return "Good morning"
        return text


def client(monkeypatch) -> TestClient:
    monkeypatch.setenv("OPUS_MT_API_TOKEN", "test-token")
    app.state.translator = FakeTranslator()
    return TestClient(app)


def test_requires_bearer_token(monkeypatch) -> None:
    response = client(monkeypatch).post(
        "/api/translate",
        json={"from": "pl", "to": "en", "source": "Dzień dobry"},
    )
    assert response.status_code == 401


def test_rejects_incorrect_bearer_token(monkeypatch) -> None:
    response = client(monkeypatch).post(
        "/api/translate",
        headers={"Authorization": "Bearer incorrect-token"},
        json={"from": "pl", "to": "en", "source": "Dzień dobry"},
    )
    assert response.status_code == 401


def test_fails_closed_without_configured_token(monkeypatch) -> None:
    monkeypatch.delenv("OPUS_MT_API_TOKEN", raising=False)
    app.state.translator = FakeTranslator()
    response = TestClient(app).post(
        "/api/translate",
        json={"from": "pl", "to": "en", "source": "Dzień dobry"},
    )
    assert response.status_code == 503


def test_translates_supported_pair(monkeypatch) -> None:
    response = client(monkeypatch).post(
        "/api/translate",
        headers={"Authorization": "Bearer test-token"},
        json={"from": "pl", "to": "en", "source": "Dzień dobry"},
    )
    assert response.status_code == 200
    assert response.json() == {"translation": "Good morning"}


def test_rejects_unsupported_pair(monkeypatch) -> None:
    response = client(monkeypatch).post(
        "/api/translate",
        headers={"Authorization": "Bearer test-token"},
        json={"from": "de", "to": "pl", "source": "Guten Tag"},
    )
    assert response.status_code == 422


def test_rejects_oversized_input(monkeypatch) -> None:
    response = client(monkeypatch).post(
        "/api/translate",
        headers={"Authorization": "Bearer test-token"},
        json={"from": "pl", "to": "en", "source": "a" * 10_001},
    )
    assert response.status_code == 422
