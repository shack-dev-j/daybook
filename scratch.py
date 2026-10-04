import re

with open('design/previews/Drawer.html') as f:
    html = f.read()

# Extract the drawer aside
m = re.search(r'<aside class="drawer".*?</aside>', html, re.DOTALL)
if m:
    print("Found drawer!")
