"""API sentimen Instride di Hugging Face Space (SDK Gradio, hardware ZeroGPU).

Endpoint untuk Supabase Edge Function (API bawaan Gradio):
  POST /gradio_api/call/predict  {"data": ["<teks jurnal>", "<API_KEY>"]}  -> {"event_id": "..."}
  GET  /gradio_api/call/predict/<event_id>  -> SSE "event: complete" + "data: [[{label, score}, ...]]"

Inferensi API berjalan di CPU (BERT-base cukup cepat) agar tidak menghabiskan kuota ZeroGPU.
GPU hanya dipakai halaman uji manual; ZeroGPU mewajibkan minimal satu fungsi @spaces.GPU.
"""
import os
import secrets

import gradio as gr
import spaces
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

MODEL = os.environ.get("MODEL_ID", "mnrsu/instride")
API_KEY = os.environ.get("API_KEY", "")

tokenizer = AutoTokenizer.from_pretrained(MODEL)
model = AutoModelForSequenceClassification.from_pretrained(MODEL).eval()
LABELS = [model.config.id2label[i] for i in range(model.config.num_labels)]


def _scores(text: str, device: str) -> list[dict]:
    enc = tokenizer(text.strip()[:2000], truncation=True, max_length=128, return_tensors="pt").to(device)
    with torch.no_grad():
        probs = model.to(device)(**enc).logits.softmax(-1)[0].tolist()
    return [{"label": label, "score": round(p, 6)} for label, p in zip(LABELS, probs)]


def predict(text: str, key: str) -> list[dict]:
    # Tanpa API_KEY semua request ditolak, supaya Space publik tidak dipakai bebas
    if not API_KEY or not secrets.compare_digest(key or "", API_KEY):
        raise gr.Error("unauthorized")
    if not (text or "").strip():
        raise gr.Error("inputs kosong")
    return _scores(text, "cpu")


@spaces.GPU(duration=20)
def try_on_gpu(text: str) -> dict:
    if not (text or "").strip():
        return {}
    return {r["label"]: r["score"] for r in _scores(text, "cuda" if torch.cuda.is_available() else "cpu")}


with gr.Blocks(title="Instride Sentiment") as demo:
    gr.Markdown("# Instride Sentiment\nModel [mnrsu/instride](https://huggingface.co/mnrsu/instride) (IndoBERT fine-tuned pada SmSA).")
    text = gr.Textbox(label="Jurnal", lines=4, placeholder="hari ini aku capek banget dan stres sama tugas")
    run = gr.Button("Analisis", variant="primary")
    result = gr.Label(label="Sentimen")
    run.click(try_on_gpu, text, result, api_name=False)

    # Endpoint API berkunci untuk Edge Function (komponen tersembunyi)
    api_text = gr.Textbox(visible=False)
    api_key = gr.Textbox(visible=False)
    api_out = gr.JSON(visible=False)
    gr.Button(visible=False).click(predict, [api_text, api_key], api_out, api_name="predict")

if __name__ == "__main__":
    demo.queue(default_concurrency_limit=4).launch()
