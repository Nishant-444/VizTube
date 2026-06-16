import os
import uuid
import psycopg
from pgvector.psycopg import register_vector
from dotenv import load_dotenv

from typing import TypedDict
from langchain_openai import ChatOpenAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pydantic import SecretStr

load_dotenv(override=True)

MODEL = "openai/gpt-oss-20b:free"
DATABASE_URL = os.environ.get("DATABASE_URL")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL is not set in .env")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY is not set in .env")

# 1. Initialize the embedding model
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# 2. Initialize the LLM
llm = ChatOpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=SecretStr(OPENROUTER_API_KEY),
    temperature=0,
    model=MODEL,
)

SYSTEM_PROMPT = """
You are a knowledgeable AI assistant for VizTube. 
Answer the user's question using the provided video metadata and transcript context.

Video Title: {video_title}
Video Description: {video_description}

Transcript Context:
{context}

If the answer is not in the metadata or context, say "I cannot answer this based on the provided video."
"""


def get_db_connection():
    """Establishes a connection to Neon and registers the pgvector extension."""
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL is not configured.")
    conn = psycopg.connect(DATABASE_URL)
    register_vector(conn)
    return conn


class RagResponse(TypedDict):
    answer: str
    sources: list[str]


def ingest_video(video_id: str, transcript: str) -> int:
    """Chunks a transcript, converts to vectors, and saves directly to Neon Postgres."""

    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_text(transcript)

    # Calculate mathematical vectors for all transcript chunks
    vectors = embeddings.embed_documents(chunks)

    # Insert directly into the Prisma-generated table
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            for chunk, vector in zip(chunks, vectors):
                cur.execute(
                    """
                    INSERT INTO "DocumentChunk" (id, "videoId", content, embedding)
                    VALUES (%s, %s, %s, %s)
                    """,
                    (str(uuid.uuid4()), video_id, chunk, vector),
                )
        conn.commit()

    return len(chunks)


def get_answer(
    video_id: str, question: str, video_title: str, video_description: str
) -> RagResponse:
    """Retrieves context using pure SQL Vector Search and generates an answer."""

    # 1. Convert the user's question into a math vector
    question_vector = embeddings.embed_query(question)

    # 2. Vector Search via Postgres Cosine Distance (<=>) with explicit vector type-casting
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT content
                FROM "DocumentChunk"
                WHERE "videoId" = %s
                ORDER BY embedding <=> %s::vector
                LIMIT 5
                """,
                (video_id, question_vector),
            )
            results = cur.fetchall()
            context_chunks = [row[0] for row in results]

    # 3. Format context and prompt the LLM
    context = "\n\n".join(context_chunks)

    messages = [
        SystemMessage(
            content=SYSTEM_PROMPT.format(
                video_title=video_title,
                video_description=video_description,
                context=context,
            )
        ),
        HumanMessage(content=question),
    ]

    response = llm.invoke(messages)

    return {
        "answer": str(response.content),
        "sources": context_chunks,
    }
