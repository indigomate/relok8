from __future__ import annotations

from collections import Counter
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
    directory: str
    repository: str | None = None
    revision: str | None = None
    archive_url: str | None = None
    archive_sha256: str | None = None
    target_prefix: str = ""

    @property
    def local_path(self) -> str:
        model_root = os.environ.get("OPUS_MT_MODEL_DIR", "/models")
        return os.path.join(model_root, self.directory)


MODEL_SPECS: dict[tuple[str, str], ModelSpec] = {
    ("pl", "en"): ModelSpec(
        directory="pl-en",
        repository="Helsinki-NLP/opus-mt-pl-en",
        revision="7f2bb874fdfb6139f9842b91a9b75c4a6c93401c",
    ),
    ("en", "pl"): ModelSpec(
        directory="en-pl",
        archive_url="https://object.pouta.csc.fi/Tatoeba-MT-models/eng-pol/opus-2021-02-19.zip",
        archive_sha256="b8106bc3a1034649a06fb9a7a62b8267d1924fc273afe6032c4d58ea40a4865c",
    ),
}


def decoding_limit(source_token_count: int) -> int:
    """Keep short messages from running to the model's 512-token ceiling."""
    return max(16, min(256, source_token_count * 3 + 12))


def pathological_translation(source: str, translated: str) -> bool:
    """Reject runaway repetition while preserving ordinary longer translations."""
    if not translated.strip() or len(translated) > max(240, len(source) * 8):
        return True
    words = re.findall(r"[\wąćęłńóśźż]+", translated.lower(), flags=re.UNICODE)
    if len(words) < 12:
        return False
    counts = Counter(words)
    if counts.most_common(1)[0][1] / len(words) > 0.35:
        return True
    trigrams = list(zip(words, words[1:], words[2:]))
    return bool(trigrams) and Counter(trigrams).most_common(1)[0][1] >= 4


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
            max_decoding_length=max(decoding_limit(len(tokens)) for tokens in token_batches),
            no_repeat_ngram_size=3,
            repetition_penalty=1.1,
        )
        translated = " ".join(
            target_processor.decode(item.hypotheses[0]).strip()
            for item in generated
        ).strip()
        if pathological_translation(text, translated):
            raise ValueError("Translation model returned repetitive or oversized output")
        return translated

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
