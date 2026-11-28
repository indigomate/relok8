from __future__ import annotations

from app.translator import OpusTranslator, pathological_translation


def require_translation(
    translator: OpusTranslator,
    source: str,
    target: str,
    text: str,
    expected_terms: tuple[str, ...],
) -> None:
    translated = translator.translate(source, target, text)
    normalized = translated.casefold()
    if translated.casefold() == text.casefold():
        raise RuntimeError(f"{source}-{target} smoke test returned its input")
    if pathological_translation(text, translated):
        raise RuntimeError(f"{source}-{target} smoke test produced pathological output")
    if not any(term in normalized for term in expected_terms):
        raise RuntimeError(f"{source}-{target} smoke test produced an unexpected translation: {translated!r}")


def main() -> None:
    translator = OpusTranslator()
    require_translation(
        translator,
        "en",
        "pl",
        "Hello, how are you?",
        ("jak", "masz", "witaj", "witam", "cześć"),
    )
    require_translation(
        translator,
        "pl",
        "en",
        "Dzień dobry, jak się masz?",
        ("hello", "good", "how", "you"),
    )
    require_translation(
        translator,
        "pl",
        "en",
        "Tak, pokój jest nadal dostępny.",
        ("yes", "room", "available"),
    )
    require_translation(
        translator,
        "pl",
        "en",
        "Możemy umówić oglądanie jutro?",
        ("view", "tomorrow", "arrange"),
    )
    require_translation(
        translator,
        "pl",
        "en",
        "Czy rachunki są wliczone w czynsz?",
        ("bill", "included", "rent"),
    )


if __name__ == "__main__":
    main()
