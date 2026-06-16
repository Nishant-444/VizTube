import logging
import os
from groq import Groq
from fastapi import HTTPException, UploadFile
from dotenv import load_dotenv

load_dotenv(override=True)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


def extract_transcript(file: UploadFile) -> str:
    """
    stream the uploaded binary file directly to Groq's API and returns the raw text transcript
    """

    # 25mb cap
    if file.size and file.size > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")

    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    try:
        # read file bytes
        file_bytes = file.file.read()
        logger.info(f"Starting transcription for {file.filename}")

        # pass the mem stream directly to sdk without using disk
        completion = client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=(file.filename or "audio.mp4", file_bytes),
            response_format="text",
        )
        if isinstance(completion, str):
            return completion

        # If it is the object, extract the text
        return completion.text  # The SDK returns a string when response_format="text"
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        raise RuntimeError(f"Transcription engine failed: {str(e)}")
    finally:
        file.file.close()
