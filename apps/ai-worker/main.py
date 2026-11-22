import logging

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from rag import get_answer, ingest_video, RagResponse
from transcriber import MAX_AUDIO_BYTES, AudioTooLargeError, extract_transcript

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="VizTube AI Worker")

# Cloudinary can take a while to render the audio-only version of a long video
AUDIO_DOWNLOAD_TIMEOUT = httpx.Timeout(30.0, read=300.0)

# Statuses that mean "try again later" rather than "this will never work"
RETRYABLE_UPSTREAM_STATUSES = {408, 420, 423, 429}


class IngestRequest(BaseModel):
    video_id: str
    audio_url: str


class QueryRequest(BaseModel):
    video_id: str
    question: str
    video_title: str = ""
    video_description: str = ""


def download_audio(url: str) -> bytes:
    """Download the audio, refusing anything over the transcription size limit.

    Error statuses tell the API whether a retry can help:
    413 / 422 are permanent, 503 is temporary.
    """
    try:
        with httpx.stream(
            "GET", url, timeout=AUDIO_DOWNLOAD_TIMEOUT, follow_redirects=True
        ) as response:
            if response.status_code >= 400:
                retryable = (
                    response.status_code >= 500
                    or response.status_code in RETRYABLE_UPSTREAM_STATUSES
                )
                raise HTTPException(
                    status_code=503 if retryable else 422,
                    detail=f"Audio download failed with HTTP {response.status_code}",
                )

            audio = bytearray()
            for chunk in response.iter_bytes():
                audio.extend(chunk)
                if len(audio) > MAX_AUDIO_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail="Audio is larger than the 25 MB transcription limit",
                    )
            return bytes(audio)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail=f"Audio download failed: {e}")


@app.get("/")
def health_check():
    """
    Simple health check to verify the worker is online.
    """
    return {"status": "AI Worker is active."}


@app.post("/api/rag/ingest")
def ingest_video_audio(request: IngestRequest):
    """
    Downloads the video's audio, transcribes it, and stores the transcript embeddings.
    Safe to call repeatedly for the same video: previous chunks are replaced.
    Returns the full 'transcript' so the API can store it.
    """
    audio = download_audio(request.audio_url)

    try:
        transcript_text = extract_transcript(f"{request.video_id}.mp3", audio)
        chunk_count = ingest_video(request.video_id, transcript_text)
    except AudioTooLargeError as e:
        raise HTTPException(status_code=413, detail=str(e))
    except Exception as e:
        logger.error("Ingestion error for %s: %s", request.video_id, e)
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "status": "success",
        "video_id": request.video_id,
        "chunks_processed": chunk_count,
        "transcript": transcript_text,
    }


@app.post("/api/rag/ask")
def ask_video_question(request: QueryRequest) -> RagResponse:
    """
    Uses pgvector (PostgreSQL vector search) to retrieve context and OpenRouter LLM to generate an answer.
    """
    try:
        return get_answer(
            request.video_id,
            request.question,
            request.video_title or "",
            request.video_description or "",
        )
    except Exception as e:
        logger.error("Query error for %s: %s", request.video_id, e)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
