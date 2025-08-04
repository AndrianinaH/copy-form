# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This project provides tools for copying form data between web pages, particularly designed for horse listing forms on Equirodi.com. It consists of both a Chrome extension and standalone console scripts.

## Architecture

### Chrome Extension (Primary)
The main implementation is a Chrome extension with:

- **popup/**: User interface for the extension
  - `popup.html`: Main popup UI (360x580px)
  - `popup.js`: Popup logic and event handling
  - `popup.css`: Modern styling with animations
- **content-scripts/**: Scripts injected into web pages
  - `extract-form.js`: Extract form data from current page
  - `fill-form.js`: Fill forms with stored data
- **background/**: Service worker for background tasks
  - `background.js`: Handles extension lifecycle and messaging
- **manifest.json**: Extension configuration and permissions

### Console Scripts (Legacy)
Located in `console-scripts/`:
- **copy-form.js**: Extract form data via browser console
- **past-form.js**: Populate forms via browser console
- **editform.html/createform.html**: Sample HTML forms for testing
- **result.json**: Sample extracted data structure

## Development Workflow

### Chrome Extension Development
1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click "Reload" on the extension to apply changes
4. Test functionality on web pages with forms

### Extension Installation
Follow the detailed steps in `chrome-extension/GUIDE_INSTALLATION.md`. Key requirements:
- Create PNG icons (16x16, 48x48, 128x128) in `icons/` folder
- Load unpacked extension in Chrome developer mode
- Extension works on all URLs with appropriate permissions

### Data Structure
Form data is stored as JSON with these patterns:
- Text inputs: `"field_name": "value"`
- Select dropdowns: `"field_name": {"value": "option_value", "selectedText": "Display Text"}`
- Checkboxes: `"field_name[]": [{"value": "checkbox_value", "checked": true}]`
- Multi-language fields: `"text_desc[1]"` through `"text_desc[14]"`

### Extension Features
- Copy/paste forms between any web pages
- Recent forms history with storage
- Keyboard shortcuts: Ctrl+Shift+C (copy), Ctrl+Shift+V (paste)
- Modern UI with progress indicators and animations
- Cross-tab functionality via Chrome storage API

## Key Technical Details

- Extension uses Manifest V3 with service worker
- Content scripts run at `document_idle` on all URLs
- Uses Chrome storage API for persistence
- Popup class-based architecture with event handling
- Message passing between popup, content scripts, and background