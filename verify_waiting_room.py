from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to Game Room...")
            page.goto("http://localhost:3001")

            print("Creating room...")
            page.get_by_placeholder("Enter your hero name...").fill("WaitingRoomTester")

            create_btn = page.get_by_text("Create New Adventure")
            create_btn.click()

            print("Waiting for room to load (Waiting Room state)...")
            # Waiting room should have the code visible
            expect(page.get_by_text("KODE RUANG")).to_be_visible(timeout=30000)

            print("Taking screenshot of Waiting Room...")
            page.wait_for_timeout(1000) # Wait for animations
            page.screenshot(path="/home/jules/verification/waiting_room_new.png")
            print("Success!")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error_waiting_room.png")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
