from __future__ import annotations

import os
import re
from dataclasses import dataclass
from threading import Lock
from typing import Protocol


class TranslationEngine(Protocol):
    def translate(self, source: str, target: str, text: str) -> str: ...


@dataclass(frozen=True)
class ModelSpec:
    repository: str
    revision: str
    directory: str
    target_prefix: str = ""

    @property
    def local_path(self) -> str:
        model_root = os.environ.get("OPUS_MT_MODEL_DIR", "/models")
        return os.path.join(model_root, self.directory)


MODEL_SPECS: dict[tuple[str, str], ModelSpec] = {
    ("pl", "en"): ModelSpec(
        repository="Helsinki-NLP/opus-mt-pl-en",
        revision="7f2bb874fdfb6139f9842b91a9b75c4a6c93401c",
        directory="pl-en",
    ),
    ("en", "pl"): ModelSpec(
        repository="Helsinki-NLP/opus-mt-en-zlw",
        revision="92ffd5aa936924688bd715b26d6bb75393082c03",
        directory="en-zlw",
        target_prefix=">>pol<< ",
    ),
}


class OpusTranslator:
    """Loads int8 CTranslate2 Marian models and runs CPU inference."""

    def __init__(self) -> None:
        import ctranslate2
        from transformers import MarianTokenizer

        self._models: dict[tuple[str, str], tuple[object, object, ModelSpec]] = {}
        self._lock = Lock()
        for pair, spec in MODEL_SPECS.items():
            tokenizer = MarianTokenizer.from_pretrained(
                spec.local_path,
                local_files_only=True,
            )
            model = ctranslate2.Translator(
                spec.local_path,
                device="cpu",
                compute_type="int8",
                inter_threads=1,
                intra_threads=1,
            )
            self._models[pair] = (tokenizer, model, spec)

    @staticmethod
    def _chunks(text: str, tokenizer: object, maximum_tokens: int = 400) -> list[str]:
        encoded = tokenizer(text, add_special_tokens=False)["input_ids"]
        if not encoded:
            return [text]
        return [
            tokenizer.decode(encoded[start : start + maximum_tokens], skip_special_tokens=True)
            for start in range(0, len(encoded), maximum_tokens)
        ]

    def _translate_segment(self, source: str, target: str, text: str) -> str:
        tokenizer, model, spec = self._models[(source, target)]
        chunks = self._chunks(text, tokenizer)
        prepared = [f"{spec.target_prefix}{chunk}" for chunk in chunks]
        token_batches = [
            tokenizer.convert_ids_to_tokens(tokenizer.encode(item))
            for item in prepared
        ]
        generated = model.translate_batch(
            token_batches,
            beam_size=4,
            max_decoding_length=512,
        )
        return " ".join(
            tokenizer.decode(
                tokenizer.convert_tokens_to_ids(item.hypotheses[0]),
                skip_special_tokens=True,
            ).strip()
            for item in generated
        ).strip()

    def translate(self, source: str, target: str, text: str) -> str:
        if source == target:
            return text
        if (source, target) not in self._models:
            raise ValueError(f"Unsupported language pair: {source}-{target}")

        # Preserve paragraph breaks while translating each text segment.
        parts = re.split(r"(\n+)", text)
        with self._lock:
            translated = [
                part if not part or part.startswith("\n") else self._translate_segment(source, target, part)
                for part in parts
            ]
        return "".join(translated).strip()
