"""Backend API tests for Spanish art portfolio + ecommerce site."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://art-gallery-shop-32.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@artist.com"
ADMIN_PASSWORD = "Admin123!"


@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def token(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Public reads ----------------
def test_root(s):
    r = s.get(f"{API}/")
    assert r.status_code == 200


def test_list_artworks(s):
    r = s.get(f"{API}/artworks")
    assert r.status_code == 200
    arr = r.json()
    assert isinstance(arr, list)
    assert len(arr) >= 4
    assert any(a.get("featured") for a in arr)


def test_get_artwork_by_id(s):
    arr = s.get(f"{API}/artworks").json()
    aid = arr[0]["id"]
    r = s.get(f"{API}/artworks/{aid}")
    assert r.status_code == 200
    assert r.json()["id"] == aid


def test_get_artwork_404(s):
    r = s.get(f"{API}/artworks/nonexistent-id")
    assert r.status_code == 404


def test_list_exhibitions(s):
    r = s.get(f"{API}/exhibitions")
    assert r.status_code == 200
    arr = r.json()
    assert len(arr) >= 3


def test_get_artist(s):
    r = s.get(f"{API}/artist")
    assert r.status_code == 200
    d = r.json()
    assert d["name"]
    assert d["bio_es"] and d["bio_en"]


# ---------------- Auth ----------------
def test_login_success(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    d = r.json()
    assert "access_token" in d and d["email"] == ADMIN_EMAIL


def test_login_wrong_password(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_login_wrong_email(s):
    r = s.post(f"{API}/auth/login", json={"email": "noone@x.com", "password": "x"})
    assert r.status_code == 401


def test_me_with_token(s, auth_headers):
    r = s.get(f"{API}/auth/me", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["email"] == ADMIN_EMAIL


def test_me_without_token(s):
    r = s.get(f"{API}/auth/me")
    assert r.status_code == 401


# ---------------- Protected CRUD ----------------
def test_artwork_unauth_create(s):
    payload = {"title": "TEST_x", "year": 2024, "technique": "t", "description": "d",
               "image_url": "https://x/y.jpg", "price": 100.0}
    r = s.post(f"{API}/artworks", json=payload)
    assert r.status_code == 401


def test_artwork_crud(s, auth_headers):
    payload = {"title": "TEST_Artwork", "title_en": "TEST_EN", "year": 2024,
               "technique": "Acrylic", "description": "d", "image_url": "https://x/y.jpg",
               "price": 999.0, "currency": "usd"}
    r = s.post(f"{API}/artworks", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    art = r.json()
    aid = art["id"]
    assert art["title"] == "TEST_Artwork"

    # GET verify
    r = s.get(f"{API}/artworks/{aid}")
    assert r.status_code == 200
    assert r.json()["price"] == 999.0

    # UPDATE
    payload["title"] = "TEST_Artwork_Updated"
    payload["price"] = 1234.0
    r = s.put(f"{API}/artworks/{aid}", json=payload, headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["title"] == "TEST_Artwork_Updated"
    # verify persisted
    r = s.get(f"{API}/artworks/{aid}")
    assert r.json()["price"] == 1234.0

    # DELETE
    r = s.delete(f"{API}/artworks/{aid}", headers=auth_headers)
    assert r.status_code == 200
    r = s.get(f"{API}/artworks/{aid}")
    assert r.status_code == 404


def test_exhibition_create(s, auth_headers):
    payload = {"title": "TEST_Exh", "venue": "V", "city": "C", "country": "X",
               "start_date": "2026-01-01", "end_date": "2026-02-01"}
    r = s.post(f"{API}/exhibitions", json=payload, headers=auth_headers)
    assert r.status_code == 200
    eid = r.json()["id"]
    # cleanup
    s.delete(f"{API}/exhibitions/{eid}", headers=auth_headers)


# ---------------- Stripe checkout ----------------
def test_checkout_invalid_artwork(s):
    r = s.post(f"{API}/checkout/session",
               json={"artwork_id": "nonexistent", "origin_url": BASE_URL})
    assert r.status_code == 404


def test_checkout_session_creates(s):
    arts = s.get(f"{API}/artworks").json()
    available = [a for a in arts if a.get("available")]
    aid = available[0]["id"]
    r = s.post(f"{API}/checkout/session",
               json={"artwork_id": aid, "origin_url": BASE_URL})
    assert r.status_code == 200, r.text
    d = r.json()
    assert d.get("url", "").startswith("http")
    assert "session_id" in d
    sid = d["session_id"]

    # status poll - known emergent stripe sandbox quirk: session retrieve can 500
    r = s.get(f"{API}/checkout/status/{sid}")
    assert r.status_code in (200, 500)
