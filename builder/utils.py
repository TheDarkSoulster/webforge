import html
def escape(text):
    return html.escape(str(text)) if text is not None else ""
