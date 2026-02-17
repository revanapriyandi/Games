from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a larger viewport for better screenshots
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        print("Navigating to Lobby...")
        page.goto("http://localhost:5173")

        # Verify Lobby elements
        print("Waiting for 'Customize Your Hero' text...")
        page.wait_for_selector("text=Customize Your Hero", timeout=15000)

        # Interact with Avatar Selector
        print("Finding Avatar Selector...")
        search_input = page.wait_for_selector("input[placeholder='Cari nama hero...']", timeout=5000)
        if search_input:
            print("Avatar Search found. Typing 'Warrior'...")
            search_input.fill("Warrior")
            page.wait_for_timeout(1000) # Wait for debounce/results

        # Take Lobby Screenshot
        print("Taking Lobby screenshot...")
        page.screenshot(path="public/screenshots/lobby_v2.png")
        print("Saved to public/screenshots/lobby_v2.png")

        # Move the existing gameplay screenshot if it exists
        import os
        if os.path.exists("verification/game_board_active.png"):
             os.rename("verification/game_board_active.png", "public/screenshots/gameplay_v2.png")
             print("Moved gameplay screenshot to public/screenshots/gameplay_v2.png")
        else:
             print("Warning: verification/game_board_active.png not found. Taking a new one requires entering a game.")

        browser.close()

if __name__ == "__main__":
    run()
