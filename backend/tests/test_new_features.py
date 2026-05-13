"""Backend tests for new features: uploads, file download, reorder, seed cleanup, gallery images.

NOTE: Tests are written in deliberate order. The new POST /api/artworks endpoint auto-deletes
all seed artworks when the first real artwork is created. So tests that depend on seeded data
(list new fields, seed cleanup behavior) run BEFORE any test that creates real artworks.
"""
import io
import os
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"
ADMIN_EMAIL = "admin@artist.com"
ADMIN_PASSWORD = "Admin123!"


@pytest.fixture(scope="module")
def s():
    return requests.Session()


@pytest.fixture(scope="module")
def auth_headers(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


# Minimal valid 1x1 PNG bytes
PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0"
    b"\x00\x00\x00\x03\x00\x01\\\xcd\xff\x69\x00\x00\x00\x00IEND\xaeB`\x82"
)


# ---------------- Uploads ----------------
def test_upload_requires_auth(s):
    files = {"file": ("a.png", PNG_BYTES, "image/png")}
    r = s.post(f"{API}/uploads/image", files=files)
    assert r.status_code == 401


def test_upload_rejects_unsupported_type(s, auth_headers):
    files = {"file": ("a.txt", b"hello", "text/plain")}
    r = s.post(f"{API}/uploads/image", files=files, headers=auth_headers)
    assert r.status_code == 400


def test_upload_png_returns_id_url_size_and_file_downloadable(s, auth_headers):
    files = {"file": ("test.png", PNG_BYTES, "image/png")}
    r = s.post(f"{API}/uploads/image", files=files, headers=auth_headers)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "id" in d and "url" in d and "size" in d
    assert d["url"] == f"/api/files/{d['id']}"
    assert isinstance(d["size"], int) and d["size"] > 0

    # download
    r2 = s.get(f"{BASE_URL}{d['url']}")
    assert r2.status_code == 200
    assert r2.headers.get("content-type", "").startswith("image/")
    assert len(r2.content) > 0


def test_upload_jpg(s, auth_headers):
    # tiny invalid jpg bytes but server only checks content_type header
    files = {"file": ("t.jpg", b"\xff\xd8\xff\xd9", "image/jpeg")}
    r = s.post(f"{API}/uploads/image", files=files, headers=auth_headers)
    assert r.status_code == 200, r.text


def test_file_404_for_unknown(s):
    r = s.get(f"{API}/files/nonexistent-id-xyz")
    assert r.status_code == 404


# ---------------- Artwork images + is_seed fields (run BEFORE any POST /artworks) ----------------
def test_a1_list_artworks_includes_new_fields(s):
    r = s.get(f"{API}/artworks")
    assert r.status_code == 200
    arr = r.json()
    assert len(arr) >= 1
    for a in arr:
        assert "images" in a and isinstance(a["images"], list)
        assert "is_seed" in a and isinstance(a["is_seed"], bool)


# ---------------- Seed cleanup on first real (runs early before other POST /artworks) ----------------
def test_a2_seed_cleanup_on_first_real_artwork(s, auth_headers):
    # Ensure no real artworks exist - delete any real (non-seed) ones first
    arts = s.get(f"{API}/artworks").json()
    real_ids = [a["id"] for a in arts if not a.get("is_seed")]
    for rid in real_ids:
        s.delete(f"{API}/artworks/{rid}", headers=auth_headers)

    seeds_before = [a for a in s.get(f"{API}/artworks").json() if a.get("is_seed")]
    assert len(seeds_before) > 0, "Expected seeded artworks present"

    # Create first real artwork - should trigger seed cleanup
    payload = {
        "title": "TEST_FirstReal",
        "year": 2024, "technique": "T", "description": "D",
        "image_url": "https://example.com/m.jpg",
        "price": 100.0, "currency": "usd",
    }
    r = s.post(f"{API}/artworks", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    new_art = r.json()
    aid = new_art["id"]
    assert new_art["is_seed"] is False

    after = s.get(f"{API}/artworks").json()
    assert all(not a.get("is_seed") for a in after), f"Seeds not cleaned: {after}"
    assert any(a["id"] == aid for a in after)
    s.delete(f"{API}/artworks/{aid}", headers=auth_headers)


def test_create_artwork_persists_images_array(s, auth_headers):
    payload = {
        "title": "TEST_GalleryArt",
        "year": 2024,
        "technique": "T",
        "description": "D",
        "image_url": "https://example.com/main.jpg",
        "images": ["https://example.com/g1.jpg", "https://example.com/g2.jpg"],
        "price": 100.0,
        "currency": "usd",
    }
    r = s.post(f"{API}/artworks", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    art = r.json()
    aid = art["id"]
    try:
        assert art["images"] == payload["images"]
        assert art["is_seed"] is False
        # GET verify
        g = s.get(f"{API}/artworks/{aid}").json()
        assert g["images"] == payload["images"]
        assert g["is_seed"] is False
    finally:
        s.delete(f"{API}/artworks/{aid}", headers=auth_headers)


# ---------------- Reorder ----------------
def test_reorder_artworks_requires_auth(s):
    r = s.put(f"{API}/artworks/reorder", json=[])
    assert r.status_code == 401


def test_reorder_updates_orders(s, auth_headers):
    # Self-contained: create 2 test artworks
    def mk(title, order):
        return {
            "title": title, "year": 2024, "technique": "T", "description": "D",
            "image_url": "https://e/m.jpg", "price": 1.0, "currency": "usd", "order": order,
        }
    r1 = s.post(f"{API}/artworks", json=mk("TEST_R1", 100), headers=auth_headers)
    r2 = s.post(f"{API}/artworks", json=mk("TEST_R2", 101), headers=auth_headers)
    a0_id, a1_id = r1.json()["id"], r2.json()["id"]
    try:
        new_items = [{"id": a0_id, "order": 999}, {"id": a1_id, "order": 998}]
        r = s.put(f"{API}/artworks/reorder", json=new_items, headers=auth_headers)
        assert r.status_code == 200, r.text
        assert r.json().get("updated") == 2
        refreshed = {a["id"]: a["order"] for a in s.get(f"{API}/artworks").json()}
        assert refreshed[a0_id] == 999
        assert refreshed[a1_id] == 998
    finally:
        s.delete(f"{API}/artworks/{a0_id}", headers=auth_headers)
        s.delete(f"{API}/artworks/{a1_id}", headers=auth_headers)


# ---------------- Seed cleanup for exhibitions ----------------
def test_seed_cleanup_on_first_real_exhibition(s, auth_headers):
    exhs = s.get(f"{API}/exhibitions").json()
    real_ids = [e["id"] for e in exhs if not e.get("is_seed")]
    for rid in real_ids:
        s.delete(f"{API}/exhibitions/{rid}", headers=auth_headers)

    seeds_before = [e for e in s.get(f"{API}/exhibitions").json() if e.get("is_seed")]
    if len(seeds_before) == 0:
        pytest.skip("No seed exhibitions present (already cleaned)")

    payload = {
        "title": "TEST_FirstRealExh", "venue": "V", "city": "C", "country": "X",
        "start_date": "2026-01-01", "end_date": "2026-02-01",
    }
    r = s.post(f"{API}/exhibitions", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    eid = r.json()["id"]
    after = s.get(f"{API}/exhibitions").json()
    assert all(not e.get("is_seed") for e in after)
    s.delete(f"{API}/exhibitions/{eid}", headers=auth_headers)
