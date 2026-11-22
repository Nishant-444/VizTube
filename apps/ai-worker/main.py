from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
import uvicorn
from pydantic import BaseModel

# Import your custom modules
from rag import get_answer, ingest_video, RagResponse
from transcriber import extract_transcript

app = FastAPI(title="VizTube AI Worker")


class QueryRequest(BaseModel):
    video_id: str
    question: str
    video_title: str = ""
    video_description: str = ""


@app.get("/")
def health_check():
    """
    Simple health check to verify the worker is online.
    """
    return {"status": "AI Worker is active."}


@app.post("/api/rag/ingest")
def ingest_video_file(video_id: str = Form(...), file: UploadFile = File(...)):
    """
    Orchestrates transcription and vector storage.
    CRITICAL: Returns the full 'transcript' to satisfy the Node.js data contract.
    """
    try:
        transcript_text = extract_transcript(file)

        chunk_count = ingest_video(video_id, transcript_text)

        return {
            "status": "success",
            "video_id": video_id,
            "chunks_processed": chunk_count,
            "transcript": transcript_text,
            "transcript_preview": (
                transcript_text[:120] + "..."
                if len(transcript_text) > 120
                else transcript_text
            ),
        }
    except Exception as e:
        print(f"Ingestion Error for {video_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
        print(f"Query Error for {request.video_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
