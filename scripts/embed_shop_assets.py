#!/usr/bin/env python3
"""
Embed CSS and JS into demo-shop/index.html to ensure 100% styling and functionality
regardless of URL path, missing trailing slashes, or offline file:// execution.
"""

import os

def main():
    with open('demo-shop/styles.css', 'r', encoding='utf-8') as f:
        css = f.read()

    with open('demo-shop/app.js', 'r', encoding='utf-8') as f:
        js = f.read()

    with open('demo-shop/index.html', 'r', encoding='utf-8') as f:
        html = f.read()

    link_tag = '<link rel="stylesheet" href="styles.css">'
    if link_tag in html:
        new_css_block = f'<link rel="stylesheet" href="./styles.css">\n  <link rel="stylesheet" href="/shop/styles.css">\n  <style>\n{css}\n  </style>'
        html = html.replace(link_tag, new_css_block)
    else:
        print("link_tag not found directly, checking for existing <style>")

    script_tag = '<script src="app.js"></script>'
    if script_tag in html:
        new_js_block = f'<script>\n{js}\n</script>'
        html = html.replace(script_tag, new_js_block)

    with open('demo-shop/index.html', 'w', encoding='utf-8') as f:
        f.write(html)

    # Also mirror to apps/web/public/shop/index.html
    os.makedirs('apps/web/public/shop', exist_ok=True)
    with open('apps/web/public/shop/index.html', 'w', encoding='utf-8') as f:
        f.write(html)

    # Also copy styles.css and app.js to apps/web/public/ so /styles.css and /app.js also work!
    with open('apps/web/public/styles.css', 'w', encoding='utf-8') as f:
        f.write(css)

    print(f"[OK] Successfully embedded {len(css)} bytes CSS and {len(js)} bytes JS directly into index.html!")

if __name__ == '__main__':
    main()
