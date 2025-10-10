from playwright.sync_api import sync_playwright, Page, expect

def verify_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            # 1. Arrange: Go to the application's login page.
            page.goto("http://localhost:3000/auth/login")

            # 2. Act: Wait for the login page to load.
            # The main heading should be visible.
            login_heading = page.get_by_role("heading", name="Welcome back")
            expect(login_heading).to_be_visible()

            # 3. Screenshot: Capture the result for visual verification.
            page.screenshot(path="jules-scratch/verification/login-page.png")
            print("Screenshot saved to jules-scratch/verification/login-page.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    verify_dashboard()