from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True, args=['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'])
    context = browser.new_context(permissions=['microphone'])
    page = context.new_page()

    print("Navigating to app...")
    page.goto("http://localhost:5174")

    # Wait for splash screen to finish (it has a timer)
    print("Waiting for splash screen...")
    try:
        page.wait_for_selector("text=Create New Adventure", timeout=10000)
    except:
        # Maybe splash screen is still there or taking longer
        print("Waiting longer for lobby...")
        page.wait_for_selector("text=Create New Adventure", timeout=30000)

    print("Lobby loaded.")

    # Create a room
    print("Creating room...")
    # Name might be pre-filled with random name, but let's set it ensures we can interact
    page.get_by_placeholder("Enter your hero name...").fill("VoiceTester")
    page.get_by_role("button", name="Create New Adventure").click()

    # Wait for game room to load
    print("Waiting for game room...")
    # Wait for the board or something specific to GameRoom
    # The Board component has a class or ID?
    # Or text "Waiting for players..." if in waiting state.
    # GameWaiting component usually shows "Waiting for players..." or "Room Code:"
    page.wait_for_selector("text=KODE RUANG", timeout=20000)

    print("Game room loaded.")

    # Check for Voice Control button (Phone icon)
    # The button has title "Join Voice" initially.
    print("Checking for voice control...")
    join_button = page.get_by_title("Join Voice")

    if join_button.is_visible():
        print("Join Voice button found.")
        join_button.click()
        print("Clicked Join Voice.")

        # After clicking, it should change to "Disconnect Voice" (PhoneOff icon)
        # And "Mute" button should appear.
        page.wait_for_timeout(2000) # Wait for state update

        disconnect_button = page.get_by_title("Disconnect Voice")
        if disconnect_button.is_visible():
            print("Successfully joined voice (Disconnect button visible).")
        else:
            print("Disconnect button NOT found.")

        mute_button = page.get_by_title("Mute")
        if mute_button.is_visible():
            print("Mute button visible.")
            mute_button.click()
            print("Clicked Mute.")

            page.wait_for_timeout(500)
            if page.get_by_title("Unmute").is_visible():
                print("Mute toggled successfully (Unmute button visible).")
            else:
                print("Unmute button NOT found.")
        else:
            print("Mute button NOT found.")

    else:
        print("Join Voice button NOT found.")

    # Screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification/voice_chat.png")
    browser.close()
    print("Done.")

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
