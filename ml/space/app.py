"""API sentimen Instride di Hugging Face Space (SDK Gradio, CPU gratis).

POST / dengan {"inputs": "<teks>"} dan header Authorization: Bearer <API_KEY>
-> [[{"label": "positive", "score": 0.97}, ...]] (format sama dengan HF Inference).
Halaman uji manual ada di /ui.
"""
import os
import secrets

import gradio as gr
import uvicorn
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from transformers import pipeline

MODEL = os.environ.get("MODEL_ID", "mnrsu/instride")
API_KEY = os.environ.get("API_KEY", "")
clf = pipeline("text-classification", model=MODEL, top_k=None)


def classify(text: str) -> list[dict]:
    out = clf(text.strip()[:2000], truncation=True, max_length=128)
    # Beberapa versi transformers membungkus hasil satu teks dalam list tambahan
    while out and isinstance(out[0], list):
        out = out[0]
    return out


app = FastAPI()


class Body(BaseModel):
    inputs: str


@app.get("/")
def home():
    return RedirectResponse("/ui")


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL}


@app.post("/")
def predict(body: Body, authorization: str = Header("")):
    # Tanpa API_KEY semua request ditolak, supaya Space publik tidak dipakai bebas
    if not API_KEY or not secrets.compare_digest(authorization, f"Bearer {API_KEY}"):
        raise HTTPException(401, "unauthorized")
    if not body.inputs.strip():
        raise HTTPException(422, "inputs kosong")
    return [classify(body.inputs)]


demo = gr.Interface(
    fn=lambda t: {r["label"]: r["score"] for r in classify(t)} if t.strip() else {},
    inputs=gr.Textbox(label="Jurnal", lines=4),
    outputs=gr.Label(label="Sentimen"),
    title="Instride Sentiment",
    examples=["hari ini aku capek banget dan stres sama tugas", "senang banget presentasi lancar"],
)
app = gr.mount_gradio_app(app, demo, path="/ui")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
