# ─── R3 GYM — Cloud Run Dockerfile ─────────────────────────────────────────────
# Single container: FastAPI serves both the backend API and all frontend files.

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy and install Python dependencies first (for Docker layer caching)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code
COPY backend/ ./backend/

# Copy the frontend files (HTML, CSS, JS, images)
COPY frontend/ ./frontend/

# Cloud Run requires the app to listen on PORT env var (default 8080)
ENV PORT=8080

# Start uvicorn from the backend directory
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port $PORT"]
