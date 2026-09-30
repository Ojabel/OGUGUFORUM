import re

print("=== CSS VARIABLES IN STYLES.CSS & LANDINGPAGE.HTML ===")
for filename in ['css/styles.css', 'landingpage.html']:
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"--- {filename} ---")
        for m in re.finditer(r'--[a-zA-Z0-9-]+:[^;]+;', content):
            print(m.group(0))
    except FileNotFoundError:
        pass
