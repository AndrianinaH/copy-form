# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This is a JavaScript utility project for copying form data between horse listing forms on Equirodi.com. The project consists of scripts to extract form data from edit forms and populate creation forms with that data.

## Architecture

### Core Components

- **copy-form.js**: Script for extracting form data from the edit form (`horse_form`) in JSON format
- **past-form.js**: Script for populating creation forms with previously extracted data (currently empty/incomplete)
- **editform.html**: Large HTML file containing the complete edit form structure for a horse listing
- **createform.html**: Creation form HTML (currently minimal/empty)
- **result.json**: Sample extracted form data showing the expected JSON structure

### Data Structure

The extracted form data follows this pattern:
- Text inputs: `"field_name": "value"`
- Select dropdowns: `"field_name": {"value": "option_value", "selectedText": "Display Text"}`
- Checkboxes: `"field_name[]": [{"value": "checkbox_value", "checked": true}]`
- Multi-language descriptions: `"text_desc[1]"` through `"text_desc[14]"` for different languages

### Form Structure

The main form (`horse_form`) contains extensive horse listing data including:
- Basic info: title, location, price, horse name
- Horse details: breed, sex, color, year of birth, height
- Experience levels, disciplines, lineage information
- Multi-language descriptions (French, English, Spanish, German, Italian, Dutch)

## Development Workflow

### Extracting Form Data
1. Load the edit form page in browser
2. Open browser console
3. Copy and paste the content of `copy-form.js`
4. The script will automatically extract all form data and copy JSON to clipboard

### Creating Pre-fill Script
The `past-form.js` script should be developed to:
1. Take JSON data (like from `result.json`)
2. Find corresponding form fields on creation page
3. Populate fields with appropriate values based on field type

## Browser Console Usage

These scripts are designed to run in browser console on the actual Equirodi.com pages, not as standalone Node.js applications. The scripts interact directly with DOM elements using `document.forms['horse_form']`.