import uuid

def generate_id():
    return 'id_' + str(uuid.uuid4()).replace('-', '')[:10]

def create_empty_project(name):
    return {
        "id": generate_id(),
        "name": name,
        "settings": {
            "title": name,
            "primaryColor": "#3b82f6",
            "secondaryColor": "#6b7280",
            "backgroundColor": "#ffffff",
            "textColor": "#111827",
            "fontFamily": "system-ui, -apple-system, sans-serif",
            "borderRadius": "8px"
        },
        "pages": [{"id": generate_id(), "name": "Home", "slug": "index", "isHome": True, "components": []}]
    }

def create_demo_project():
    proj = create_empty_project("My Portfolio")
    proj["pages"][0]["components"] = [
        {"id": generate_id(), "type": "navbar", "properties": {"logoText": "WebForge", "links": "Home|/,About|/about.html,Contact|/contact.html", "bgColor": "var(--background)", "textColor": "var(--text)"}},
        {"id": generate_id(), "type": "hero", "properties": {"title": "Welcome to WebForge", "subtitle": "A pure Python and Vanilla JS visual builder.", "buttonText": "Start Building", "buttonUrl": "#", "align": "center", "bgColor": "#f3f4f6", "textColor": "var(--text)", "minHeight": "60vh"}},
        {"id": generate_id(), "type": "spacer", "properties": {"height": "40px"}},
        {"id": generate_id(), "type": "heading", "properties": {"text": "Features", "size": "h2", "align": "center", "color": "var(--text)", "weight": "bold"}},
        {"id": generate_id(), "type": "twocolumn", "properties": {"gap": "24px"}, "slots": {
            "col1": [{"id": generate_id(), "type": "card", "properties": {"title": "Fast", "description": "No heavy frameworks, just pure native logic.", "buttonText": "Learn More", "buttonUrl": "#", "bg": "#ffffff", "border": "1px solid #e5e7eb", "borderRadius": "var(--radius)"}}],
            "col2": [{"id": generate_id(), "type": "card", "properties": {"title": "Flexible", "description": "Export to standalone static HTML/CSS files.", "buttonText": "Learn More", "buttonUrl": "#", "bg": "#ffffff", "border": "1px solid #e5e7eb", "borderRadius": "var(--radius)"}}]
        }},
        {"id": generate_id(), "type": "spacer", "properties": {"height": "40px"}},
        {"id": generate_id(), "type": "footer", "properties": {"text": "© 2026 WebForge. All rights reserved.", "bgColor": "#1f2937", "textColor": "#ffffff"}}
    ]
    return proj
