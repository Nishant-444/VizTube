import logging
import os

from groq import Groq
from dotenv import load_dotenv

load_dotenv(override=True)

logger = logging.getLogger(__name__)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Groq's Whisper endpoint rejects uploads above 25 MB
MAX_AUDIO_BYTES = 25 * 1024 * 1024


class AudioTooLargeError(ValueError):
    pass


def extract_transcript(filename: str, audio: bytes) -> str:
    """Send the audio bytes to Groq Whisper and return the plain-text transcript."""

    if len(audio) > MAX_AUDIO_BYTES:
        raise AudioTooLargeError(
            f"Audio is {len(audio) / 1024 / 1024:.1f} MB; the transcription limit is 25 MB"
        )

    logger.info("Starting transcription for %s (%d bytes)", filename, len(audio))

    try:
        completion = client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=(filename, audio),
            response_format="text",
        )
    except Exception as e:
        logger.error("Transcription failed: %s", e)
        raise RuntimeError(f"Transcription engine failed: {e}") from e

    # the SDK returns a plain string when response_format="text"
    if isinstance(completion, str):
        return completion
    return completion.text
