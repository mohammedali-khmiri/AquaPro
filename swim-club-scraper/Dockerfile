# /swim-club-scraper/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Installation des dépendances système nécessaires pour les PDFs et images
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Installation des librairies Python requises pour votre script + FastAPI
RUN pip install --no-cache-dir \
    fastapi \
    uvicorn \
    cloudscraper \
    beautifulsoup4 \
    pymongo \
    pdfplumber \
    Pillow \
    pydantic

# Copie des scripts dans le conteneur
COPY scraper.py .
COPY app.py .

# Exposition du port de l'API FastAPI
EXPOSE 8000

# Commande pour démarrer le serveur Uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]