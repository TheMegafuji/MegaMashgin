"""Package only the public presentation assets; never include project credentials."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parent.parent
folder = root / "public" / "brand"
with ZipFile(folder / "mashgin-market-press-kit.zip", "w", compression=ZIP_DEFLATED) as archive:
    for source in sorted(folder.iterdir()):
        if source.suffix in {".svg", ".png", ".md"}:
            archive.write(source, source.name)
    archive.write(root / "public" / "food-kit" / "LICENSE.txt", "KENNEY-LICENSE.txt")
print("Packaged public brand artwork and source credits.")
