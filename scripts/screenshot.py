"""
Screenshot worker — runs locally on your Mac.
Watches Supabase for previews without screenshots, takes them with Playwright,
uploads to Supabase Storage, and saves the URL back to the previews table.

Run: python3 scripts/screenshot.py
"""

import time
import requests
from io import BytesIO
from playwright.sync_api import sync_playwright

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = "https://aszrhjxnxyecfdvndcvi.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzenJoanhueHllY2Zkdm5kY3ZpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc1MDY5MiwiZXhwIjoyMDk1MzI2NjkyfQ.967bKoHOv_UjeB0nF4wp7jdIiw-CGD2XJRajbtZYKEI"
PREVIEW_BASE_URL = "https://nexus-agency-formore.vercel.app/preview"
STORAGE_BUCKET = "preview-screenshots"
POLL_INTERVAL = 30  # seconds between checks
# ──────────────────────────────────────────────────────────────────────────────

HEADERS = {
    "apikey": SUPABASE_SERVICE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
    "Content-Type": "application/json",
}


def get_pending_previews():
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/previews?screenshot_url=is.null&select=id&limit=10",
        headers=HEADERS,
        timeout=10,
    )
    return resp.json() if resp.ok else []


def take_screenshot(preview_id: str) -> bytes | None:
    url = f"{PREVIEW_BASE_URL}/{preview_id}"
    print(f"  [screenshot] Visiting {url}")
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={"width": 1280, "height": 900})
            page.goto(url, wait_until="networkidle", timeout=30000)
            page.wait_for_timeout(2000)  # let fonts/images settle
            screenshot = page.screenshot(full_page=False)
            browser.close()
            return screenshot
    except Exception as e:
        print(f"  [screenshot] Error: {e}")
        return None


def upload_screenshot(preview_id: str, image_bytes: bytes) -> str | None:
    path = f"{preview_id}.png"
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{STORAGE_BUCKET}/{path}"
    resp = requests.post(
        upload_url,
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "Content-Type": "image/png",
        },
        data=image_bytes,
        timeout=30,
    )
    if resp.ok:
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{STORAGE_BUCKET}/{path}"
        return public_url
    else:
        print(f"  [screenshot] Upload failed: {resp.text}")
        return None


def save_screenshot_url(preview_id: str, url: str):
    resp = requests.patch(
        f"{SUPABASE_URL}/rest/v1/previews?id=eq.{preview_id}",
        headers={**HEADERS, "Prefer": "return=minimal"},
        json={"screenshot_url": url},
        timeout=10,
    )
    return resp.ok


def run_once():
    previews = get_pending_previews()
    if not previews:
        print(f"[screenshot] No pending previews. Sleeping {POLL_INTERVAL}s...")
        return

    print(f"[screenshot] Found {len(previews)} preview(s) to screenshot.")
    for preview in previews:
        preview_id = preview["id"]
        print(f"  Processing {preview_id}...")

        image_bytes = take_screenshot(preview_id)
        if not image_bytes:
            continue

        public_url = upload_screenshot(preview_id, image_bytes)
        if not public_url:
            continue

        if save_screenshot_url(preview_id, public_url):
            print(f"  Done: {public_url}")
        else:
            print(f"  Failed to save URL for {preview_id}")


if __name__ == "__main__":
    print("[screenshot] Starting screenshot worker...")
    while True:
        run_once()
        time.sleep(POLL_INTERVAL)
