"""Fine-tune IndoBERT untuk sentimen 3 kelas (positif/netral/negatif) pada SmSA (IndoNLU).

Jalankan:  ml/.venv/Scripts/python ml/train_sentiment.py
Hasil:     ml/model/ (bobot, tidak di-commit) dan ml/results/indobert_smsa.json (metrik uji).
PyTorch polos (tanpa Trainer/accelerate) supaya dependency cukup torch + transformers + scikit-learn.
"""
import argparse
import csv
import json
import time
import urllib.request
from pathlib import Path

import torch
from sklearn.metrics import classification_report, f1_score
from torch.utils.data import DataLoader
from transformers import AutoModelForSequenceClassification, AutoTokenizer, get_linear_schedule_with_warmup

ROOT = Path(__file__).parent
DATA_URL = "https://raw.githubusercontent.com/IndoNLP/indonlu/master/dataset/smsa_doc-sentiment-prosa/{}_preprocess.tsv"
# Urutan sama dengan konvensi model default Edge Function (LABEL_0 positif, 1 netral, 2 negatif)
LABELS = ["positive", "neutral", "negative"]


def load(split: str) -> tuple[list[str], list[int]]:
    path = ROOT / "data" / f"{split}.tsv"
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(DATA_URL.format(split), path)
    with open(path, encoding="utf-8") as f:
        rows = [r for r in csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE) if len(r) == 2]
    return [r[0] for r in rows], [LABELS.index(r[1]) for r in rows]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="indobenchmark/indobert-base-p1")
    ap.add_argument("--epochs", type=int, default=3)
    ap.add_argument("--batch", type=int, default=16)  # muat di GPU 4 GB dengan max_len 128 + AMP
    ap.add_argument("--lr", type=float, default=2e-5)
    ap.add_argument("--max-len", type=int, default=128)
    args = ap.parse_args()

    torch.manual_seed(42)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"device={device}", torch.cuda.get_device_name(0) if device == "cuda" else "")

    tok = AutoTokenizer.from_pretrained(args.base)
    model = AutoModelForSequenceClassification.from_pretrained(
        args.base,
        num_labels=len(LABELS),
        id2label=dict(enumerate(LABELS)),
        label2id={l: i for i, l in enumerate(LABELS)},
    ).to(device)

    def loader(split: str, shuffle: bool) -> DataLoader:
        texts, labels = load(split)

        def collate(idx: list[int]):
            enc = tok([texts[i] for i in idx], truncation=True, max_length=args.max_len, padding=True, return_tensors="pt")
            enc["labels"] = torch.tensor([labels[i] for i in idx])
            return enc

        return DataLoader(range(len(texts)), batch_size=args.batch, shuffle=shuffle, collate_fn=collate)

    train, valid, test = loader("train", True), loader("valid", False), loader("test", False)
    opt = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    steps = len(train) * args.epochs
    sched = get_linear_schedule_with_warmup(opt, int(0.1 * steps), steps)
    scaler = torch.amp.GradScaler(enabled=device == "cuda")

    @torch.no_grad()
    def predict(dl: DataLoader) -> tuple[list[int], list[int]]:
        model.eval()
        gold, pred = [], []
        for batch in dl:
            batch = {k: v.to(device) for k, v in batch.items()}
            with torch.autocast(device_type=device, enabled=device == "cuda"):
                logits = model(**{k: v for k, v in batch.items() if k != "labels"}).logits
            gold += batch["labels"].tolist()
            pred += logits.argmax(-1).tolist()
        return gold, pred

    best_f1, history, start = -1.0, [], time.time()
    for epoch in range(1, args.epochs + 1):
        model.train()
        total = 0.0
        for step, batch in enumerate(train, 1):
            batch = {k: v.to(device) for k, v in batch.items()}
            with torch.autocast(device_type=device, enabled=device == "cuda"):
                loss = model(**batch).loss
            opt.zero_grad()
            scaler.scale(loss).backward()
            scaler.unscale_(opt)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(opt)
            scaler.update()
            sched.step()
            total += loss.item()
            if step % 100 == 0:
                print(f"epoch {epoch} step {step}/{len(train)} loss {total / step:.4f}", flush=True)
        gold, pred = predict(valid)
        f1 = f1_score(gold, pred, average="macro")
        history.append({"epoch": epoch, "train_loss": round(total / len(train), 4), "valid_macro_f1": round(f1, 4)})
        print(history[-1], flush=True)
        if f1 > best_f1:  # simpan epoch terbaik menurut data validasi, bukan data uji
            best_f1 = f1
            model.save_pretrained(ROOT / "model")
            tok.save_pretrained(ROOT / "model")

    model = AutoModelForSequenceClassification.from_pretrained(ROOT / "model").to(device)
    gold, pred = predict(test)
    report = classification_report(gold, pred, target_names=LABELS, output_dict=True, digits=4)
    print(classification_report(gold, pred, target_names=LABELS, digits=4))
    out = ROOT / "results" / "indobert_smsa.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps({
        "base_model": args.base, "dataset": "SmSA (IndoNLU)", "test_size": len(gold),
        "hyperparameters": vars(args), "device": device, "train_minutes": round((time.time() - start) / 60, 1),
        "history": history, "test": report,
    }, indent=2))
    print(f"saved {out}")


if __name__ == "__main__":
    main()
