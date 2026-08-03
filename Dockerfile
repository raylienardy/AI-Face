FROM python:3.10-slim

WORKDIR /app

# Install system dependencies + compiler C++ untuk insightface
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    g++ \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Copy hanya requirements dulu (caching)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Unduh model InsightFace (buffalo_l) ke dalam image
RUN mkdir -p /root/.insightface/models/buffalo_l && \
    wget -q https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip && \
    unzip -q buffalo_l.zip -d /root/.insightface/models/buffalo_l && \
    rm buffalo_l.zip

# Copy seluruh folder backend
COPY backend/ .

ENV PORT=8000
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]