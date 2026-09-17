#!/usr/bin/env python3
"""
Сборщик Блокнота.
Режимы:
  python build.py          - сборка в 3 файла (dist/)
  python build.py single   - сборка в 1 файл (notebook_bundle.html)
  python build.py template - сборка в Jinja2 шаблон
  python build.py all      - все варианты
  python build.py help     - справка

Единственный источник разметки — index.html.
Правите тулбар/страницу — правите только index.html, дальше всё
собирается автоматически во всех трёх режимах.
"""

import re
import os
import sys
import subprocess

JS_FILES = [
    'js/config.js',
    'js/storage.js',
    'js/strokes.js',
    'js/renderer.js',
    'js/input.js',
    'js/toolbar.js',
    'js/notebook.js',
    'js/main.js',
]

BUNDLE_JS_NAME = 'notebook.js'


# ============================================
#  Утилиты
# ============================================

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()


def write_file(path, content):
    dir_name = os.path.dirname(path)
    if dir_name:
        os.makedirs(dir_name, exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)


# ============================================
#  Минификация
# ============================================

def minify_css(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.DOTALL)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'\s*{\s*', '{', css)
    css = re.sub(r'\s*}\s*', '}', css)
    css = re.sub(r'\s*;\s*', ';', css)
    css = re.sub(r'\s*:\s*', ':', css)
    css = re.sub(r';\s*}', '}', css)
    css = re.sub(r':0\w+', ':0', css)
    css = re.sub(r'#([0-9a-fA-F])\1([0-9a-fA-F])\2([0-9a-fA-F])\3', r'#\1\2\3', css)
    return css.strip()


def minify_js(js):
    try:
        result = subprocess.run(
            ['npx', 'uglifyjs', '--compress', '--mangle'],
            input=js, capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            return result.stdout
    except Exception:
        pass

    js = re.sub(r'//.*?\n', '\n', js)
    js = re.sub(r'/\*.*?\*/', '', js, flags=re.DOTALL)
    js = re.sub(r'\s+', ' ', js)
    js = re.sub(r'\s*([{}();,:])\s*', r'\1', js)
    js = re.sub(r'}\s*', '}', js)
    return js.strip()


def minify_html(html):
    html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
    html = re.sub(r'\n\s*', '', html)
    html = re.sub(r'>\s+<', '><', html)
    html = re.sub(r'\s+', ' ', html)
    return html.strip()


# ============================================
#  Сборка JS
# ============================================

def get_combined_js():
    combined = ''
    for file in JS_FILES:
        if os.path.exists(file):
            combined += read_file(file) + '\n'
            print(f"  ✅ {file}")
        else:
            print(f"  ❌ {file} не найден!")
    return combined


# ============================================
#  Извлечение разметки из index.html
# ============================================

def extract_body(html):
    """Возвращает содержимое <body>...</body> без подключений js/*.js."""
    m = re.search(r'<body[^>]*>(.*)</body>', html, re.DOTALL)
    body = m.group(1) if m else html
    # убираем <script src="js/...">...</script>
    body = re.sub(r'<script\s+src="js/[^"]*"\s*>\s*</script>\s*', '', body)
    return body.strip()


def extract_head_links(html):
    """
    Возвращает True, если в <head> подключён css/style.css.
    Нужно, чтобы понимать, какие замены делать.
    """
    return 'css/style.css' in html


# ============================================
#  Режим 1: dist/ — три файла
# ============================================

def build_three_files():
    print("📦 Сборка в 3 файла...")

    combined_js = get_combined_js()
    css = read_file('css/style.css')
    print("  ✅ css/style.css")

    print("🎨 Минификация...")
    minified_css = minify_css(css)
    minified_js = minify_js(combined_js)

    # Единственный источник разметки — index.html
    html = read_file('index.html')

    # В dist/ — style.css лежит рядом, путь без css/
    html = html.replace(
        '<link rel="stylesheet" href="css/style.css">',
        '<link rel="stylesheet" href="style.css">'
    )

    # Убираем модульные <script src="js/...">
    html = re.sub(r'<script\s+src="js/[^"]*"\s*>\s*</script>\s*', '', html)

    # Подключаем собранный notebook.js перед </body>
    html = html.replace(
        '</body>',
        f'    <script src="{BUNDLE_JS_NAME}"></script>\n</body>'
    )

    write_file('dist/style.css', minified_css)
    write_file(f'dist/{BUNDLE_JS_NAME}', minified_js)
    write_file('dist/index.html', html)

    print(f"\n✅ Собрано в dist/")


# ============================================
#  Режим 2: одиночный HTML-файл
# ============================================

def build_single_file():
    print("📦 Сборка в 1 файл...")

    combined_js = get_combined_js()
    css = read_file('css/style.css')
    html = read_file('index.html')

    print("🎨 Минификация...")
    minified_css = minify_css(css)
    minified_js = minify_js(combined_js)

    # CSS — внутрь <style>
    html = html.replace(
        '<link rel="stylesheet" href="css/style.css">',
        f'<style>{minified_css}</style>'
    )

    # Убираем модульные <script src="js/...">
    html = re.sub(r'<script\s+src="js/[^"]*"\s*>\s*</script>\s*', '', html)

    # JS — внутрь <script> перед </body>
    html = html.replace(
        '</body>',
        f'    <script>{minified_js}</script>\n</body>'
    )

    minified_html = minify_html(html)
    write_file('notebook_bundle.html', '<!DOCTYPE html>' + minified_html)

    print(f"\n✅ Собрано в notebook_bundle.html: "
          f"{os.path.getsize('notebook_bundle.html')} байт")


# ============================================
#  Режим 3: Jinja2 шаблон
# ============================================

def build_template():
    print("📦 Сборка в Jinja2 шаблон...")

    combined_js = get_combined_js()
    css = read_file('css/style.css')
    html = read_file('index.html')

    print("🎨 Минификация...")
    minified_css = minify_css(css)
    combined_js = combined_js.strip()

    # Разметку тела берём прямо из index.html
    body = extract_body(html)

    # CSS и JS оборачиваем в {% raw %} — чтобы Jinja не парсила
    # возможные {{ }} и {% %} внутри бандла.
    template = """{% extends "base.html" %}

{% block title %}📝 Блокнот{% endblock %}

{% block extra_head %}
{% raw %}
<style>CUSTOM_CSS</style>
{% endraw %}
{% endblock %}

{% block content %}
BODY_CONTENT
{% endblock %}

{% block extra_scripts %}
{% raw %}
<script>CUSTOM_JS</script>
{% endraw %}
{% endblock %}"""

    template = template.replace('CUSTOM_CSS', minified_css)
    template = template.replace('BODY_CONTENT', body)
    template = template.replace('CUSTOM_JS', combined_js)

    write_file('notebook_template_bundle.html', template)

    print(f"\n✅ Собрано в notebook_template_bundle.html")


# ============================================
#  Справка
# ============================================

def show_help():
    print("""
🔧 Сборщик Блокнот

Использование:
  python build.py          - сборка в 3 файла (dist/)
  python build.py single   - сборка в 1 файл (notebook_bundle.html)
  python build.py template - сборка в Jinja2 шаблон
  python build.py all      - все варианты
  python build.py help     - справка

Разметка читается из index.html — правьте тулбар только там.
""")


# ============================================
#  Точка входа
# ============================================

if __name__ == '__main__':
    if len(sys.argv) < 2:
        build_three_files()
    elif sys.argv[1] == 'single':
        build_single_file()
    elif sys.argv[1] == 'template':
        build_template()
    elif sys.argv[1] == 'all':
        build_three_files()
        print("\n" + "=" * 50 + "\n")
        build_single_file()
        print("\n" + "=" * 50 + "\n")
        build_template()
    elif sys.argv[1] == 'help':
        show_help()
    else:
        show_help()