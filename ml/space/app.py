"""API sentimen Instride di Hugging Face Space (CPU gratis).

POST / dengan {"inputs": "<teks>"} dan header Authorization: Bearer <API_KEY>
-> [[{"label": "positive", "score": 0.97}, ...]] (format sama dengan HF Inference).
"""
import os
import secrets

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel
from transformers import pipeline

MODEL = os.environ.get("MODEL_ID", "mnrsu/instride")
API_KEY = os.environ.get("API_KEY", "")
clf = pipeline("text-classification", model=MODEL, top_k=None)
app = FastAPI()


class Body(BaseModel):
    inputs: str


@app.get("/")
def health():
    return {"ok": True, "model": MODEL}


@app.post("/")
def predict(body: Body, authorization: str = Header("")):
    # Tanpa API_KEY semua request ditolak, supaya Space publik tidak dipakai bebas
    if not API_KEY or not secrets.compare_digest(authorization, f"Bearer {API_KEY}"):
        raise HTTPException(401, "unauthorized")
    text = body.inputs.strip()[:2000]
    if not text:
        raise HTTPException(422, "inputs kosong")
    out = clf(text, truncation=True, max_length=128)
    # Beberapa versi transformers membungkus hasil satu teks dalam list tambahan
    while out and isinstance(out[0], list):
        out = out[0]
    return [out]
