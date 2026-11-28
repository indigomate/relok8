from threading import Lock
from types import SimpleNamespace

from app.translator import (
    MODEL_SPECS,
    OpusTranslator,
    decoding_limit,
    pathological_translation,
)


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
        self.options: dict[str, object] = {}

    def translate_batch(self, values: list[list[str]], **options: object) -> list[SimpleNamespace]:
        self.received = values
        self.options = options
        return [SimpleNamespace(hypotheses=[["przetłumaczone"]])]


def test_english_to_polish_uses_dedicated_model_and_bounded_decoding() -> None:
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

    assert model.received == [["Available from May"]]
    assert model.options["max_decoding_length"] == decoding_limit(1)
    assert model.options["no_repeat_ngram_size"] == 3
    assert model.options["repetition_penalty"] == 1.1
    assert result == "przetłumaczone"


def test_same_language_returns_original_text() -> None:
    translator = OpusTranslator.__new__(OpusTranslator)
    assert translator.translate("pl", "pl", "Dzień dobry") == "Dzień dobry"


def test_rejects_runaway_repetition_and_oversized_output() -> None:
    repeated = " ".join(["się"] * 20)
    assert pathological_translation("Hello", repeated)
    assert pathological_translation("Hello", "x" * 241)
    assert not pathological_translation("Hello, how are you?", "Cześć, jak się masz?")
