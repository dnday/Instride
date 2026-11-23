"""Evaluasi model sentimen Instride pada jurnal bergaya mahasiswa (data buatan tim, bukan SmSA).

Jalankan:  python ml/eval_journal.py [--csv ml/eval/jurnal_uji.csv] [--model mnrsu/instride] [--name jurnal]
Masukan:   CSV kolom text,label_a,label_b,label (lihat ml/eval/PANDUAN_LABEL.md). Nilai: Positif/Netral/Negatif.
Keluaran:  ml/results/indobert_<name>.json (hanya metrik, aman di-commit)
           ml/data/<name>_salah.csv (teks yang salah ditebak; folder data/ tidak di-commit)
"""
import argparse
import csv
import json
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import classification_report, cohen_kappa_score, confusion_matrix, f1_score, precision_score, recall_score
from transformers import AutoModelForSequenceClassification, AutoTokenizer

ROOT = Path(__file__).parent
LABELS = ["Positif", "Netral", "Negatif"]
MODEL_LABEL = {"positive": "Positif", "neutral": "Netral", "negative": "Negatif"}


def load(path: Path) -> list[dict]:
    with open(path, encoding="utf-8-sig", newline="") as f:
        return [{k: (v or "").strip() for k, v in r.items()} for r in csv.DictReader(f)]


def bootstrap_ci(gold: np.ndarray, pred: np.ndarray, n: int = 1000, seed: int = 42) -> dict:
    """Selang kepercayaan 95% (bootstrap): seberapa pasti angka dari data sebanyak ini."""
    rng = np.random.default_rng(seed)
    acc, f1 = [], []
    for _ in range(n):
        i = rng.integers(0, len(gold), len(gold))
        acc.append((gold[i] == pred[i]).mean())
        f1.append(f1_score(gold[i], pred[i], average="macro", labels=sorted(set(gold[i])), zero_division=0))

    def q(xs: list) -> list:
        return [round(float(np.percentile(xs, 2.5)), 4), round(float(np.percentile(xs, 97.5)), 4)]

    return {"accuracy_95ci": q(acc), "macro_f1_95ci": q(f1)}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", default=str(ROOT / "eval" / "jurnal_uji.csv"))
    ap.add_argument("--model", default="mnrsu/instride")
    ap.add_argument("--name", default="jurnal", help="nama data uji; menentukan nama berkas hasil")
    ap.add_argument("--dataset", default="jurnal bergaya mahasiswa, sintetis (disusun dengan bantuan AI; 6 baris ditinjau tim), label tunggal", help="keterangan data uji untuk berkas hasil")
    args = ap.parse_args()

    rows = load(Path(args.csv))
    bad = [r for r in rows if r["label"] and r["label"] not in LABELS]
    if bad:
        raise SystemExit(f"label tidak dikenal: {sorted({r['label'] for r in bad})}; harus salah satu dari {LABELS}")
    unresolved = [r for r in rows if not r["label"] and r["label_a"] and r["label_b"] and r["label_a"] != r["label_b"]]
    rows = [r for r in rows if r["text"] and r["label"]]
    if not rows:
        raise SystemExit("tidak ada baris berlabel (kolom label kosong)")

    both = [r for r in rows if r["label_a"] in LABELS and r["label_b"] in LABELS]
    kappa = round(cohen_kappa_score([r["label_a"] for r in both], [r["label_b"] for r in both]), 4) if both else None

    if kappa is not None and kappa != kappa:  # NaN: kedua pelabel hanya memakai satu kelas, kappa tidak terdefinisi
        kappa = None

    tok = AutoTokenizer.from_pretrained(args.model)
    model = AutoModelForSequenceClassification.from_pretrained(args.model).eval()
    names = [MODEL_LABEL.get(model.config.id2label[i].lower(), model.config.id2label[i]) for i in range(model.config.num_labels)]
    pred_names, scores = [], []
    with torch.no_grad():
        for r in rows:
            enc = tok(r["text"], truncation=True, max_length=128, return_tensors="pt")  # sama dengan training
            p = model(**enc).logits.softmax(-1)[0]
            pred_names.append(names[int(p.argmax())])
            scores.append(float(p.max()))

    gold = np.array([LABELS.index(r["label"]) for r in rows])
    pred = np.array([LABELS.index(n) for n in pred_names])
    report = classification_report(gold, pred, labels=range(3), target_names=LABELS, output_dict=True, zero_division=0)
    support = {l: int((gold == i).sum()) for i, l in enumerate(LABELS)}
    present = [i for i, l in enumerate(LABELS) if support[l] > 0]  # macro hanya atas kelas yang punya data
    macro = {
        "precision": round(float(precision_score(gold, pred, labels=present, average="macro", zero_division=0)), 4),
        "recall": round(float(recall_score(gold, pred, labels=present, average="macro", zero_division=0)), 4),
        "f1-score": round(float(f1_score(gold, pred, labels=present, average="macro", zero_division=0)), 4),
    }
    report["macro avg"] = {**macro, "support": len(gold), "catatan": "hanya kelas yang punya data: " + ", ".join(LABELS[i] for i in present)}

    out = {
        "model": args.model,
        "dataset": args.dataset,
        "n": len(rows),
        "support": support,
        "cohen_kappa_antar_pelabel": kappa,
        "belum_diputuskan": len(unresolved),
        "test": report,
        "confusion_matrix": {
            "baris": "label benar",
            "kolom": "prediksi",
            "urutan": LABELS,
            "nilai": confusion_matrix(gold, pred, labels=range(3)).tolist(),
        },
        **bootstrap_ci(gold, pred),
    }
    res = ROOT / "results"
    res.mkdir(exist_ok=True)
    (res / f"indobert_{args.name}.json").write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")

    wrong = [(r["text"], r["label"], n, round(s, 3)) for r, n, s in zip(rows, pred_names, scores) if r["label"] != n]
    (ROOT / "data").mkdir(exist_ok=True)
    with open(ROOT / "data" / f"{args.name}_salah.csv", "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["text", "label_benar", "prediksi", "keyakinan"])
        w.writerows(wrong)

    print(classification_report(gold, pred, labels=range(3), target_names=LABELS, digits=4, zero_division=0))
    print("confusion matrix (baris = benar, kolom = prediksi):", LABELS)
    print(np.array(out["confusion_matrix"]["nilai"]))
    print(f"macro (kelas yang punya data: {[LABELS[i] for i in present]}):", macro)
    print(f"n={len(rows)} | akurasi 95% CI {out['accuracy_95ci']} | macro-F1 95% CI {out['macro_f1_95ci']} | kappa pelabel {kappa}")
    if min(support[LABELS[i]] for i in present) < 60 or len(rows) < 150:
        print(f"PERINGATAN: data masih sedikit ({support}); angka belum bisa dipercaya. Target >= 60 per kelas.")
    if unresolved:
        print(f"PERINGATAN: {len(unresolved)} baris label_a != label_b belum diisi kolom label, dilewati.")
    print(f"salah tebak: {len(wrong)} -> ml/data/{args.name}_salah.csv")


if __name__ == "__main__":
    main()
