from pathlib import Path
import re

index = Path('index.html')
script = Path('script.js')

html = index.read_text(encoding='utf-8')
js = script.read_text(encoding='utf-8')

# Nur Registergericht und HRB aus dem Dialog entfernen.
html, n1 = re.subn(
    r'\s*<label\b[^>]*>\s*>?Registergericht<input\b[^>]*\bid="firmCourt"[^>]*>.*?</label>\s*',
    '\n', html, count=1, flags=re.S | re.I,
)
html, n2 = re.subn(
    r'\s*<label\b[^>]*>\s*HRB<input\b[^>]*\bid="firmHRB"[^>]*>.*?</label>\s*',
    '\n', html, count=1, flags=re.S | re.I,
)
if n1 != 1 or n2 != 1:
    raise SystemExit(f'Felder nicht eindeutig gefunden: Registergericht={n1}, HRB={n2}')

# Festes Logo ausschließlich durch eine einfache Dateiauswahl ersetzen.
old_logo = '''          <div id="logoPreview" class="logoPreview fixedLogo">
            <img src="logo.png?v=33" alt="Schaaf-Elektro GmbH Logo" /><span
              >Fest hinterlegtes Firmenlogo</span
            >
          </div>'''
new_logo = '''          <label>Firmenlogo
            <input id="companyLogoFile" type="file" accept="image/png,image/jpeg,image/webp" onchange="handleCompanyLogoFile(this.files)" />
          </label>
          <div id="logoPreview" class="logoPreview fixedLogo"></div>'''
if old_logo not in html:
    raise SystemExit('Originaler Logo-Block wurde nicht gefunden.')
html = html.replace(old_logo, new_logo, 1)

# Header zeigt nur ein vom Nutzer gespeichertes Logo.
old_header = '<img src="logo.png?v=33" alt="Schaaf-Elektro GmbH Logo" class="appLogo" />'
new_header = '<img alt="Firmenlogo" class="appLogo hidden" />'
if old_header not in html:
    raise SystemExit('Header-Logo wurde nicht gefunden.')
html = html.replace(old_header, new_header, 1)
html = re.sub(r'style\.css\?v=\d+', 'style.css?v=37', html)
html = re.sub(r'script\.js\?v=\d+', 'script.js?v=37', html)

# Firmengericht/HRB nicht mehr als Voreinstellungsfelder behandeln.
js = js.replace('  "firmCourt",\n', '', 1)
js = js.replace('  "firmHRB",\n', '', 1)

old_logo_const = 'const logoData = "logo.png?v=33";'
if old_logo_const not in js:
    raise SystemExit('logoData-Konstante wurde nicht gefunden.')
js = js.replace(old_logo_const, 'let logoData = "";\nlet pendingCompanyLogo = "";', 1)

old_preview = '''function updateLogoPreview() {
  const p = document.getElementById("logoPreview");
  if (p)
    p.innerHTML =
      '<img src="logo.png?v=33" alt="Schaaf-Elektro GmbH Logo"><span>Fest hinterlegtes Firmenlogo</span>';
}'''
new_preview = '''function applyCompanyLogo(source = "") {
  logoData = source || "";
  const headerLogo = document.querySelector(".appLogo");
  if (headerLogo) {
    if (logoData) {
      headerLogo.src = logoData;
      headerLogo.classList.remove("hidden");
    } else {
      headerLogo.removeAttribute("src");
      headerLogo.classList.add("hidden");
    }
  }
  updateLogoPreview();
}
function updateLogoPreview() {
  const p = document.getElementById("logoPreview");
  if (!p) return;
  p.innerHTML = logoData
    ? `<img src="${logoData}" alt="Firmenlogo"><span>Ausgewähltes Firmenlogo</span>`
    : '<span>Noch kein Firmenlogo ausgewählt</span>';
}
async function handleCompanyLogoFile(files) {
  const file = files && files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Bitte eine Bilddatei auswählen.", true);
    return;
  }
  pendingCompanyLogo = await readFileAsDataUrl(file);
  applyCompanyLogo(pendingCompanyLogo);
}'''
if old_preview not in js:
    raise SystemExit('updateLogoPreview wurde nicht gefunden.')
js = js.replace(old_preview, new_preview, 1)

old_open = '''  updateLogoPreview();
  showDialog(document.getElementById("presetDialog"));'''
new_open = '''  pendingCompanyLogo = data.customLogo || "";
  applyCompanyLogo(pendingCompanyLogo);
  const logoInput = document.getElementById("companyLogoFile");
  if (logoInput) logoInput.value = "";
  showDialog(document.getElementById("presetDialog"));'''
if old_open not in js:
    raise SystemExit('openPresetDialog-Stelle wurde nicht gefunden.')
js = js.replace(old_open, new_open, 1)

old_save = '''  await dbPut("settings", { key: "company", data, updatedAt: nowIso() });
  closePresetDialog();'''
new_save = '''  data.customLogo = pendingCompanyLogo || "";
  await dbPut("settings", { key: "company", data, updatedAt: nowIso() });
  applyCompanyLogo(data.customLogo);
  closePresetDialog();'''
if old_save not in js:
    raise SystemExit('savePresetForm-Stelle wurde nicht gefunden.')
js = js.replace(old_save, new_save, 1)

# Gespeichertes Logo nach dem Öffnen der Datenbank laden.
needle = 'database = await openDatabase();'
replacement = '''database = await openDatabase();
    const savedCompanyLogo = await dbGet("settings", "company");
    pendingCompanyLogo = savedCompanyLogo?.data?.customLogo || "";
    applyCompanyLogo(pendingCompanyLogo);'''
if needle not in js:
    raise SystemExit('Datenbank-Initialisierung wurde nicht gefunden.')
js = js.replace(needle, replacement, 1)

index.write_text(html, encoding='utf-8')
script.write_text(js, encoding='utf-8')
print('Minimale Anpassung erfolgreich angewendet.')
