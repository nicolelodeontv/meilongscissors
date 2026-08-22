# Meilong Scissors

A lightweight Chromium browser extension for streamlining photo selection on compatible Sports In Focus event gallery pages.

## ✨ Features

- Detect individual and team clipped-photo matches
- Optionally select matching photos automatically
- Clear current selections with one action
- Draggable and collapsible floating control panel
- Persistent panel position and user preferences
- Popup settings with an enable/disable switch
- Custom extension icons and branded interface
- Manifest V3 with no build step required

## 🧩 How It Works

Meilong Scissors runs on supported Sports In Focus gallery pages and detects photo matches based on the gallery's page structure. Detected matches can be reviewed and, when enabled, selected automatically.

The extension keeps its controls in a floating panel so the gallery remains easy to use while the selection tools are available.

## 📁 Project Structure

```text
meilongscissors/
├── content.js          # Gallery detection and selection logic
├── manifest.json       # Manifest V3 configuration
├── popup.html          # Extension settings UI
├── popup.js            # Popup behavior and preferences
├── popup.css           # Popup styling
├── icons/              # Extension icons
└── README.md           # Project documentation
```

## 🚀 Installation

You can install the extension locally in Google Chrome or Microsoft Edge using Developer Mode.

1. Clone or download this repository.
2. Open `chrome://extensions/` in Chrome or `edge://extensions/` in Edge.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the folder containing `manifest.json`.
6. Open a compatible Sports In Focus event gallery.
7. Use the extension popup to enable or disable the extension.

## 🛠️ Development

No package manager, bundler, or compilation step is required for normal development.

1. Edit the extension source files.
2. Return to the browser's extensions page.
3. Click **Reload** for the unpacked extension.
4. Refresh the target gallery page.
5. Test the updated behavior.

## 🌐 Browser Support

Built for modern Chromium-based browsers using **Manifest V3**:

- Google Chrome
- Microsoft Edge

Other Chromium-based browsers may work but are not specifically tested.

## ⚠️ Compatibility Notes

Meilong Scissors depends on the structure and behavior of compatible Sports In Focus event gallery pages. Changes to the source website may require updates to the gallery detection and selection logic.

The extension is intended as a productivity tool for compatible gallery workflows and does not modify the source website itself.

## 📌 Version

Current documented version: **v5.0.0**

## 📄 License

No open-source license is currently specified. Unless a license is added to this repository, the source code should be treated as **all rights reserved** by the repository owner.

## 👤 Author

**Nicole John Dela Cruz**

GitHub: https://github.com/nicolelodeontv
