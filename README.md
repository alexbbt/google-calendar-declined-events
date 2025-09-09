# Google Calendar – Declined Events Toggle

One-click toggle to **show/hide declined events** in Google Calendar. Click the toolbar icon and the extension will open Calendar **Settings → View options**, toggle the checkbox, then close the temporary tab. The icon badge shows `ON` when declined events are shown.

> Note: The selector currently matches the English label “Show declined events”. For other languages, update the `TEXT_MATCHES` array in `background.js`.

## Install (dev)
1. Download/unzip this repo.
2. Visit `chrome://extensions`, enable **Developer mode**.
3. Click **Load unpacked** and select this folder.
4. Pin the extension, then click the toolbar icon to toggle.

## Permissions
- `host_permissions`: `https://calendar.google.com/*` to access the Calendar Settings page.
- `scripting`: injects the small script that clicks the checkbox.
- `tabs`: opens and closes the settings tab.
- `storage`: reserved for future features (e.g., user preferences).

## License
MIT
