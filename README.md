# WebForge

A lightweight, local visual website builder built entirely with Python, Flask, vanilla JavaScript, and pure CSS.

## Features
- Drag-and-drop website building with native DOM events
- Real-time responsive preview (Desktop/Mobile)
- Undo/redo history stack
- Multi-page support and routing
- Local project persistence using SQLite
- Zero dependencies in generated websites
- One-click export to standalone static HTML/CSS/JS ZIP

## Installation

1. Create a virtual environment:
   python -m venv .venv
2. Activate it:
   - Mac/Linux: source .venv/bin/activate
   - Windows: .venv\Scripts\activate
3. Install dependencies:
   pip install -r requirements.txt

## How to Run

    python app.py

Then open http://127.0.0.1:5000 in your browser.

## Architecture
- app.py: Flask routing and API.
- builder/: Application logic, Database models, HTML/CSS generation engine.
- static/: Editor frontend scripts and stylesheets.
- templates/: Editor and dashboard UI.
- projects.db: Auto-generated SQLite database.
- exports/: Temporary directory holding exported website files.
