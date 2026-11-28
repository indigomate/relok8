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
    # Exact word choices vary between valid model revisions (for example,
    # "viewing" may be translated as "visit"). Keep vocabulary assertions
    # for the two broad sanity checks, but let focused regression phrases use
    # the language-independent identity and pathology checks above.
    if expected_terms and not any(term in normalized for term in expected_terms):
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
        (),
    )
    require_translation(
        translator,
        "pl",
        "en",
        "Możemy umówić oglądanie jutro?",
        (),
    )
    require_translation(
        translator,
        "pl",
        "en",
        "Czy rachunki są wliczone w czynsz?",
        (),
    )


if __name__ == "__main__":
    main()
