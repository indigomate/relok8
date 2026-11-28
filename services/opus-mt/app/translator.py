from __future__ import annotations

import gc
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
    """Loads one int8 CTranslate2 Marian model at a time for low-memory hosts."""

    def __init__(self) -> None:
        import ctranslate2
        import sentencepiece

        self._ctranslate2 = ctranslate2
        self._sentencepiece = sentencepiece
        self._loaded_pair: tuple[str, str] | None = None
        self._loaded: tuple[object, object, object, ModelSpec] | None = None
        self._lock = Lock()
        for spec in MODEL_SPECS.values():
            for filename in ("config.json", "model.bin", "source.spm", "target.spm"):
                if not os.path.isfile(os.path.join(spec.local_path, filename)):
                    raise RuntimeError(f"Missing model file: {spec.directory}/{filename}")

    def _load(self, pair: tuple[str, str]) -> tuple[object, object, object, ModelSpec]:
        if self._loaded_pair == pair and self._loaded is not None:
            return self._loaded

        self._loaded = None
        self._loaded_pair = None
        gc.collect()

        spec = MODEL_SPECS[pair]
        source_processor = self._sentencepiece.SentencePieceProcessor(
            model_file=os.path.join(spec.local_path, "source.spm")
        )
        target_processor = self._sentencepiece.SentencePieceProcessor(
            model_file=os.path.join(spec.local_path, "target.spm")
        )
        model = self._ctranslate2.Translator(
            spec.local_path,
            device="cpu",
            compute_type="int8",
            inter_threads=1,
            intra_threads=1,
        )
        self._loaded_pair = pair
        self._loaded = (source_processor, target_processor, model, spec)
        return self._loaded

    @staticmethod
    def _chunks(text: str, source_processor: object, maximum_tokens: int = 400) -> list[str]:
        encoded = source_processor.encode(text, out_type=int)
        if not encoded:
            return [text]
        return [
            source_processor.decode(encoded[start : start + maximum_tokens])
            for start in range(0, len(encoded), maximum_tokens)
        ]

    def _translate_segment(self, source: str, target: str, text: str) -> str:
        source_processor, target_processor, model, spec = self._load((source, target))
        chunks = self._chunks(text, source_processor)
        token_batches = [source_processor.encode(chunk, out_type=str) for chunk in chunks]
        if spec.target_prefix:
            language_token = spec.target_prefix.strip()
            token_batches = [[language_token, *tokens] for tokens in token_batches]
        generated = model.translate_batch(
            token_batches,
            beam_size=4,
            max_decoding_length=512,
        )
        return " ".join(
            target_processor.decode(item.hypotheses[0]).strip()
            for item in generated
        ).strip()

    def translate(self, source: str, target: str, text: str) -> str:
        if source == target:
            return text
        if (source, target) not in MODEL_SPECS:
            raise ValueError(f"Unsupported language pair: {source}-{target}")

        # Preserve paragraph breaks while translating each text segment.
        parts = re.split(r"(\n+)", text)
        with self._lock:
            translated = [
                part if not part or part.startswith("\n") else self._translate_segment(source, target, part)
                for part in parts
            ]
        return "".join(translated).strip()
