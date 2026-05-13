from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, status, UploadFile, File, Header, Query, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import requests
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"
JWT_EXP_HOURS = 24 * 7
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
STRIPE_API_KEY = os.environ["STRIPE_API_KEY"]
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "elena-cruz-gallery"
storage_key: Optional[str] = None


def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    if not EMERGENT_LLM_KEY:
        raise RuntimeError("EMERGENT_LLM_KEY not configured")
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_LLM_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str) -> tuple:
    key = init_storage()
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

app = FastAPI()
api = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


# ---------------- Models ----------------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    email: str


class Artwork(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    title_en: Optional[str] = None
    year: int
    technique: str
    technique_en: Optional[str] = None
    description: str
    description_en: Optional[str] = None
    image_url: str
    images: List[str] = Field(default_factory=list)
    price: float
    currency: str = "usd"
    dimensions: Optional[str] = None
    available: bool = True
    featured: bool = False
    order: int = 0
    is_seed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ArtworkInput(BaseModel):
    title: str
    title_en: Optional[str] = None
    year: int
    technique: str
    technique_en: Optional[str] = None
    description: str
    description_en: Optional[str] = None
    image_url: str
    images: List[str] = Field(default_factory=list)
    price: float
    currency: str = "usd"
    dimensions: Optional[str] = None
    available: bool = True
    featured: bool = False
    order: int = 0


class ReorderItem(BaseModel):
    id: str
    order: int


class Exhibition(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    title_en: Optional[str] = None
    venue: str
    city: str
    country: str
    start_date: str  # ISO date
    end_date: str
    description: Optional[str] = None
    description_en: Optional[str] = None
    image_url: Optional[str] = None
    is_seed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ExhibitionInput(BaseModel):
    title: str
    title_en: Optional[str] = None
    venue: str
    city: str
    country: str
    start_date: str
    end_date: str
    description: Optional[str] = None
    description_en: Optional[str] = None
    image_url: Optional[str] = None


class ArtistInfo(BaseModel):
    name: str
    bio_es: str
    bio_en: str
    portrait_url: str
    email: str
    instagram: Optional[str] = None


class CheckoutCreate(BaseModel):
    artwork_id: str
    origin_url: str
    buyer_email: Optional[EmailStr] = None


# ---------------- Auth helpers ----------------
def create_token(email: str) -> str:
    payload = {
        "sub": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def require_admin(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> str:
    if creds is None:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALG])
        email = payload.get("sub")
        if email != ADMIN_EMAIL:
            raise HTTPException(status_code=403, detail="Forbidden")
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------------- Seed ----------------
SAMPLE_ARTWORKS = [
    {
        "title": "Resonancia Cromática",
        "title_en": "Chromatic Resonance",
        "year": 2024,
        "technique": "Acrílico sobre lienzo",
        "technique_en": "Acrylic on canvas",
        "description": "Una exploración del color como lenguaje emocional. Las formas dialogan en un espacio donde la geometría se rinde al gesto.",
        "description_en": "An exploration of color as emotional language. Forms converse in a space where geometry surrenders to gesture.",
        "image_url": "https://images.unsplash.com/photo-1772882971868-1bb960ebf150?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHw0fHx2aWJyYW50JTIwYWJzdHJhY3QlMjBjb2xvcmZ1bCUyMGNvbnRlbXBvcmFyeSUyMGFydCUyMHBhaW50aW5nfGVufDB8fHx8MTc3ODY4MzA0Nnww&ixlib=rb-4.1.0&q=85",
        "price": 1800.00,
        "currency": "usd",
        "dimensions": "120 × 90 cm",
        "available": True,
        "featured": True,
        "order": 1,
    },
    {
        "title": "Geometría del Asombro",
        "title_en": "Geometry of Wonder",
        "year": 2024,
        "technique": "Óleo y pigmento sobre tela",
        "technique_en": "Oil and pigment on canvas",
        "description": "Capas de pigmento que vibran entre la disciplina del trazo y la libertad del impulso. El asombro se construye en cada superposición.",
        "description_en": "Layers of pigment vibrating between disciplined line and free impulse. Wonder builds in each overlap.",
        "image_url": "https://images.unsplash.com/photo-1772056380652-e0cf143f350a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHwzfHxjb250ZW1wb3JhcnklMjBhcnQlMjBnZW9tZXRyaWMlMjBicmlnaHQlMjBjb2xvcnN8ZW58MHx8fHwxNzc4NjgzMDQ2fDA&ixlib=rb-4.1.0&q=85",
        "price": 2400.00,
        "currency": "usd",
        "dimensions": "100 × 100 cm",
        "available": True,
        "featured": False,
        "order": 2,
    },
    {
        "title": "Memoria del Verano",
        "title_en": "Summer Memory",
        "year": 2023,
        "technique": "Técnica mixta sobre madera",
        "technique_en": "Mixed media on wood",
        "description": "Un campo de color que recuerda la luz de un instante. El gesto rápido se contrapone a la quietud de las masas planas.",
        "description_en": "A field of color that recalls the light of an instant. Quick gestures contrast with the stillness of flat masses.",
        "image_url": "https://images.unsplash.com/photo-1768572019427-2ce961caaece?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Nzh8MHwxfHNlYXJjaHwyfHx2aWJyYW50JTIwYWJzdHJhY3QlMjBjb2xvcmZ1bCUyMGNvbnRlbXBvcmFyeSUyMGFydCUyMHBhaW50aW5nfGVufDB8fHx8MTc3ODY4MzA0Nnww&ixlib=rb-4.1.0&q=85",
        "price": 1500.00,
        "currency": "usd",
        "dimensions": "80 × 60 cm",
        "available": True,
        "featured": False,
        "order": 3,
    },
    {
        "title": "Estructura Vibrante",
        "title_en": "Vibrant Structure",
        "year": 2024,
        "technique": "Acrílico sobre lienzo",
        "technique_en": "Acrylic on canvas",
        "description": "Bloques de color saturado construyen una arquitectura emocional. La obra se sostiene en el equilibrio frágil entre orden y caos.",
        "description_en": "Blocks of saturated color build an emotional architecture. The work rests on the fragile balance between order and chaos.",
        "image_url": "https://images.unsplash.com/photo-1772056378814-6311c337e28d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzB8MHwxfHNlYXJjaHwyfHxjb250ZW1wb3JhcnklMjBhcnQlMjBnZW9tZXRyaWMlMjBicmlnaHQlMjBjb2xvcnN8ZW58MHx8fHwxNzc4NjgzMDQ2fDA&ixlib=rb-4.1.0&q=85",
        "price": 2200.00,
        "currency": "usd",
        "dimensions": "110 × 90 cm",
        "available": True,
        "featured": False,
        "order": 4,
    },
]

SAMPLE_EXHIBITIONS = [
    {
        "title": "Color como Refugio",
        "title_en": "Color as Refuge",
        "venue": "Galería Espacio Norte",
        "city": "Madrid",
        "country": "España",
        "start_date": "2026-04-12",
        "end_date": "2026-06-30",
        "description": "Muestra individual con obras recientes en gran formato.",
        "description_en": "Solo show featuring recent large-format works.",
        "image_url": "https://images.unsplash.com/photo-1767706508416-414285b8bead?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwyfHxtaW5pbWFsaXN0JTIwbW9kZXJuJTIwYXJ0JTIwZXhoaWJpdGlvbiUyMHNwYWNlfGVufDB8fHx8MTc3ODY4MzAyNnww&ixlib=rb-4.1.0&q=85",
    },
    {
        "title": "Bienal Contemporánea",
        "title_en": "Contemporary Biennial",
        "venue": "Centro de Arte Moderno",
        "city": "Buenos Aires",
        "country": "Argentina",
        "start_date": "2026-09-05",
        "end_date": "2026-11-20",
        "description": "Participación en la 12ª edición de la Bienal Contemporánea.",
        "description_en": "Featured in the 12th edition of the Contemporary Biennial.",
        "image_url": None,
    },
    {
        "title": "Trazos en Diálogo",
        "title_en": "Lines in Dialogue",
        "venue": "Museum of Fine Arts",
        "city": "Lisbon",
        "country": "Portugal",
        "start_date": "2027-02-14",
        "end_date": "2027-05-10",
        "description": "Exposición colectiva junto a artistas de Iberoamérica.",
        "description_en": "Group exhibition with Ibero-American artists.",
        "image_url": None,
    },
]

DEFAULT_ARTIST = {
    "name": "Elena Cruz",
    "bio_es": "Elena Cruz (1985) es una pintora contemporánea cuya práctica explora la relación entre el color como emoción y la geometría como pensamiento. Su obra ha sido exhibida en galerías de Europa y América Latina y forma parte de colecciones privadas y públicas. Vive y trabaja entre Madrid y Buenos Aires.",
    "bio_en": "Elena Cruz (1985) is a contemporary painter whose practice explores the relationship between color as emotion and geometry as thought. Her work has been exhibited in galleries across Europe and Latin America and is part of private and public collections. She lives and works between Madrid and Buenos Aires.",
    "portrait_url": "https://images.unsplash.com/photo-1722252266922-d086481c3a8e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwyfHxibGFjayUyMGFuZCUyMHdoaXRlJTIwZWRpdG9yaWFsJTIwcG9ydHJhaXQlMjBhcnRpc3QlMjBpbiUyMHN0dWRpb3xlbnwwfHx8fDE3Nzg2ODMwMjZ8MA&ixlib=rb-4.1.0&q=85",
    "email": "studio@elenacruz.art",
    "instagram": "@elenacruz.studio",
}


async def seed_data():
    # Admin
    existing_admin = await db.admins.find_one({"email": ADMIN_EMAIL}, {"_id": 0})
    if not existing_admin:
        hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode(), bcrypt.gensalt()).decode()
        await db.admins.insert_one({"email": ADMIN_EMAIL, "password_hash": hashed})
        logger.info("Seeded admin user")

    # Artworks
    count = await db.artworks.count_documents({})
    if count == 0:
        for a in SAMPLE_ARTWORKS:
            obj = Artwork(**a, is_seed=True)
            doc = obj.model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.artworks.insert_one(doc)
        logger.info("Seeded artworks")
    else:
        # One-time migration: mark legacy seeded artworks (matching sample titles) as is_seed
        sample_titles = [a["title"] for a in SAMPLE_ARTWORKS]
        await db.artworks.update_many(
            {"title": {"$in": sample_titles}, "is_seed": {"$ne": True}},
            {"$set": {"is_seed": True}},
        )

    # Exhibitions
    exh_count = await db.exhibitions.count_documents({})
    if exh_count == 0:
        for e in SAMPLE_EXHIBITIONS:
            obj = Exhibition(**e, is_seed=True)
            doc = obj.model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.exhibitions.insert_one(doc)
        logger.info("Seeded exhibitions")
    else:
        sample_exh_titles = [e["title"] for e in SAMPLE_EXHIBITIONS]
        await db.exhibitions.update_many(
            {"title": {"$in": sample_exh_titles}, "is_seed": {"$ne": True}},
            {"$set": {"is_seed": True}},
        )

    # Artist info
    info = await db.artist_info.find_one({"_id": "main"}, {"_id": 0})
    if not info:
        await db.artist_info.insert_one({"_id": "main", **DEFAULT_ARTIST})
        logger.info("Seeded artist info")


@app.on_event("startup")
async def startup():
    await seed_data()
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.warning(f"Storage init failed (uploads will not work): {e}")


# ---------------- Auth Routes ----------------
@api.post("/auth/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    admin = await db.admins.find_one({"email": data.email}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not bcrypt.checkpw(data.password.encode(), admin["password_hash"].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(data.email)
    return TokenResponse(access_token=token, email=data.email)


@api.get("/auth/me")
async def me(email: str = Depends(require_admin)):
    return {"email": email}


# ---------------- Artist ----------------
@api.get("/artist", response_model=ArtistInfo)
async def get_artist():
    info = await db.artist_info.find_one({"_id": "main"}, {"_id": 0})
    if not info:
        raise HTTPException(404, "Not found")
    return ArtistInfo(**info)


@api.put("/artist", response_model=ArtistInfo)
async def update_artist(data: ArtistInfo, _: str = Depends(require_admin)):
    await db.artist_info.update_one(
        {"_id": "main"}, {"$set": data.model_dump()}, upsert=True
    )
    return data


# ---------------- Artworks ----------------
@api.get("/artworks", response_model=List[Artwork])
async def list_artworks():
    docs = await db.artworks.find({}, {"_id": 0}).sort("order", 1).to_list(500)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return [Artwork(**d) for d in docs]


@api.get("/artworks/{artwork_id}", response_model=Artwork)
async def get_artwork(artwork_id: str):
    doc = await db.artworks.find_one({"id": artwork_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Artwork not found")
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return Artwork(**doc)


@api.post("/artworks", response_model=Artwork)
async def create_artwork(data: ArtworkInput, _: str = Depends(require_admin)):
    # Auto-cleanup: when admin creates first real artwork, remove all seeded samples
    real_count = await db.artworks.count_documents({"is_seed": {"$ne": True}})
    if real_count == 0:
        await db.artworks.delete_many({"is_seed": True})
    obj = Artwork(**data.model_dump(), is_seed=False)
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.artworks.insert_one(doc)
    return obj


@api.put("/artworks/reorder")
async def reorder_artworks(items: List[ReorderItem], _: str = Depends(require_admin)):
    for it in items:
        await db.artworks.update_one({"id": it.id}, {"$set": {"order": it.order}})
    return {"ok": True, "updated": len(items)}


@api.put("/artworks/{artwork_id}", response_model=Artwork)
async def update_artwork(artwork_id: str, data: ArtworkInput, _: str = Depends(require_admin)):
    result = await db.artworks.update_one({"id": artwork_id}, {"$set": data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(404, "Artwork not found")
    doc = await db.artworks.find_one({"id": artwork_id}, {"_id": 0})
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return Artwork(**doc)


@api.delete("/artworks/{artwork_id}")
async def delete_artwork(artwork_id: str, _: str = Depends(require_admin)):
    result = await db.artworks.delete_one({"id": artwork_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Artwork not found")
    return {"ok": True}


# ---------------- Exhibitions ----------------
@api.get("/exhibitions", response_model=List[Exhibition])
async def list_exhibitions():
    docs = await db.exhibitions.find({}, {"_id": 0}).sort("start_date", 1).to_list(500)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return [Exhibition(**d) for d in docs]


@api.post("/exhibitions", response_model=Exhibition)
async def create_exhibition(data: ExhibitionInput, _: str = Depends(require_admin)):
    real_count = await db.exhibitions.count_documents({"is_seed": {"$ne": True}})
    if real_count == 0:
        await db.exhibitions.delete_many({"is_seed": True})
    obj = Exhibition(**data.model_dump(), is_seed=False)
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.exhibitions.insert_one(doc)
    return obj


@api.put("/exhibitions/{exhibition_id}", response_model=Exhibition)
async def update_exhibition(exhibition_id: str, data: ExhibitionInput, _: str = Depends(require_admin)):
    result = await db.exhibitions.update_one({"id": exhibition_id}, {"$set": data.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(404, "Exhibition not found")
    doc = await db.exhibitions.find_one({"id": exhibition_id}, {"_id": 0})
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return Exhibition(**doc)


@api.delete("/exhibitions/{exhibition_id}")
async def delete_exhibition(exhibition_id: str, _: str = Depends(require_admin)):
    result = await db.exhibitions.delete_one({"id": exhibition_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Exhibition not found")
    return {"ok": True}


# ---------------- Stripe Checkout ----------------
@api.post("/checkout/session")
async def create_checkout(data: CheckoutCreate, http_request: Request):
    artwork = await db.artworks.find_one({"id": data.artwork_id}, {"_id": 0})
    if not artwork:
        raise HTTPException(404, "Artwork not found")
    if not artwork.get("available", True):
        raise HTTPException(400, "Artwork not available")

    amount = float(artwork["price"])
    currency = artwork.get("currency", "usd")

    host_url = str(http_request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)

    origin = data.origin_url.rstrip("/")
    success_url = f"{origin}/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/works/{data.artwork_id}"

    metadata = {
        "artwork_id": data.artwork_id,
        "artwork_title": artwork.get("title", ""),
        "buyer_email": data.buyer_email or "",
    }

    req = CheckoutSessionRequest(
        amount=amount,
        currency=currency,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(req)

    tx = {
        "session_id": session.session_id,
        "artwork_id": data.artwork_id,
        "amount": amount,
        "currency": currency,
        "metadata": metadata,
        "payment_status": "initiated",
        "status": "open",
        "buyer_email": data.buyer_email,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_transactions.insert_one(tx)
    return {"url": session.url, "session_id": session.session_id}


@api.get("/checkout/status/{session_id}")
async def checkout_status(session_id: str, http_request: Request):
    tx = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if not tx:
        raise HTTPException(404, "Session not found")

    # If already finalized, return as-is
    if tx.get("payment_status") == "paid":
        return {
            "status": tx.get("status"),
            "payment_status": tx.get("payment_status"),
            "amount": tx.get("amount"),
            "currency": tx.get("currency"),
            "artwork_id": tx.get("artwork_id"),
        }

    host_url = str(http_request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    status_resp: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)

    new_payment_status = status_resp.payment_status
    new_status = status_resp.status

    update = {"payment_status": new_payment_status, "status": new_status}
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": update})

    # If paid for first time, mark artwork as unavailable
    if new_payment_status == "paid" and tx.get("payment_status") != "paid":
        await db.artworks.update_one(
            {"id": tx["artwork_id"]}, {"$set": {"available": False}}
        )

    return {
        "status": new_status,
        "payment_status": new_payment_status,
        "amount": tx.get("amount"),
        "currency": tx.get("currency"),
        "artwork_id": tx.get("artwork_id"),
    }


@api.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    try:
        evt = await stripe_checkout.handle_webhook(body, signature)
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(400, "Invalid webhook")

    if evt.session_id:
        tx = await db.payment_transactions.find_one({"session_id": evt.session_id}, {"_id": 0})
        if tx and tx.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"session_id": evt.session_id},
                {"$set": {"payment_status": evt.payment_status, "status": "complete"}},
            )
            if evt.payment_status == "paid":
                await db.artworks.update_one(
                    {"id": tx["artwork_id"]}, {"$set": {"available": False}}
                )
    return {"received": True}


@api.get("/")
async def root():
    return {"message": "Gallery API"}


# ---------------- Uploads ----------------
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


@api.post("/uploads/image")
async def upload_image(file: UploadFile = File(...), _: str = Depends(require_admin)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(400, "File too large (max 10 MB)")
    ext = (file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "bin").lower()
    file_id = str(uuid.uuid4())
    storage_path = f"{APP_NAME}/artworks/{file_id}.{ext}"
    try:
        result = put_object(storage_path, data, file.content_type)
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(500, "Upload failed")
    await db.files.insert_one({
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    # Public URL through our own /api/files/{id} proxy
    public_url = f"/api/files/{file_id}"
    return {"id": file_id, "url": public_url, "size": result.get("size", len(data))}


@api.get("/files/{file_id}")
async def download_file(file_id: str):
    record = await db.files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(404, "File not found")
    try:
        data, content_type = get_object(record["storage_path"])
    except Exception as e:
        logger.error(f"Download failed: {e}")
        raise HTTPException(500, "Download failed")
    return Response(
        content=data,
        media_type=record.get("content_type", content_type),
        headers={"Cache-Control": "public, max-age=31536000, immutable"},
    )


app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
