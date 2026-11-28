from threading import Lock
from types import SimpleNamespace

from app.translator import MODEL_SPECS, OpusTranslator


class FakeTokenizer:
    def __init__(self) -> None:
        self.source = ""

    def __call__(self, text: str, add_special_tokens: bool = False) -> dict[str, list[int]]:
        self.source = text
        return {"input_ids": [1]}

    def encode(self, text: str) -> list[str]:
        return [text]

    def convert_ids_to_tokens(self, values: list[str]) -> list[str]:
        return values

    def convert_tokens_to_ids(self, values: list[str]) -> list[str]:
        return values

    def decode(self, values: list[object], skip_special_tokens: bool = True) -> str:
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
    tokenizer = FakeTokenizer()
    model = FakeModel()
    translator = OpusTranslator.__new__(OpusTranslator)
    translator._lock = Lock()
    translator._models = {("en", "pl"): (tokenizer, model, MODEL_SPECS[("en", "pl")])}

    result = translator.translate("en", "pl", "Available from May")

    assert model.received == [[">>pol<< Available from May"]]
    assert result == "przetłumaczone"


def test_same_language_returns_original_text() -> None:
    translator = OpusTranslator.__new__(OpusTranslator)
    assert translator.translate("pl", "pl", "Dzień dobry") == "Dzień dobry"
