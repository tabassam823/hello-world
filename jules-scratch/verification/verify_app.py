import time
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Go to the app
        page.goto("http://localhost:5173/")

        # It should redirect to login
        expect(page.get_by_role("heading", name="Sign In")).to_be_visible()

        # --- Register a new user ---
        page.get_by_role("link", name="Register").click()

        unique_email = f"user_{int(time.time())}@example.com"
        password = "password123"

        page.get_by_placeholder("Name").fill("Test User")
        page.get_by_placeholder("Email Address").fill(unique_email)
        page.get_by_placeholder("Password").fill(password)
        page.get_by_role("button", name="Register").click()

        # Expect a success message
        expect(page.get_by_text("Registration successful!")).to_be_visible()

        # --- Log in with the new user ---
        # Navigate to login page
        page.get_by_role("link", name="Login").click()
        expect(page.get_by_role("heading", name="Sign In")).to_be_visible()

        page.get_by_placeholder("Email Address").fill(unique_email)
        page.get_by_placeholder("Password").fill(password)
        page.get_by_role("button", name="Login").click()

        # Wait for dashboard to load
        expect(page.get_by_role("heading", name="Dashboard")).to_be_visible(timeout=10000)

        # --- Create a new note ---
        page.get_by_role("button", name="Create Note").click()
        expect(page.get_by_role("heading", name="Create a New Note")).to_be_visible()

        page.get_by_label("Title").fill("My Supabase Note")
        editor_frame = page.frame_locator('iframe').first
        editor_frame.locator('body').fill("This note is stored in Supabase.")
        page.get_by_role("button", name="Save Note").click()

        # --- Verify note is on the dashboard ---
        expect(page.get_by_role("heading", name="Dashboard")).to_be_visible()
        expect(page.get_by_role("heading", name="My Supabase Note")).to_be_visible()
        expect(page.get_by_text("This note is stored in Supabase.")).to_be_visible()

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/dashboard_with_supabase_note.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
