from threading import Lock
from types import SimpleNamespace

from app.translator import MODEL_SPECS, OpusTranslator


class FakeProcessor:
    def __init__(self) -> None:
        self.source = ""

    def encode(self, text: str, out_type: type) -> list[object]:
        self.source = text
        return [1] if out_type is int else [text]

    def decode(self, values: list[object]) -> str:
        if values == [1]:
            return self.source
        return " ".join(str(value) for value in values)


class FakeModel:
    def __init__(self) -> None:
        self.received: list[list[str]] = []

    def translate_batch(self, values: list[list[str]], **_: object) -> list[SimpleNamespace]:
        self.received = values
        return [SimpleNamespace(hypotheses=[["przetłumaczone"]])]


def test_english_to_polish_uses_required_target_prefix() -> None:
    source_processor = FakeProcessor()
    target_processor = FakeProcessor()
    model = FakeModel()
    translator = OpusTranslator.__new__(OpusTranslator)
    translator._lock = Lock()
    translator._loaded_pair = ("en", "pl")
    translator._loaded = (
        source_processor,
        target_processor,
        model,
        MODEL_SPECS[("en", "pl")],
    )

    result = translator.translate("en", "pl", "Available from May")

    assert model.received == [[">>pol<<", "Available from May"]]
    assert result == "przetłumaczone"


def test_same_language_returns_original_text() -> None:
    translator = OpusTranslator.__new__(OpusTranslator)
    assert translator.translate("pl", "pl", "Dzień dobry") == "Dzień dobry"
