"""Iteration 3: site-texts, settings, PDF upload backend tests."""
import os
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@artist.com"
ADMIN_PASSWORD = "Admin123!"

# Minimal valid PDF
PDF_BYTES = b"%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>%%EOF"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def auth_headers(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


# ---------------- Site Texts ----------------
def test_get_site_texts_initial(s):
    r = s.get(f"{API}/site-texts")
    assert r.status_code == 200
    data = r.json()
    assert "es" in data and "en" in data
    assert isinstance(data["es"], dict) and isinstance(data["en"], dict)


def test_put_site_texts_requires_admin(s):
    r = s.put(f"{API}/site-texts", json={"es": {}, "en": {}})
    assert r.status_code == 401


def test_put_site_texts_saves_and_retrieves(s, auth_headers):
    payload = {"es": {"home": {"hero1": "Arte"}}, "en": {"home": {"hero1": "Art"}}}
    r = s.put(f"{API}/site-texts", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    saved = r.json()
    assert saved["es"]["home"]["hero1"] == "Arte"
    assert saved["en"]["home"]["hero1"] == "Art"
    # GET roundtrip
    r2 = s.get(f"{API}/site-texts")
    assert r2.status_code == 200
    fetched = r2.json()
    assert fetched["es"]["home"]["hero1"] == "Arte"
    assert fetched["en"]["home"]["hero1"] == "Art"


# ---------------- Settings ----------------
def test_get_settings_initial(s, auth_headers):
    # First clear to ensure pristine state
    s.put(f"{API}/settings", json={"catalog_pdf_url": None, "catalog_pdf_filename": None}, headers=auth_headers)
    r = s.get(f"{API}/settings")
    assert r.status_code == 200
    data = r.json()
    assert "catalog_pdf_url" in data
    assert "catalog_pdf_filename" in data
    assert data["catalog_pdf_url"] is None
    assert data["catalog_pdf_filename"] is None


def test_put_settings_requires_admin(s):
    r = s.put(f"{API}/settings", json={"catalog_pdf_url": "/api/files/abc", "catalog_pdf_filename": "x.pdf"})
    assert r.status_code == 401


def test_put_settings_updates(s, auth_headers):
    payload = {"catalog_pdf_url": "/api/files/test123", "catalog_pdf_filename": "catalogo.pdf"}
    r = s.put(f"{API}/settings", json=payload, headers=auth_headers)
    assert r.status_code == 200
    data = r.json()
    assert data["catalog_pdf_url"] == "/api/files/test123"
    assert data["catalog_pdf_filename"] == "catalogo.pdf"
    # GET verify
    r2 = s.get(f"{API}/settings")
    assert r2.json()["catalog_pdf_url"] == "/api/files/test123"


# ---------------- PDF Upload ----------------
def test_pdf_upload_requires_auth(s):
    files = {"file": ("c.pdf", PDF_BYTES, "application/pdf")}
    r = s.post(f"{API}/uploads/pdf", files=files)
    assert r.status_code == 401


def test_pdf_upload_rejects_non_pdf(s, auth_headers):
    files = {"file": ("a.txt", b"hello", "text/plain")}
    r = s.post(f"{API}/uploads/pdf", files=files, headers=auth_headers)
    assert r.status_code == 400


def test_pdf_upload_success_and_download(s, auth_headers):
    files = {"file": ("catalog.pdf", PDF_BYTES, "application/pdf")}
    r = s.post(f"{API}/uploads/pdf", files=files, headers=auth_headers)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "id" in d
    assert d["url"] == f"/api/files/{d['id']}"
    assert d["filename"] == "catalog.pdf"
    assert isinstance(d["size"], int) and d["size"] > 0
    # download
    r2 = s.get(f"{BASE_URL}{d['url']}")
    assert r2.status_code == 200
    assert r2.headers.get("content-type", "").startswith("application/pdf")
    assert len(r2.content) > 0


# ---------------- Cleanup (run last) ----------------
def test_z_cleanup_restore_pristine_state(s, auth_headers):
    r1 = s.put(f"{API}/site-texts", json={"es": {}, "en": {}}, headers=auth_headers)
    assert r1.status_code == 200
    r2 = s.put(
        f"{API}/settings",
        json={"catalog_pdf_url": None, "catalog_pdf_filename": None},
        headers=auth_headers,
    )
    assert r2.status_code == 200
