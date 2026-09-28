import os
import zipfile
from builder.database import get_project
from builder.utils import escape

def render_comp(comp, project):
    t = comp.get('type')
    p = comp.get('properties', {})
    slots = comp.get('slots', {})

    def css_val(val): return escape(str(val)) if val else ""

    if t == 'heading':
        tag = p.get('size', 'h2')
        return f"<{tag} style='text-align:{css_val(p.get('align'))}; color:{css_val(p.get('color'))}; font-weight:{css_val(p.get('weight'))}; margin-top:0;'>{escape(p.get('text'))}</{tag}>"
    elif t == 'text':
        return f"<p style='text-align:{css_val(p.get('align'))}; color:{css_val(p.get('color'))}; font-size:{css_val(p.get('size'))}; white-space:pre-wrap;'>{escape(p.get('text'))}</p>"
    elif t == 'button':
        return f"<div style='text-align:{css_val(p.get('align', 'left'))}; margin: 10px 0;'><a href='{escape(p.get('url'))}' class='wb-btn' style='background-color:{css_val(p.get('bgColor'))}; color:{css_val(p.get('textColor'))}; border-radius:{css_val(p.get('borderRadius'))}; padding:{css_val(p.get('padding'))}; display:inline-block; text-decoration:none;'>{escape(p.get('text'))}</a></div>"
    elif t == 'image':
        return f"<div style='text-align:{css_val(p.get('align', 'center'))};'><img src='{escape(p.get('url'))}' alt='{escape(p.get('alt'))}' style='width:{css_val(p.get('width'))}; height:{css_val(p.get('height'))}; border-radius:{css_val(p.get('borderRadius'))}; object-fit:{css_val(p.get('objectFit'))}; max-width:100%;' /></div>"
    elif t == 'hero':
        align = p.get('align', 'center')
        flex_align = 'center' if align == 'center' else ('flex-end' if align == 'right' else 'flex-start')
        btn_html = f"<a href='{escape(p.get('buttonUrl'))}' class='wb-btn' style='background-color:var(--primary); color:#fff; padding:12px 24px; border-radius:var(--radius); text-decoration:none; display:inline-block; margin-top:16px;'>{escape(p.get('buttonText'))}</a>" if p.get('buttonText') else ""
        return f"""<div style='min-height:{css_val(p.get('minHeight'))}; background-color:{css_val(p.get('bgColor'))}; color:{css_val(p.get('textColor'))}; display:flex; flex-direction:column; justify-content:center; align-items:{flex_align}; text-align:{align}; padding:60px 20px;'>
            <h1 style='font-size:48px; margin:0 0 16px 0;'>{escape(p.get('title'))}</h1>
            <p style='font-size:20px; margin:0; opacity:0.9;'>{escape(p.get('subtitle'))}</p>
            {btn_html}
        </div>"""
    elif t == 'card':
        btn_html = f"<a href='{escape(p.get('buttonUrl'))}' class='wb-btn' style='background-color:var(--primary); color:#fff; padding:10px 20px; border-radius:var(--radius); text-decoration:none; align-self:flex-start; margin-top:16px;'>{escape(p.get('buttonText'))}</a>" if p.get('buttonText') else ""
        return f"""<div style='background:{css_val(p.get('bg'))}; border:{css_val(p.get('border'))}; border-radius:{css_val(p.get('borderRadius'))}; padding:24px; display:flex; flex-direction:column;'>
            <h3 style='margin-top:0;'>{escape(p.get('title'))}</h3>
            <p style='flex-grow:1; color: var(--text); opacity: 0.8;'>{escape(p.get('description'))}</p>
            {btn_html}
        </div>"""
    elif t == 'divider':
        return f"<hr style='border:none; border-top:{css_val(p.get('thickness'))} solid {css_val(p.get('color'))}; margin:{css_val(p.get('margin'))};' />"
    elif t == 'spacer':
        return f"<div style='height:{css_val(p.get('height'))}; width:100%;'></div>"
    elif t == 'navbar':
        links_html = "".join([f"<a href='{escape(l.split('|')[1].strip() if len(l.split('|'))>1 else '#')}' style='color:{css_val(p.get('textColor'))}; text-decoration:none;'>{escape(l.split('|')[0].strip())}</a>" for l in p.get('links', '').split(',') if l.strip()])
        return f"""<nav style='background-color:{css_val(p.get('bgColor'))}; color:{css_val(p.get('textColor'))}; display:flex; justify-content:space-between; align-items:center; padding:16px 24px; border-bottom:1px solid rgba(0,0,0,0.05);'>
            <div style='font-weight:bold; font-size:24px;'>{escape(p.get('logoText'))}</div>
            <div style='display:flex; gap:16px;'>{links_html}</div>
        </nav>"""
    elif t == 'footer':
        return f"<footer style='background-color:{css_val(p.get('bgColor'))}; color:{css_val(p.get('textColor'))}; padding:24px; text-align:center;'>{escape(p.get('text'))}</footer>"
    elif t in ['twocolumn', 'threecolumn']:
        slot_names = ['col1', 'col2'] if t == 'twocolumn' else ['col1', 'col2', 'col3']
        rendered_slots = [f"<div style='flex:1; min-width:250px;'>{''.join([render_comp(c, project) for c in slots.get(s, [])])}</div>" for s in slot_names]
        return f"<div style='display:flex; gap:{css_val(p.get('gap'))}; flex-wrap:wrap; width:100%;'>{ ''.join(rendered_slots) }</div>"
    return ""

def generate_html(page, project):
    components_html = "".join([render_comp(c, project) for c in page.get('components', [])])
    title = project.get('settings', {}).get('title', 'Website')
    page_title = f"{page.get('name', 'Page')} - {title}"
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{escape(page_title)}</title>
    <link rel="stylesheet" href="style.css">
    <script src="script.js" defer></script>
</head>
<body>
    {components_html}
</body>
</html>"""

def generate_css(project):
    s = project.get('settings', {})
    return f""":root {{
  --primary: {escape(s.get('primaryColor', '#3b82f6'))};
  --secondary: {escape(s.get('secondaryColor', '#6b7280'))};
  --background: {escape(s.get('backgroundColor', '#ffffff'))};
  --text: {escape(s.get('textColor', '#111827'))};
  --radius: {escape(s.get('borderRadius', '8px'))};
  --font: {escape(s.get('fontFamily', 'system-ui, sans-serif'))};
}}
body {{
  margin: 0; padding: 0; font-family: var(--font);
  background-color: var(--background); color: var(--text);
  line-height: 1.5;
}}
* {{ box-sizing: border-box; }}
.wb-btn {{ transition: opacity 0.2s, transform 0.1s; cursor: pointer; }}
.wb-btn:hover {{ opacity: 0.8; }}
.wb-btn:active {{ transform: scale(0.98); }}
"""

def generate_js(project):
    return "document.addEventListener('DOMContentLoaded', () => { console.log('WebForge site loaded successfully.'); });"

def export_project(project_id):
    project = get_project(project_id)
    export_dir = os.path.join('exports', project_id)
    os.makedirs(export_dir, exist_ok=True)
    
    for page in project.get('pages', []):
        html = generate_html(page, project)
        filename = 'index.html' if page.get('isHome') else f"{page.get('slug', 'page')}.html"
        with open(os.path.join(export_dir, filename), 'w', encoding='utf-8') as f: f.write(html)
            
    with open(os.path.join(export_dir, 'style.css'), 'w', encoding='utf-8') as f: f.write(generate_css(project))
    with open(os.path.join(export_dir, 'script.js'), 'w', encoding='utf-8') as f: f.write(generate_js(project))
        
    zip_path = os.path.join('exports', f"{project_id}.zip")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(export_dir):
            for file in files:
                zipf.write(os.path.join(root, file), arcname=file)
    return zip_path
