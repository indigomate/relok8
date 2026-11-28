from __future__ import annotations

import subprocess
from pathlib import Path

from app.translator import MODEL_SPECS


MODEL_FILES = [
    "source.spm",
    "target.spm",
    "tokenizer_config.json",
    "vocab.json",
]


def main() -> None:
    for spec in MODEL_SPECS.values():
        destination = Path(spec.local_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            [
                "ct2-transformers-converter",
                "--model",
                spec.repository,
                "--revision",
                spec.revision,
                "--output_dir",
                str(destination),
                "--quantization",
                "int8",
                "--copy_files",
                *MODEL_FILES,
            ],
            check=True,
        )


if __name__ == "__main__":
    main()
