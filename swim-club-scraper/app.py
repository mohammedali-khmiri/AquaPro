from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import scraper  # On importe votre script scraper.py
from pymongo import MongoClient

app = FastAPI(title="FTN Natation API Wrapper", version="1.0")

# 🌟 Activation de CORS pour permettre à Angular (ou autre) d'appeler l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # À restreindre en production (ex: http://localhost:4200)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URI = "mongodb://mongodb:27017"
DB_NAME = "ftn_natation"

# Modèle pour configurer le scrape via une requête POST
class ScrapeConfig(BaseModel):
    skip_pdfs: bool = False
    ocr: bool = False
    max_pages: int = None

# Variable globale pour suivre l'état en temps réel
scraper_status = {"status": "idle", "last_run": None}

def background_scrape_task(config: ScrapeConfig):
    """Tâche de fond exécutée hors du thread principal de l'API"""
    global scraper_status
    scraper_status["status"] = "running"
    try:
        # Appel direct de la fonction de votre script original
        scraper.run(
            mongo_uri=MONGO_URI,
            db_name=DB_NAME,
            max_post_pages=config.max_pages,
            skip_pdfs=config.skip_pdfs,
            ocr=config.ocr
        )
        scraper_status["status"] = "completed"
    except Exception as e:
        scraper_status["status"] = "failed"
        scraper_status["error"] = str(e)

# ── 1. PILOTAGE DU SCRAPER ─────────────────────────────────────────────────────

@app.post("/api/scrape/start", summary="Déclencher le scraping en arrière-plan")
def start_scrape(config: ScrapeConfig, background_tasks: BackgroundTasks):
    if scraper_status["status"] == "running":
        return {"message": "Le scraper est déjà en train de tourner !"}

    # On lance le scraping en tâche de fond pour ne pas bloquer l'API
    background_tasks.add_task(background_scrape_task, config)
    return {"message": "Scraping démarré avec succès en arrière-plan."}

@app.get("/api/scrape/status", summary="Vérifier l'état actuel du scraper")
def get_scrape_status():
    # Récupère aussi le dernier log enregistré en base de données
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        last_log = db["scrape_log"].find_one(sort=[("scraped_at", -1)])
        if last_log:
            last_log["_id"] = str(last_log["_id"]) # Conversion de l'ObjectId pour le JSON
            scraper_status["last_db_log"] = last_log
    except Exception:
        pass
    return scraper_status

# ── 2. RÉCUPÉRATION DES DONNÉES MONGO ─────────────────────────────────────────

@app.get("/api/data/{collection_name}", summary="Récupérer les documents d'une collection")
def get_collection_data(collection_name: str, limit: int = 50, skip: int = 0):
    valid_collections = ["posts", "pages", "sections", "categories", "clubs", "staff", "media", "pdf_documents"]
    if collection_name not in valid_collections:
        raise HTTPException(status_code=400, detail=f"Collection invalide. Choisissez parmi : {valid_collections}")

    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]

        # Récupération dynamique des données
        cursor = db[collection_name].find().skip(skip).limit(limit)

        data = []
        for doc in cursor:
            doc["_id"] = str(doc["_id"]) # Sérialisation de l'id Mongo
            data.append(doc)

        return {
            "collection": collection_name,
            "count": len(data),
            "data": data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))