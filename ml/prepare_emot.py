"""Siapkan EmoT (IndoNLU, Saputri dkk. 2018, CC BY-SA 4.0) sebagai data uji sentimen luar SmSA.

Jalankan:  python ml/prepare_emot.py [--split test]
Keluaran:  ml/data/emot_uji.csv (kolom text,label_a,label_b,label; folder data/ tidak di-commit)

Pemetaan emosi ke sentimen adalah ASUMSI tim Instride, bukan bagian dataset aslinya:
  happy, love          -> Positif
  anger, fear, sadness -> Negatif
EmoT tidak punya kelas netral, jadi data ini hanya menguji Positif vs Negatif.
Token anonimisasi [USERNAME] dan [URL] dibuang.
"""
import argparse
import csv
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent
URL = "https://raw.githubusercontent.com/IndoNLP/indonlu/master/dataset/emot_emotion-twitter/{}_preprocess.csv"
MAP = {"happy": "Positif", "love": "Positif", "anger": "Negatif", "fear": "Negatif", "sadness": "Negatif"}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--split", default="test", choices=["train", "valid", "test"])
    args = ap.parse_args()

    raw = ROOT / "data" / f"emot_{args.split}.csv"
    raw.parent.mkdir(exist_ok=True)
    if not raw.exists():
        urllib.request.urlretrieve(URL.format(args.split), raw)

    out, skipped = [], 0
    with open(raw, encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            text = re.sub(r"\s+", " ", re.sub(r"\[(USERNAME|URL)\]", " ", r["tweet"])).strip()
            if text and r["label"] in MAP:
                out.append([text, "", "", MAP[r["label"]]])
            else:
                skipped += 1

    path = ROOT / "data" / "emot_uji.csv"
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["text", "label_a", "label_b", "label"])
        w.writerows(out)
    pos = sum(1 for r in out if r[3] == "Positif")
    print(f"{len(out)} baris -> {path} (Positif {pos}, Negatif {len(out) - pos}, dilewati {skipped})")


if __name__ == "__main__":
    main()
