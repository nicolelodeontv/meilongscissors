# Meilong Scissors

**Meilong Scissors** is a polished Chrome/Edge Manifest V3 browser extension designed to help streamline photo selection on Sports In Focus event gallery pages.

## Features

- Detects individual and team clipped-photo matches.
- Optional automatic selection of matching photos.
- Clear current selections quickly.
- Draggable and collapsible floating control panel.
- Remembers panel position and user preferences.
- Popup settings with an enable/disable switch.
- Custom extension icons and branded UI.
- Lightweight, browser-native implementation with no build step required.

## Project Structure

```text
meilongscissors/
├── content.js          # Gallery detection and selection logic
├── manifest.json        # Chrome/Edge Manifest V3 configuration
├── popup.html           # Extension settings popup
├── popup.js             # Popup behavior and preferences
├── popup.css            # Popup styling
├── icons/               # Extension icons
└── README.md            # Project documentation
```

## Installation

The extension can be loaded locally in Chrome or Microsoft Edge using Developer Mode.

1. Download or clone this repository.
2. Open `chrome://extensions/` in Chrome, or `edge://extensions/` in Edge.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the folder containing `manifest.json`.
6. Open a compatible Sports In Focus event gallery page.

After installation, the extension icon can be used to access its settings and enable or disable the extension.

## Usage

Once enabled, open a supported Sports In Focus event gallery. The extension adds a floating control panel that can be moved or collapsed as needed.

Use the available controls to detect matching individual or team photos, optionally select detected matches automatically, and clear the current selections.

## Browser Support

The extension is built for modern Chromium-based browsers using **Manifest V3**, including:

- Google Chrome
- Microsoft Edge

## Development

This project is a browser extension and does not require a package manager or compilation step for normal development.

To make changes:

1. Edit the extension source files.
2. Open the browser's extensions page.
3. Use **Reload** on the unpacked extension after making changes.
4. Refresh the target event gallery page to test the updated behavior.

## Notes

This extension is intended for use with compatible Sports In Focus event gallery pages. Site structure or access changes may require updates to the gallery detection logic.

## Version

Current documented version: **v5.0.0**

## License

No open-source license is currently specified for this repository. Unless a license is added, the source should be treated as all rights reserved by the repository owner.
