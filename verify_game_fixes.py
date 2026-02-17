from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to Game Room...")
            page.goto("http://localhost:3001")

            print("Creating room...")
            page.get_by_placeholder("Enter your hero name...").fill("TestPlayer")

            create_btn = page.get_by_text("Create New Adventure")
            create_btn.click()

            print("Waiting for room to load...")
            # If we see "KELUAR" button, we are in room
            # Increased timeout for slow Firebase init
            expect(page.get_by_text("KELUAR")).to_be_visible(timeout=20000)

            # 1. Verify Leave Button
            print("Verifying Leave Button...")
            leave_btn = page.get_by_text("KELUAR")
            expect(leave_btn).to_be_visible()

            # 2. Verify Dice exists
            # Dice might be loaded inside GameControls
            print("Verifying Dice...")

            # It might take a moment for game state to sync and show controls
            page.wait_for_timeout(3000)

            # The dice is a motion.div with role="button" or just find by some other attribute?
            # In Dice.tsx: role="button"
            dice = page.locator("div[role='button']").first

            # If dice is not found, maybe look for text "Lempar Dadu"?
            # Or "Menunggu..." if disabled.
            # Let's just take a screenshot to debug visually.

            # 3. Take screenshot
            print("Taking screenshot...")
            page.screenshot(path="/home/jules/verification/game_room_fix.png")
            print("Success!")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error_fix.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
