from __future__ import annotations

import hashlib
import shutil
import subprocess
import tempfile
import urllib.request
import zipfile
from pathlib import Path

from app.translator import MODEL_SPECS


MODEL_FILES = [
    "source.spm",
    "target.spm",
    "tokenizer_config.json",
    "vocab.json",
]


def download_archive(url: str, expected_sha256: str, destination: Path) -> None:
    digest = hashlib.sha256()
    with urllib.request.urlopen(url) as response, destination.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            digest.update(chunk)
            output.write(chunk)
    if digest.hexdigest() != expected_sha256:
        raise RuntimeError("Downloaded Opus-MT archive failed SHA-256 verification")


def convert_archive(spec, destination: Path) -> None:
    if not spec.archive_url or not spec.archive_sha256:
        raise RuntimeError("Archive model source is incomplete")
    with tempfile.TemporaryDirectory(prefix="opus-mt-") as temporary:
        root = Path(temporary)
        archive = root / "model.zip"
        extracted = root / "source"
        download_archive(spec.archive_url, spec.archive_sha256, archive)
        with zipfile.ZipFile(archive) as bundle:
            extraction_root = extracted.resolve()
            for member in bundle.infolist():
                if not (extraction_root / member.filename).resolve().is_relative_to(extraction_root):
                    raise RuntimeError("Opus-MT archive contains an unsafe path")
            bundle.extractall(extracted)
        subprocess.run(
            [
                "ct2-opus-mt-converter",
                "--model_dir",
                str(extracted),
                "--output_dir",
                str(destination),
                "--quantization",
                "int8",
            ],
            check=True,
        )
        for filename in ("source.spm", "target.spm", "README.md", "LICENSE"):
            shutil.copy2(extracted / filename, destination / filename)


def main() -> None:
    for spec in MODEL_SPECS.values():
        destination = Path(spec.local_path)
        destination.parent.mkdir(parents=True, exist_ok=True)
        if spec.archive_url:
            convert_archive(spec, destination)
            continue
        if not spec.repository or not spec.revision:
            raise RuntimeError("Hugging Face model source is incomplete")
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
