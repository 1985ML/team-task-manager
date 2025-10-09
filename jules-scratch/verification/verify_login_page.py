from playwright.sync_api import sync_playwright, expect

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:3000/auth/login", timeout=30000)

        # Wait for the heading to be visible to ensure the page has loaded
        # Increased the timeout to 20 seconds
        heading = page.get_by_role("heading", name="Welcome back")
        expect(heading).to_be_visible(timeout=20000)

        # Add a small delay for rendering to settle
        page.wait_for_timeout(1000)

        page.screenshot(path="jules-scratch/verification/verification.png")
        browser.close()

if __name__ == "__main__":
    main()