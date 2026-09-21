# Multi-stage Dockerfile for NetPack Logistics Single-Platform Deployment (Railway / Docker)
# Stage 1: Build React Frontend & PWAs
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install frontend dependencies
COPY react-netpack-admin-main/react-netpack-admin-main/package*.json ./
RUN npm install

# Build frontend production bundle
COPY react-netpack-admin-main/react-netpack-admin-main/ ./
RUN npm run build

# Stage 2: Python Backend Runtime
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY netpack-backend-python/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY netpack-backend-python/ ./

# Copy compiled frontend dist into static/ for FastAPI serving
COPY --from=frontend-builder /app/frontend/dist ./static

# Ensure persistent uploads directory exists
RUN mkdir -p uploads

ENV PORT=8000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 8000

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
