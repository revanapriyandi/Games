from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"BROWSER CONSOLE: {msg.text}"))
        page.on("pageerror", lambda err: print(f"BROWSER ERROR: {err}"))

        try:
            print("Navigating to Game Room...")
            page.goto("http://localhost:3001")

            print("Creating room...")
            page.get_by_placeholder("Enter your hero name...").fill("TestPlayer")

            create_btn = page.get_by_text("Create New Adventure")
            create_btn.click()

            print("Waiting for room to load...")
            expect(page.get_by_text("KELUAR")).to_be_visible(timeout=30000)

            # Wait for Start Game button
            start_btn = page.locator("button:has-text('MULAI PERMAINAN')")
            if start_btn.is_visible():
                print("Found Start Game button. Clicking...")
                start_btn.click()
            else:
                print("Start Game button not found immediately. Checking if already playing...")

            print("Verifying Dice...")
            page.wait_for_timeout(5000) # Wait for game start sync

            # Locate dice button. In Dice.tsx, it's a div with role="button" inside GameControls
            # We look for something clickable.
            # Assuming it's the large dice area.
            dice = page.locator("div[role='button']").first

            if dice.is_visible():
                print("Dice found! Clicking...")
                dice.click()
                print("Clicked dice.")

                # Wait for roll animation and result
                page.wait_for_timeout(5000)

                print("Taking screenshot after roll...")
                page.screenshot(path="/home/jules/verification/after_roll.png")
            else:
                print("Dice not found or not visible!")
                page.screenshot(path="/home/jules/verification/no_dice.png")

            print("Success!")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error_fix.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
