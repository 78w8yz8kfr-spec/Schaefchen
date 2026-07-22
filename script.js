const LEGACY_STORAGE = "vde-protokoll-v15-sichtbarkeit-reihenfolge";
const DB_NAME = "schaefchen-vde-local";
const DB_VERSION = 1;
const APP_VERSION = 26;
const logoData = "logo.png?v=31";
const fields = [
  "protocolNo",
  "customerNo",
  "orderNo",
  "sheetNo",
  "sheetTotal",
  "kunde",
  "objekt",
  "adresse",
  "datum",
  "startTime",
  "endDate",
  "endTime",
  "pruefer",
  "firma",
  "netzform",
  "spannung",
  "frequenz",
  "netzbetreiber",
  "norm0100600",
  "norm0105100",
  "echeck",
  "dguv3",
  "betrsichv",
  "erst",
  "wieder",
  "aenderung",
  "erweiterung",
  "instandsetzung",
  "gVde",
  "gHersteller",
  "gTyp",
  "gSerie",
  "gKal",
  "g2Hersteller",
  "g2Typ",
  "g2Serie",
  "g2Kal",
  "g3Hersteller",
  "g3Typ",
  "g3Serie",
  "g3Kal",
  "voltageDrop",
  "earthResistance",
  "paResult",
  "paFoundation",
  "paRing",
  "paHes",
  "paWaterMeter",
  "paMainWater",
  "paMainPe",
  "paGas",
  "paHeating",
  "paClimate",
  "paLift",
  "paEdv",
  "paPhone",
  "paLightning",
  "paAntenna",
  "paBuilding",
  "paOther",
  "maengel",
  "ergebnis",
  "plakette",
  "next",
  "firmName",
  "firmStreet",
  "firmCity",
  "firmTel",
  "firmFax",
  "firmMobile",
  "firmEmail",
  "firmCEO",
  "firmCourt",
  "firmHRB",
  "defaultPruefer",
  "hakName",
  "hakPlace",
  "hakFuse",
  "hakSource",
  "hakCable",
  "hakCableCustom",
  "hakCores",
  "hakCross",
];
fields.push("masterName", "detailedInsulation", "includeCircuitDirectory");
const checkGroups = [
  {
    title: "Besichtigen",
    items: [
      "Auswahl der Betriebsmittel",
      "Trenn- und Schaltgeräte",
      "Brandabschottungen",
      "Gebäudesystemtechnik",
      "Kabel, Leitungen und Stromschienen",
      "Kennzeichnung der Stromkreise und Betriebsmittel",
      "Kennzeichnung von N- und PE-Leitern",
      "Leiterverbindungen",
      "Schutz-, Sicherheits- und Überwachungseinrichtungen",
      "Basisschutz (Schutz gegen direktes Berühren)",
      "Zugänglichkeit von HAK und Verteilern",
      "Schutzpotentialausgleich",
      "Zusätzlicher Schutzpotentialausgleich",
      "Funktionspotentialausgleich",
      "Dokumentation vollständig",
    ],
  },
  {
    title: "Erproben",
    items: [
      "Funktionsprüfung der Anlage",
      "FI-Schutzschalter (RCD)",
      "Funktion der Schutz-, Sicherheits- und Überwachungseinrichtungen",
      "Rechtsdrehfeld (Drehstromsteckdosen)",
      "Spannungsfall überprüft",
      "Gebäudesystemtechnik erprobt",
      "Spannungspolarität",
      "Abschaltbedingungen / automatische Abschaltung",
    ],
  },
];
const checkItems = checkGroups.flatMap((group) => group.items);
const potentialFields = [
  ["paFoundation", "Fundamenterder"],
  ["paRing", "Ringerder"],
  ["paHes", "Haupterdungsschiene"],
  ["paWaterMeter", "Wasserzwischenzähler"],
  ["paMainWater", "Hauptwasserleitung"],
  ["paMainPe", "Hauptschutzleiter"],
  ["paGas", "Gasinnenleitung"],
  ["paHeating", "Heizungsanlage"],
  ["paClimate", "Klimaanlage"],
  ["paLift", "Aufzugsanlage"],
  ["paEdv", "EDV-Anlage"],
  ["paPhone", "Telefonanlage"],
  ["paLightning", "Blitzschutzanlage"],
  ["paAntenna", "Antennenanlage / BK"],
  ["paBuilding", "Gebäudekonstruktion"],
];
const fuses = {
  B6: 30,
  B10: 50,
  B13: 65,
  B16: 80,
  B20: 100,
  B25: 125,
  B32: 160,
  B40: 200,
  C6: 60,
  C10: 100,
  C13: 130,
  C16: 160,
  C20: 200,
  C25: 250,
  C32: 320,
  C40: 400,
  D6: 120,
  D10: 200,
  D13: 260,
  D16: 320,
  D20: 400,
  D25: 500,
  D32: 640,
  D40: 800,
};
let uid = 1;
let database = null;
let currentSiteId = "";
let currentProtocolId = "";
let currentProtocolRecord = null;
let currentPhotos = [];
let suppressAutosave = false;
let saveTimer = null;
let toastTimer = null;
let initialFieldValues = {};
let currentStep = 1;
const firmFields = [
  "firmName",
  "firmStreet",
  "firmCity",
  "firmTel",
  "firmFax",
  "firmMobile",
  "firmEmail",
  "firmCEO",
  "firmCourt",
  "firmHRB",
  "defaultPruefer",
  "masterName",
];
const deviceFields = [
  "gVde",
  "gHersteller",
  "gTyp",
  "gSerie",
  "gKal",
  "g2Hersteller",
  "g2Typ",
  "g2Serie",
  "g2Kal",
  "g3Hersteller",
  "g3Typ",
  "g3Serie",
  "g3Kal",
];
const presetFields = [...deviceFields, ...firmFields];
const stepInfo = {
  1: {
    title: "Auftrag und Prüfdaten",
    description:
      "Grunddaten zur Baustelle und Prüfart. Das voreingestellte Prüfgerät wird automatisch übernommen.",
  },
  2: {
    title: "Besichtigen und Erproben",
    description: "Alle Sicht- und Funktionsprüfungen vollständig bewerten.",
  },
  3: {
    title: "Einspeisung",
    description:
      "Hausanschluss, Zuleitung und Vorsicherung der Anlage erfassen.",
  },
  4: {
    title: "Verteilungen und Stromkreise",
    description:
      "Verteilungen in der tatsächlichen Reihenfolge anlegen und Messwerte eintragen.",
  },
  5: {
    title: "Bewertung und Abschluss",
    description:
      "Mängel, Fotos, Unterschrift und abschließendes Prüfergebnis dokumentieren.",
  },
};

const cableTypes = [
  "",
  "NYM-J",
  "NYM-O",
  "NYY-J",
  "NYY-O",
  "N2XH-J",
  "N2XH-O",
  "NHXMH-J",
  "NHXMH-O",
  "H07V-U",
  "H07V-K",
  "H07RN-F",
  "NYCWY",
  "J-Y(St)Y",
  "J-H(St)H",
  "LiYY",
  "CAT 7",
  "CAT 7A",
  "LWL",
];
const coreCounts = [
  "",
  "1",
  "2",
  "3",
  "4",
  "5",
  "7",
  "10",
  "12",
  "16",
  "18",
  "24",
  "48",
];
function cableSelect(cls, value = "") {
  const v = String(value || "");
  const custom = v && !cableTypes.includes(v);
  let opts = cableTypes
    .map(
      (t) =>
        `<option value="${esc(t)}" ${!custom && t === v ? "selected" : ""}>${t || "Bitte wählen"}</option>`,
    )
    .join("");
  opts += `<option value="__custom" ${custom ? "selected" : ""}>Anderer Kabeltyp / frei eingeben</option>`;
  return `<div class="cableCombo"><select class="${cls}" onchange="toggleCableCustom(this)">${opts}</select><input class="${cls}-custom cableCustom" value="${custom ? esc(v) : ""}" placeholder="Kabeltyp selbst eingeben" style="display:${custom ? "block" : "none"}"></div>`;
}
function coreSelect(cls, value = "") {
  const v = String(value || "");
  let opts = coreCounts
    .map(
      (t) =>
        `<option value="${esc(t)}" ${t === v ? "selected" : ""}>${t || "Bitte wählen"}</option>`,
    )
    .join("");
  if (v && !coreCounts.includes(v))
    opts += `<option value="${esc(v)}" selected>${esc(v)}</option>`;
  return `<select class="${cls}">${opts}</select>`;
}
function toggleCableCustom(sel) {
  const inp = sel.parentElement.querySelector(".cableCustom");
  if (inp) inp.style.display = sel.value === "__custom" ? "block" : "none";
}
function cableFieldValue(root, selectSel, customSel) {
  const s = root.querySelector(selectSel);
  if (!s) return "";
  return s.value === "__custom"
    ? root.querySelector(customSel)?.value || ""
    : s.value;
}
function displayCable(v, custom) {
  return v === "__custom" ? custom || "" : v;
}
const checks = document.getElementById("checks");
let checkIndex = 0;
checkGroups.forEach((group) => {
  checks.insertAdjacentHTML(
    "beforeend",
    `<h3 class="checkGroupTitle">${group.title}</h3>`,
  );
  group.items.forEach((t) => {
    const i = checkIndex++;
    checks.insertAdjacentHTML(
      "beforeend",
      `<div class="checkrow"><span>${t}</span><label><input type="radio" name="c${i}" value="io"> i.O.</label><label><input type="radio" name="c${i}" value="nio"> n.i.O.</label></div>`,
    );
  });
});
function id() {
  return "id" + Date.now() + "_" + uid++;
}
function dec(v) {
  if (v === undefined || v === null || String(v).trim() === "") return NaN;
  return parseFloat(
    String(v)
      .replace(",", ".")
      .replace(/[^0-9.\-]/g, ""),
  );
}
function val(root, sel) {
  return root.querySelector(sel)?.value || "";
}
function checked(root, sel) {
  return !!root.querySelector(sel)?.checked;
}
function esc(s) {
  return String(s || "").replace(
    /[&<>"]/g,
    (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[m],
  );
}
function deDate(value) {
  if (!value) return "—";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : String(value);
}
function deNumber(value) {
  if (value === undefined || value === null || String(value).trim() === "")
    return "—";
  return String(value)
    .trim()
    .replace(/\s+/g, " ")
    .replace(/(\d)\.(\d)/g, "$1,$2");
}
function pdfSafeText(value) {
  return String(value === undefined || value === null ? "" : value)
    .replace(/MΩ/g, "MOhm")
    .replace(/Ω/g, "Ohm")
    .replace(/IΔn/g, "Idn");
}
function deviceCalibrationIssues(source) {
  const f = source || {},
    today = new Date();
  today.setHours(0, 0, 0, 0);
  const result = [];
  [
    [f.gHersteller, f.gTyp, f.gKal, 1],
    [f.g2Hersteller, f.g2Typ, f.g2Kal, 2],
    [f.g3Hersteller, f.g3Typ, f.g3Kal, 3],
  ].forEach(([manufacturer, type, date, index]) => {
    if (!manufacturer && !type && !date) return;
    if (!date) {
      result.push({
        text: `Kalibrierungsdatum für Messgerät ${index} fehlt`,
        critical: false,
      });
      return;
    }
    const due = new Date(`${date}T00:00:00`);
    if (Number.isNaN(due.getTime())) {
      result.push({
        text: `Kalibrierungsdatum für Messgerät ${index} ist ungültig`,
        critical: true,
      });
      return;
    }
    const days = Math.ceil((due - today) / 86400000);
    if (days < 0)
      result.push({
        text: `Kalibrierung von Messgerät ${index} ist seit ${deDate(date)} abgelaufen`,
        critical: true,
      });
    else if (days <= 30)
      result.push({
        text: `Kalibrierung von Messgerät ${index} läuft am ${deDate(date)} ab`,
        critical: false,
      });
  });
  return result;
}
function updateCalibrationStatus() {
  const box = document.getElementById("calibrationStatus");
  if (!box) return;
  const source = {};
  deviceFields.forEach(
    (id) => (source[id] = document.getElementById(id)?.value || ""),
  );
  const hasDevice = deviceFields.some(
      (id) => id !== "gVde" && document.getElementById(id)?.value.trim(),
    ),
    issues = deviceCalibrationIssues(source);
  box.className = "calibrationStatus";
  if (!hasDevice) {
    box.classList.add("show", "warn");
    box.textContent = "Prüfgerät noch nicht vollständig voreingestellt.";
  } else if (issues.length) {
    box.classList.add(
      "show",
      issues.some((item) => item.critical) ? "bad" : "warn",
    );
    box.textContent = issues.map((item) => item.text).join(" · ");
  } else {
    box.classList.add("show", "ok");
    box.textContent = "Prüfgerät und Kalibrierung sind erfasst.";
  }
}
function addUv(data = {}) {
  const uvId = data.id || id();
  document
    .getElementById("uvs")
    .insertAdjacentHTML("beforeend", uvHtml(uvId, data));
  const uv = document.querySelector(`[data-uv="${uvId}"]`);
  (data.rcds || []).forEach((r) => addRcd(uvId, r));
  (data.direct || []).forEach((c) =>
    addCircuit(uv.querySelector(".directCircuits"), c),
  );
  if (!(data.rcds || []).length && !(data.direct || []).length)
    addRcd(uvId, { name: "FI 1" });
  ensureCircuitBatchControl(uv, "direct");
  updateStructureLabels();
  evalAll();
}
function uvHtml(uvId, d = {}) {
  return `<div class="uv" data-uv="${uvId}"><div class="titleRow sectionHead"><button type="button" class="collapseBtn" onclick="toggleSection(this)" aria-label="Verteilung ein- oder ausklappen">▾</button><div class="structureHeading"><h3><span class="uv-index">Verteilung</span><span class="structureSeparator"> · </span><span class="uv-title">${esc(d.name || "UV")}</span></h3></div><div class="structureControls"><button type="button" class="secondary small" onclick="moveUv(this,-1)" title="Nach oben">↑</button><button type="button" class="secondary small" onclick="moveUv(this,1)" title="Nach unten">↓</button><button class="danger small" onclick="removeStructure(this,'.uv','Verteilung')">Löschen</button></div></div><div class="uvBody"><div class="grid"><label>Bezeichnung der Verteilung<input class="uv-name" value="${esc(d.name || "UV")}" placeholder="z. B. UV EG"></label><label>Zuleitung kommt aus<input class="uv-source" value="${esc(d.source || "Hausanschlusskasten")}" placeholder="z. B. HAK, HV, UV EG"></label><label>Kabeltyp Zuleitung${cableSelect("uv-feed-cable", d.feedCable || "")}</label><label>Adernzahl Zuleitung${coreSelect("uv-feed-cores", d.feedCores || "")}</label><label>Querschnitt Zuleitung<span class="unitField"><input class="uv-feed-cross" value="${esc(d.feedCross || "")}" inputmode="decimal" placeholder="z. B. 10"><span>mm²</span></span></label><label>Vorsicherung / Absicherung<input class="uv-feed-fuse" value="${esc(d.feedFuse || d.feed || "")}" placeholder="z. B. 35 A"></label><label>Ort<input class="uv-place" value="${esc(d.place || "")}"></label></div><div class="subhead">FI/RCD-Gruppen</div><div class="rcds"></div><div class="singleAdd"><button onclick="addRcd('${uvId}')">+ FI/RCD hinzufügen</button></div><div class="subhead directHead">FI/LS und LS ohne vorgeschalteten FI</div><div class="directCircuits circuits"></div><div class="directAddMenu"><button class="secondary" onclick="addCircuit(this.closest('.uv').querySelector('.directCircuits'),{device:'ls'})">+ LS ohne FI hinzufügen</button><button onclick="addCircuit(this.closest('.uv').querySelector('.directCircuits'),{device:'fils'})">+ FI/LS hinzufügen</button></div></div></div>`;
}
function toggleSection(btn) {
  const box = btn.closest(".uv,.rcd");
  box.classList.toggle("collapsed");
  btn.textContent = box.classList.contains("collapsed") ? "▸" : "▾";
}
function toggleHak(btn) {
  const b = document.getElementById("hakBody");
  const closed = b.style.display === "none";
  b.style.display = closed ? "grid" : "none";
  btn.textContent = closed ? "▾" : "▸";
}
function addRcd(uvId, data = {}) {
  const uv = document.querySelector(`[data-uv="${uvId}"]`);
  const rcdId = data.id || id();
  uv.querySelector(".rcds").insertAdjacentHTML(
    "beforeend",
    rcdHtml(rcdId, data),
  );
  const r = uv.querySelector(`[data-rcd="${rcdId}"]`);
  (data.circuits || []).forEach((c) =>
    addCircuit(r.querySelector(".circuits"), c),
  );
  if (!(data.circuits || []).length) addCircuit(r.querySelector(".circuits"));
  ensureCircuitBatchControl(r, "rcd");
  updateStructureLabels();
  evalAll();
}
function rcdHtml(rcdId, d = {}) {
  return `<div class="rcd" data-rcd="${rcdId}"><div class="titleRow sectionHead"><button type="button" class="collapseBtn" onclick="toggleSection(this)" aria-label="FI-Stromkreis ein- oder ausklappen">▾</button><div class="structureHeading"><h4><span class="rcd-index">FI-Stromkreis</span><span class="structureSeparator"> · </span><span class="rcd-title">${esc(d.name || "FI")}</span></h4></div><div class="structureControls"><button type="button" class="secondary small" onclick="moveRcd(this,-1)" title="Nach oben">↑</button><button type="button" class="secondary small" onclick="moveRcd(this,1)" title="Nach unten">↓</button><button class="danger small" onclick="removeStructure(this,'.rcd','FI/RCD')">Löschen</button></div></div><div class="rcdBody"><div class="grid"><label>FI-Stromkreis / Bezeichnung<input class="rcd-name" value="${esc(d.name || "FI")}" placeholder="z. B. FI Bad/Küche"></label><label>Typ<select class="rcd-type"><option ${d.type === "A" ? "selected" : ""}>A</option><option ${d.type === "F" ? "selected" : ""}>F</option><option ${d.type === "B" ? "selected" : ""}>B</option><option ${d.type === "AC" ? "selected" : ""}>AC</option></select></label><label>Charakteristik<select class="rcd-char"><option ${d.char === "unverzögert" ? "selected" : ""}>unverzögert</option><option ${d.char === "G / kurzzeitverzögert" ? "selected" : ""}>G / kurzzeitverzögert</option><option ${d.char === "S / selektiv" ? "selected" : ""}>S / selektiv</option></select></label><label>Bemessungsstrom In<select class="rcd-in"><option>25 A</option><option ${d.inn === "40 A" ? "selected" : ""}>40 A</option><option ${d.inn === "63 A" ? "selected" : ""}>63 A</option><option ${d.inn === "80 A" ? "selected" : ""}>80 A</option></select></label><label>Bemessungsdifferenzstrom IΔn<select class="rcd-idn"><option ${d.idn === "10" ? "selected" : ""} value="10">10 mA</option><option ${!d.idn || d.idn === "30" ? "selected" : ""} value="30">30 mA</option><option ${d.idn === "100" ? "selected" : ""} value="100">100 mA</option><option ${d.idn === "300" ? "selected" : ""} value="300">300 mA</option></select></label><label class="checkLabel">Prüftaste<input class="rcd-test" type="checkbox" ${d.test ? "checked" : ""}></label></div><div class="status neutral rcd-status">FI-Bewertung fehlt</div><div class="circuits"></div></div></div>`;
}
function addCircuit(container, data = {}) {
  if (typeof container === "string")
    container = document.querySelector(container);
  data = data || {};
  data.insideRcd = !!container.closest(".rcd");
  if (data.insideRcd && data.device === "fils") data.device = "ls";
  container.insertAdjacentHTML("beforeend", circuitHtml(data));
  const el = container.lastElementChild;
  enhanceCircuit(el, data);
  updateCircuitVisibility(el);
  updateStructureLabels();
  evalAll();
  updateStepProgress();
  saveData();
  return el;
}
function moveElement(element, dir) {
  if (!element) return;
  if (dir < 0 && element.previousElementSibling)
    element.parentElement.insertBefore(element, element.previousElementSibling);
  if (dir > 0 && element.nextElementSibling)
    element.parentElement.insertBefore(element.nextElementSibling, element);
  updateStructureLabels();
  evalAll();
  saveData();
}
function moveUv(btn, dir) {
  moveElement(btn.closest(".uv"), dir);
}
function moveRcd(btn, dir) {
  moveElement(btn.closest(".rcd"), dir);
}
function moveCircuit(btn, dir) {
  moveElement(btn.closest(".circuit"), dir);
}
function removeStructure(btn, selector, label) {
  const element = btn.closest(selector);
  if (!element || !confirm(`${label} wirklich löschen?`)) return;
  element.remove();
  updateStructureLabels();
  evalAll();
  updateStepProgress();
  saveData();
}
function duplicateCircuit(btn) {
  const circuit = btn.closest(".circuit");
  if (!circuit) return;
  addCircuit(circuit.parentElement, circuitData(circuit));
  showToast("Stromkreis dupliziert");
}
function addCircuitAfter(btn) {
  const circuit = btn.closest(".circuit");
  if (!circuit) return;
  const device = circuit.closest(".rcd")
    ? "ls"
    : val(circuit, ".ck-device") || "ls";
  const added = addCircuit(circuit.parentElement, { device });
  circuit.after(added);
  updateStructureLabels();
  evalAll();
  saveData();
  added.scrollIntoView({ behavior: "smooth", block: "center" });
}
function circuitHtml(d = {}) {
  const dev = d.device || "ls";
  const inside = !!d.insideRcd;
  const deviceField = inside
    ? `<div class="badgeField"><span>Schutzorgan</span><b>LS</b><input type="hidden" class="ck-device" value="ls"></div>`
    : `<label>Schutzorgan<select class="ck-device" onchange="updateCircuitVisibility(this.closest('.circuit'))"><option value="ls" ${dev !== "fils" ? "selected" : ""}>LS ohne FI</option><option value="fils" ${dev === "fils" ? "selected" : ""}>FI/LS</option></select></label>`;
  return `<div class="circuit ${inside ? "insideRcd" : ""}"><div class="circuitTop"><div class="circuitHeading"><b class="circuit-index">Stromkreis</b><span class="circuit-title">${esc(d.name || "Noch nicht bezeichnet")}</span></div><div class="moveBtns"><button type="button" class="secondary small" onclick="moveCircuit(this,-1)" title="Nach oben">↑</button><button type="button" class="secondary small" onclick="moveCircuit(this,1)" title="Nach unten">↓</button><button type="button" class="secondary small" onclick="duplicateCircuit(this)" title="Duplizieren">Kopie</button></div></div><div class="grid circuitBasics">${deviceField}<label>Stromkreis / Sicherung<input class="ck-name" value="${esc(d.name || "")}" placeholder="z. B. F1 Steckdosen Küche"></label><label>Kabeltyp / Leitung${cableSelect("ck-cable", d.cable || "")}</label><label>Adernzahl${coreSelect("ck-cores", d.cores || "")}</label><label>Querschnitt<span class="unitField"><input class="ck-cross" value="${esc(d.cross || "")}" inputmode="decimal" placeholder="z. B. 1,5"><span>mm²</span></span></label><label>LS-Charakteristik<select class="ck-char"><option ${d.char === "B" ? "selected" : ""}>B</option><option ${d.char === "C" ? "selected" : ""}>C</option><option ${d.char === "D" ? "selected" : ""}>D</option></select></label><label>LS-Nennstrom<select class="ck-a"><option>6</option><option ${d.a === "10" ? "selected" : ""}>10</option><option ${d.a === "13" ? "selected" : ""}>13</option><option ${!d.a || d.a === "16" ? "selected" : ""}>16</option><option ${d.a === "20" ? "selected" : ""}>20</option><option ${d.a === "25" ? "selected" : ""}>25</option><option ${d.a === "32" ? "selected" : ""}>32</option><option ${d.a === "40" ? "selected" : ""}>40</option></select></label><label class="filsOnly">FI/LS Typ<select class="ck-rcdtype"><option ${!d.rcdType || d.rcdType === "A" ? "selected" : ""}>A</option><option ${d.rcdType === "F" ? "selected" : ""}>F</option><option ${d.rcdType === "B" ? "selected" : ""}>B</option><option ${d.rcdType === "AC" ? "selected" : ""}>AC</option></select></label><label class="filsOnly">FI/LS Charakteristik<select class="ck-rcdchar"><option ${!d.rcdChar || d.rcdChar === "unverzögert" ? "selected" : ""}>unverzögert</option><option ${d.rcdChar === "G / kurzzeitverzögert" ? "selected" : ""}>G / kurzzeitverzögert</option><option ${d.rcdChar === "S / selektiv" ? "selected" : ""}>S / selektiv</option></select></label><label class="filsOnly">FI/LS IΔn<select class="ck-rcdidn"><option ${d.rcdIdn === "10" ? "selected" : ""} value="10">10 mA</option><option ${!d.rcdIdn || d.rcdIdn === "30" ? "selected" : ""} value="30">30 mA</option><option ${d.rcdIdn === "100" ? "selected" : ""} value="100">100 mA</option><option ${d.rcdIdn === "300" ? "selected" : ""} value="300">300 mA</option></select></label><label class="checkLabel filsOnly">FI/LS Prüftaste<input class="ck-rcdtest" type="checkbox" ${d.rcdTest ? "checked" : ""}></label></div><details class="measurementPanel" open><summary>Messwerte eingeben</summary><div class="grid measurementGrid"><label>Schutzleiter RPE Ω<input class="ck-rpe" value="${esc(d.rpe || "")}" inputmode="decimal"></label><label>Isolation RISO (kleinster Wert) MΩ<input class="ck-riso" value="${esc(d.riso || "")}" inputmode="decimal"></label><label>Prüfspannung U<sub>Mess</sub> V<input class="ck-risov" value="${esc(d.risoV || "")}" inputmode="decimal"></label><label>Verbraucher angeschlossen<select class="ck-consumer"><option value="">Nicht angegeben</option><option value="ja" ${d.consumer === "ja" ? "selected" : ""}>Ja</option><option value="nein" ${d.consumer === "nein" ? "selected" : ""}>Nein</option></select></label><label>Netzinnenimpedanz Zi (L-N) Ω<input class="ck-zi" value="${esc(d.zi || "")}" inputmode="decimal"></label><label>Schleifenimpedanz Zs (L-PE) Ω<input class="ck-zs" value="${esc(d.zs || "")}" inputmode="decimal"></label><label>Kurzschlussstrom IK A<input class="ck-ik" value="${esc(d.ik || "")}" inputmode="decimal"></label><label class="rcdMeasure">RCD-Berührungsspannung U<sub>L</sub> V<input class="ck-rcdul" value="${esc(d.rcdUl || "")}" inputmode="decimal"></label><label class="rcdMeasure">RCD-Auslösezeit ms<input class="ck-rcdms" value="${esc(d.rcdms || "")}" inputmode="decimal"></label><label class="rcdMeasure">RCD-Auslösestrom mA<input class="ck-rcdma" value="${esc(d.rcdma || "")}" inputmode="decimal"></label><label>Bemerkung<input class="ck-note" value="${esc(d.note || "")}"></label></div><details class="insulationDetails"><summary>Detaillierte Isolationsmessung</summary><div class="grid"><label>N–PE MΩ<input class="ck-riso-npe" value="${esc(d.risoNpe || "")}"></label><label>L1–PE MΩ<input class="ck-riso-l1pe" value="${esc(d.risoL1pe || "")}"></label><label>L1–N MΩ<input class="ck-riso-l1n" value="${esc(d.risoL1n || "")}"></label><label>L2–PE MΩ<input class="ck-riso-l2pe" value="${esc(d.risoL2pe || "")}"></label><label>L2–N MΩ<input class="ck-riso-l2n" value="${esc(d.risoL2n || "")}"></label><label>L3–PE MΩ<input class="ck-riso-l3pe" value="${esc(d.risoL3pe || "")}"></label><label>L3–N MΩ<input class="ck-riso-l3n" value="${esc(d.risoL3n || "")}"></label><label>L1–L2 MΩ<input class="ck-riso-l1l2" value="${esc(d.risoL1l2 || "")}"></label><label>L1–L3 MΩ<input class="ck-riso-l1l3" value="${esc(d.risoL1l3 || "")}"></label><label>L2–L3 MΩ<input class="ck-riso-l2l3" value="${esc(d.risoL2l3 || "")}"></label></div></details></details><div class="status neutral">Bewertung fehlt</div><div class="circuitFooter"><button class="danger small" onclick="removeStructure(this,'.circuit','Stromkreis')">Stromkreis löschen</button><button class="secondary small" onclick="addCircuitAfter(this)">+ Stromkreis hinzufügen</button></div></div>`;
}
function enhanceCircuit(c, data = {}) {
  c._defectPhotos = Array.isArray(data.defectPhotos)
    ? data.defectPhotos.map((photo) => ({ ...photo }))
    : [];
  const heading = c.querySelector(".circuitHeading"),
    controls = c.querySelector(".moveBtns"),
    status = c.querySelector(".status");
  const inferredPhase =
    data.phase || (Number.parseInt(data.cores, 10) >= 4 ? "three" : "single");
  const coreLabel = c.querySelector(".ck-cores")?.closest("label");
  if (coreLabel) {
    coreLabel.insertAdjacentHTML(
      "afterend",
      `<label>Ausführung<select class="ck-phase" onchange="updateCircuitVisibility(this.closest('.circuit'))"><option value="single" ${inferredPhase !== "three" ? "selected" : ""}>1-phasig (L/N/PE)</option><option value="three" ${inferredPhase === "three" ? "selected" : ""}>3-phasig (L1/L2/L3/N/PE)</option></select></label>`,
    );
  }
  c.querySelector(".ck-consumer")
    ?.closest("label")
    ?.classList.add("detailedOnly");
  [
    ".ck-riso-l2pe",
    ".ck-riso-l2n",
    ".ck-riso-l3pe",
    ".ck-riso-l3n",
    ".ck-riso-l1l2",
    ".ck-riso-l1l3",
    ".ck-riso-l2l3",
  ].forEach((selector) =>
    c
      .querySelector(selector)
      ?.closest("label")
      ?.classList.add("threePhaseOnly"),
  );
  heading.insertAdjacentHTML(
    "beforeend",
    '<span class="circuit-summary"></span>',
  );
  controls.insertAdjacentHTML(
    "afterbegin",
    '<button type="button" class="secondary small circuitToggle" onclick="toggleCircuit(this)" title="Stromkreis ein- oder ausklappen">▾</button>',
  );
  status.insertAdjacentHTML(
    "beforebegin",
    `<details class="circuitDefect"><summary>Mangel oder Foto zuordnen</summary><div class="circuitDefectBody"><label>Priorität<select class="ck-defect-priority"><option value="">Kein Mangel</option><option value="hinweis" ${data.defectPriority === "hinweis" ? "selected" : ""}>Hinweis</option><option value="mittel" ${data.defectPriority === "mittel" ? "selected" : ""}>Mittel</option><option value="hoch" ${data.defectPriority === "hoch" ? "selected" : ""}>Hoch</option></select></label><label>Mangel / Maßnahme<textarea class="ck-defect" placeholder="Feststellung und erforderliche Maßnahme">${esc(data.defect || "")}</textarea></label><label class="photo circuitPhoto">Fotos zum Stromkreis<input type="file" accept="image/*" multiple onchange="handleCircuitPhotoFiles(this)"></label><div class="circuitPhotoPreview"></div></div></details>`,
  );
  renderCircuitDefectPhotos(c);
  if (data.name) c.classList.add("collapsed");
  updateCircuitSummary(c);
}
function toggleCircuit(button) {
  const c = button.closest(".circuit");
  c.classList.toggle("collapsed");
  button.textContent = c.classList.contains("collapsed") ? "▸" : "▾";
}
function updateCircuitSummary(c) {
  if (!c) return;
  const inside = c.closest(".rcd"),
    device = inside ? "LS" : val(c, ".ck-device") === "fils" ? "FI/LS" : "LS",
    protection = `${device} ${val(c, ".ck-char")}${val(c, ".ck-a")} A`,
    fi = inside ? ` · ${val(inside, ".rcd-name") || "FI"}` : "",
    summary = c.querySelector(".circuit-summary"),
    status = c.querySelector(".status");
  if (summary)
    summary.textContent = `${protection}${fi}${status ? ` · ${status.firstChild?.textContent || status.textContent}` : ""}`;
}
function ensureCircuitBatchControl(root, type) {
  if (root.querySelector(`:scope .batchAdd[data-type="${type}"]`)) return;
  const target =
      type === "rcd"
        ? root.querySelector(".rcdBody")
        : root.querySelector(".uvBody"),
    anchor =
      type === "rcd"
        ? root.querySelector(".rcdBody > .circuits")
        : root.querySelector(".directAddMenu"),
    html = `<div class="batchAdd" data-type="${type}"><label>Anzahl<select class="batchCount">${[2, 3, 4, 5, 6, 8, 10, 12].map((value) => `<option>${value}</option>`).join("")}</select></label>${type === "direct" ? '<label>Schutzorgan<select class="batchDevice"><option value="ls">LS</option><option value="fils">FI/LS</option></select></label>' : ""}<button type="button" class="secondary" onclick="addCircuitBatch(this)">Mehrere Stromkreise hinzufügen</button></div>`;
  anchor.insertAdjacentHTML("afterend", html);
}
function addCircuitBatch(button) {
  const box = button.closest(".batchAdd"),
    count = Math.max(2, Math.min(12, Number(val(box, ".batchCount")) || 2)),
    type = box.dataset.type,
    container =
      type === "rcd"
        ? box.closest(".rcd").querySelector(".circuits")
        : box.closest(".uv").querySelector(".directCircuits"),
    device = type === "rcd" ? "ls" : val(box, ".batchDevice");
  for (let i = 0; i < count; i++) {
    const added = addCircuit(container, { device });
    added.classList.add("collapsed");
    const toggle = added.querySelector(".circuitToggle");
    if (toggle) toggle.textContent = "▸";
  }
  updateStructureLabels();
  showToast(`${count} Stromkreise fortlaufend hinzugefügt`);
}
async function handleCircuitPhotoFiles(input) {
  const c = input.closest(".circuit"),
    files = [...(input.files || [])];
  input.value = "";
  if (!c || !files.length) return;
  setSaveState("saving", "Fotos …");
  try {
    for (const file of files) {
      if (file.type.startsWith("image/"))
        c._defectPhotos.push(await resizePhoto(file));
    }
    renderCircuitDefectPhotos(c);
    saveData(true);
  } catch (error) {
    console.error(error);
    showToast("Ein Stromkreisfoto konnte nicht gespeichert werden.", true);
  }
}
function renderCircuitDefectPhotos(c) {
  const preview = c.querySelector(".circuitPhotoPreview");
  if (!preview) return;
  preview.innerHTML = "";
  (c._defectPhotos || []).forEach((photo, index) => {
    const item = document.createElement("div");
    item.className = "photoItem";
    item.innerHTML = `<img src="${photo.dataUrl}" alt="${esc(photo.name || `Stromkreisfoto ${index + 1}`)}"><button type="button" title="Foto entfernen" onclick="removeCircuitDefectPhoto(this,${index})">×</button>`;
    preview.appendChild(item);
  });
}
function removeCircuitDefectPhoto(button, index) {
  const c = button.closest(".circuit");
  c._defectPhotos.splice(index, 1);
  renderCircuitDefectPhotos(c);
  saveData();
}
function updateStructureLabels() {
  document.querySelectorAll(".uv").forEach((uv, uvIndex) => {
    const uvName = val(uv, ".uv-name") || `Verteilung ${uvIndex + 1}`;
    const uvNumber = uvIndex + 1;
    const index = uv.querySelector(".uv-index"),
      title = uv.querySelector(".uv-title");
    if (index) index.textContent = `Verteilung ${uvNumber}`;
    if (title) title.textContent = uvName;
    uv.querySelectorAll(":scope .uvBody > .rcds > .rcd").forEach(
      (rcd, rcdIndex) => {
        const rcdName = val(rcd, ".rcd-name") || `FI ${rcdIndex + 1}`;
        const ri = rcd.querySelector(".rcd-index"),
          rt = rcd.querySelector(".rcd-title");
        if (ri) ri.textContent = `FI-Stromkreis ${uvNumber}.${rcdIndex + 1}`;
        if (rt) rt.textContent = rcdName;
        rcd
          .querySelectorAll(":scope .rcdBody > .circuits > .circuit")
          .forEach((c, circuitIndex) =>
            setCircuitHeading(
              c,
              `${uvNumber}.${rcdIndex + 1}.${circuitIndex + 1}`,
            ),
          );
      },
    );
    uv.querySelectorAll(":scope .uvBody > .directCircuits > .circuit").forEach(
      (c, circuitIndex) =>
        setCircuitHeading(c, `${uvNumber}.D${circuitIndex + 1}`),
    );
  });
}
function setCircuitHeading(c, number) {
  const index = c.querySelector(".circuit-index"),
    title = c.querySelector(".circuit-title");
  if (index) index.textContent = `Stromkreis ${number}`;
  if (title) title.textContent = val(c, ".ck-name") || "Noch nicht bezeichnet";
  updateCircuitSummary(c);
}
function updateCircuitVisibility(c) {
  if (!c) return;
  const isInside = c.closest(".rcd") !== null;
  const isFils = val(c, ".ck-device") === "fils";
  const isThreePhase = val(c, ".ck-phase") === "three";
  c.classList.toggle("insideRcd", isInside);
  c.classList.toggle("isFils", isFils);
  c.classList.toggle("noRcd", !isInside && !isFils);
  c.classList.toggle("threePhase", isThreePhase);
  c.querySelectorAll(".filsOnly").forEach(
    (e) => (e.style.display = isFils ? "flex" : "none"),
  );
  c.querySelectorAll(".rcdMeasure").forEach(
    (e) => (e.style.display = isInside || isFils ? "flex" : "none"),
  );
}
function updateRelevantFields() {
  const detailed = !!document.getElementById("detailedInsulation")?.checked;
  document
    .getElementById("appMain")
    ?.classList.toggle("detailInsulationEnabled", detailed);
  const isTt = document.getElementById("netzform")?.value === "TT";
  const earthLabel = document.getElementById("earthResistanceLabel");
  if (earthLabel)
    earthLabel.innerHTML = isTt
      ? "Erdungswiderstand R<sub>E</sub> (bei TT erforderlich)"
      : "Erdungswiderstand R<sub>E</sub> (falls gemessen)";
  document.querySelectorAll(".circuit").forEach(updateCircuitVisibility);
}
function evalRcd(r) {
  let ok = true,
    warn = false;
  const msg = [],
    testOk = checked(r, ".rcd-test"),
    ratedCurrent = dec(val(r, ".rcd-in")),
    idn = dec(val(r, ".rcd-idn")),
    downstreamCurrents = [...r.querySelectorAll(".circuit .ck-a")]
      .map((element) => dec(element.value))
      .filter((value) => !isNaN(value));
  if (!testOk) {
    warn = true;
    msg.push("Prüftaste nicht bestätigt");
  }
  if (val(r, ".rcd-type") === "AC") {
    warn = true;
    msg.push("RCD Typ AC: Eignung für die Anlage fachlich prüfen");
  }
  if (isNaN(idn) || idn <= 0) {
    ok = false;
    msg.push("Bemessungsdifferenzstrom ist unplausibel");
  }
  if (
    !isNaN(ratedCurrent) &&
    downstreamCurrents.some((value) => value > ratedCurrent)
  ) {
    warn = true;
    msg.push(
      "LS-Nennstrom größer als FI-Bemessungsstrom – Vorsicherung prüfen",
    );
  }
  const st = r.querySelector(".rcd-status");
  st.className = "status rcd-status " + (ok ? (warn ? "warn" : "ok") : "bad");
  st.textContent = ok
    ? warn
      ? "FI: Angaben prüfen"
      : "FI: Parameter und Prüftaste i.O."
    : "FI: unplausible Angaben";
  if (msg.length)
    st.innerHTML += `<ul class="details"><li>${msg.map(esc).join("</li><li>")}</li></ul>`;
  return { ok, warn, msg };
}
const risoKeys = [
  "risoNpe",
  "risoL1pe",
  "risoL1n",
  "risoL2pe",
  "risoL2n",
  "risoL3pe",
  "risoL3n",
  "risoL1l2",
  "risoL1l3",
  "risoL2l3",
];
function dataHasDetailedIsolation(data) {
  return (data.uvs || []).some((uv) =>
    [
      ...(uv.rcds || []).flatMap((rcd) => rcd.circuits || []),
      ...(uv.direct || []),
    ].some((circuit) =>
      risoKeys.some((key) => String(circuit[key] || "").trim()),
    ),
  );
}
function effectiveRisoElement(c) {
  const summary = dec(val(c, ".ck-riso"));
  if (!isNaN(summary)) return summary;
  if (!document.getElementById("detailedInsulation")?.checked) return NaN;
  const values = [
    ".ck-riso-npe",
    ".ck-riso-l1pe",
    ".ck-riso-l1n",
    ".ck-riso-l2pe",
    ".ck-riso-l2n",
    ".ck-riso-l3pe",
    ".ck-riso-l3n",
    ".ck-riso-l1l2",
    ".ck-riso-l1l3",
    ".ck-riso-l2l3",
  ]
    .map((s) => dec(val(c, s)))
    .filter((v) => !isNaN(v));
  return values.length ? Math.min(...values) : NaN;
}
function effectiveRisoData(c, useDetailed = true) {
  const summary = dec(c.riso);
  if (!isNaN(summary)) return summary;
  if (!useDetailed) return NaN;
  const values = risoKeys.map((key) => dec(c[key])).filter((v) => !isNaN(v));
  return values.length ? Math.min(...values) : NaN;
}
function evalCircuit(c, hasRcd) {
  const isFils = val(c, ".ck-device") === "fils";
  hasRcd = hasRcd || isFils;
  const riso = effectiveRisoElement(c),
    zi = dec(val(c, ".ck-zi")),
    zs = dec(val(c, ".ck-zs")),
    ik = dec(val(c, ".ck-ik")),
    rpe = dec(val(c, ".ck-rpe")),
    risoV = dec(val(c, ".ck-risov")),
    cross = dec(val(c, ".ck-cross")),
    cores = dec(val(c, ".ck-cores")),
    phase = val(c, ".ck-phase") || "single";
  const key = val(c, ".ck-char") + val(c, ".ck-a");
  const ia = fuses[key];
  let ok = true,
    warn = false,
    msg = [];
  if (isNaN(riso)) {
    warn = true;
    msg.push("RISO fehlt");
  } else if (riso < 1) {
    ok = false;
    msg.push("RISO < 1 MΩ");
  }
  if (isNaN(rpe)) {
    warn = true;
    msg.push("RPE fehlt");
  } else if (rpe < 0) {
    ok = false;
    msg.push("RPE darf nicht negativ sein");
  } else if (rpe > 1) {
    warn = true;
    msg.push("RPE > 1 Ω, Leitungslänge/Querschnitt prüfen");
  }
  if (isNaN(risoV)) {
    warn = true;
    msg.push("Prüfspannung fehlt");
  } else if (risoV <= 0) {
    ok = false;
    msg.push("Prüfspannung ist unplausibel");
  }
  if (!isNaN(cross) && cross <= 0) {
    ok = false;
    msg.push("Leiterquerschnitt ist unplausibel");
  }
  const nominalCurrent = dec(val(c, ".ck-a"));
  const crossCurrentLimits = [
    [1, 16],
    [1.5, 20],
    [2.5, 25],
    [4, 32],
  ];
  const crossLimit = crossCurrentLimits.find(([size]) => cross <= size)?.[1];
  if (!isNaN(cross) && crossLimit && nominalCurrent > crossLimit) {
    warn = true;
    msg.push("LS-Nennstrom zum Querschnitt prüfen (Verlegeart beachten)");
  }
  if (phase === "three" && !isNaN(cores) && cores < 4) {
    warn = true;
    msg.push("3-phasige Ausführung mit weniger als 4 Adern prüfen");
  }
  if (!isNaN(zi) && zi > 50) {
    warn = true;
    msg.push("Zi sehr hoch, Plausibilität prüfen");
  }
  if (!isNaN(zi) && zi <= 0) {
    ok = false;
    msg.push("Zi ist unplausibel");
  }
  if (!isNaN(zs) && zs <= 0) {
    ok = false;
    msg.push("Zs ist unplausibel");
  }
  if (!isNaN(ik) && ik <= 0) {
    ok = false;
    msg.push("IK ist unplausibel");
  }
  if (!isNaN(zs) && zs > 0 && !isNaN(ik) && ik > 0) {
    const expectedIk = 230 / zs;
    if (Math.abs(ik - expectedIk) / expectedIk > 0.35) {
      warn = true;
      msg.push("IK und Zs weichen rechnerisch deutlich voneinander ab");
    }
  }
  if (!hasRcd) {
    if (isNaN(zs) && isNaN(ik)) {
      warn = true;
      msg.push("Zs oder IK fehlt");
    } else {
      if (!isNaN(zs) && ia) {
        const max = 230 / ia;
        if (zs > max) {
          ok = false;
          msg.push(`Zs > ${max.toFixed(2)} Ω für ${key}A`);
        }
      }
      if (!isNaN(ik) && ia && ik < ia) {
        ok = false;
        msg.push(`IK < erforderlicher Auslösestrom ${ia} A für ${key}A`);
      }
    }
  } else {
    if (!isNaN(zs) && zs > 50) {
      warn = true;
      msg.push("Zs sehr hoch, Plausibilität prüfen");
    }
    const r = c.closest(".rcd");
    const idn = isFils ? dec(val(c, ".ck-rcdidn")) : dec(val(r, ".rcd-idn"));
    const ch = isFils ? val(c, ".ck-rcdchar") : val(r, ".rcd-char");
    const ms = dec(val(c, ".ck-rcdms"));
    const ma = dec(val(c, ".ck-rcdma"));
    const ul = dec(val(c, ".ck-rcdul"));
    if (isFils && !checked(c, ".ck-rcdtest")) {
      warn = true;
      msg.push("FI/LS-Prüftaste nicht bestätigt");
    }
    if (!isNaN(ul) && ul > 50) {
      ok = false;
      msg.push("RCD-Berührungsspannung > 50 V");
    } else if (!isNaN(ul) && ul < 0) {
      ok = false;
      msg.push("RCD-Berührungsspannung ist unplausibel");
    }
    if (!isNaN(ms) && ms <= 0) {
      ok = false;
      msg.push("RCD-Auslösezeit ist unplausibel");
    } else if (!isNaN(ms)) {
      let limit = ch.includes("S /") ? 500 : 300;
      if (ms > limit) {
        ok = false;
        msg.push(`RCD-Zeit > ${limit} ms`);
      }
    } else {
      warn = true;
      msg.push("RCD-Auslösezeit fehlt");
    }
    if (!isNaN(ma) && ma <= 0) {
      ok = false;
      msg.push("RCD-Auslösestrom ist unplausibel");
    } else if (!isNaN(ma) && !isNaN(idn)) {
      if (ma > idn) {
        ok = false;
        msg.push("RCD-Auslösestrom > IΔn");
      }
      if (ma < idn * 0.5) {
        warn = true;
        msg.push("RCD-Auslösestrom < 0,5×IΔn prüfen");
      }
    } else {
      warn = true;
      msg.push("RCD-Auslösestrom fehlt");
    }
  }
  const st = c.querySelector(".status");
  st.className = "status " + (ok ? (warn ? "warn" : "ok") : "bad");
  st.textContent = ok
    ? warn
      ? "Stromkreis: prüfen / Angaben unvollständig"
      : "Stromkreis: i.O."
    : "Stromkreis: n.i.O.";
  if (msg.length)
    st.innerHTML += `<ul class="details"><li>${msg.map(esc).join("</li><li>")}</li></ul>`;
  updateCircuitSummary(c);
  return { ok, warn, msg };
}
function evalAll() {
  document.querySelectorAll(".circuit").forEach(updateCircuitVisibility);
  let bad = 0,
    warn = 0,
    total = 0;
  document.querySelectorAll(".rcd").forEach((r) => {
    total++;
    const x = evalRcd(r);
    if (!x.ok) bad++;
    else if (x.warn) warn++;
    r.querySelectorAll(".circuit").forEach((c) => {
      total++;
      const y = evalCircuit(c, true);
      if (!y.ok) bad++;
      else if (y.warn) warn++;
    });
  });
  document
    .querySelectorAll(".uv .uvBody > .directCircuits > .circuit")
    .forEach((c) => {
      total++;
      const y = evalCircuit(c, c.querySelector(".ck-device")?.value === "fils");
      if (!y.ok) bad++;
      else if (y.warn) warn++;
    });
  const o = document.getElementById("overall"),
    l = document.getElementById("overallList");
  o.className = "overall " + (bad ? "bad" : warn ? "warn" : "ok");
  o.textContent = bad
    ? `Nicht in Ordnung: ${bad} Fehler, ${warn} Hinweise`
    : warn
      ? `Prüfen: ${warn} Hinweise / fehlende Werte`
      : `In Ordnung: ${total} geprüfte Elemente`;
  l.innerHTML = "";
}
function collect() {
  const data = {
    schemaVersion: 25,
    fields: {},
    checks: {},
    uvs: [],
    photos: currentPhotos.map((p) => ({ ...p })),
    sig: document.getElementById("sig").toDataURL(),
  };
  fields.forEach((id) => {
    const e = document.getElementById(id);
    if (!e) return;
    data.fields[id] =
      e.type === "checkbox" || e.type === "radio" ? e.checked : e.value;
  });
  checkItems.forEach((_, i) => {
    const e = document.querySelector(`[name=c${i}]:checked`);
    data.checks[i] = e ? e.value : "";
  });
  document.querySelectorAll(".uv").forEach((uv) => {
    const u = {
      id: uv.dataset.uv,
      name: val(uv, ".uv-name"),
      source: val(uv, ".uv-source"),
      feedCable: cableFieldValue(uv, ".uv-feed-cable", ".uv-feed-cable-custom"),
      feedCores: val(uv, ".uv-feed-cores"),
      feedCross: val(uv, ".uv-feed-cross"),
      feedFuse: val(uv, ".uv-feed-fuse"),
      feed: val(uv, ".uv-feed-fuse"),
      place: val(uv, ".uv-place"),
      rcds: [],
      direct: [],
    };
    uv.querySelectorAll(":scope .uvBody > .rcds > .rcd").forEach((r) => {
      const rd = {
        id: r.dataset.rcd,
        name: val(r, ".rcd-name"),
        type: val(r, ".rcd-type"),
        char: val(r, ".rcd-char"),
        inn: val(r, ".rcd-in"),
        idn: val(r, ".rcd-idn"),
        test: checked(r, ".rcd-test"),
        circuits: [],
      };
      r.querySelectorAll(".circuit").forEach((c) =>
        rd.circuits.push(circuitData(c)),
      );
      u.rcds.push(rd);
    });
    uv.querySelectorAll(":scope .uvBody > .directCircuits > .circuit").forEach(
      (c) => u.direct.push(circuitData(c)),
    );
    data.uvs.push(u);
  });
  return data;
}
function circuitData(c) {
  const inRcd = !!c.closest(".rcd");
  const device = inRcd ? "ls" : val(c, ".ck-device") || "ls";
  return {
    device,
    phase: val(c, ".ck-phase") || "single",
    name: val(c, ".ck-name"),
    cable: cableFieldValue(c, ".ck-cable", ".ck-cable-custom"),
    cores: val(c, ".ck-cores"),
    cross: val(c, ".ck-cross"),
    char: val(c, ".ck-char"),
    a: val(c, ".ck-a"),
    rcdType: val(c, ".ck-rcdtype"),
    rcdChar: val(c, ".ck-rcdchar"),
    rcdIdn: val(c, ".ck-rcdidn"),
    rcdTest: checked(c, ".ck-rcdtest"),
    rpe: val(c, ".ck-rpe"),
    riso: val(c, ".ck-riso"),
    risoV: val(c, ".ck-risov"),
    consumer: val(c, ".ck-consumer"),
    risoNpe: val(c, ".ck-riso-npe"),
    risoL1pe: val(c, ".ck-riso-l1pe"),
    risoL1n: val(c, ".ck-riso-l1n"),
    risoL2pe: val(c, ".ck-riso-l2pe"),
    risoL2n: val(c, ".ck-riso-l2n"),
    risoL3pe: val(c, ".ck-riso-l3pe"),
    risoL3n: val(c, ".ck-riso-l3n"),
    risoL1l2: val(c, ".ck-riso-l1l2"),
    risoL1l3: val(c, ".ck-riso-l1l3"),
    risoL2l3: val(c, ".ck-riso-l2l3"),
    zi: val(c, ".ck-zi"),
    zs: val(c, ".ck-zs"),
    ik: val(c, ".ck-ik"),
    rcdUl: val(c, ".ck-rcdul"),
    rcdms: val(c, ".ck-rcdms"),
    rcdma: val(c, ".ck-rcdma"),
    note: val(c, ".ck-note"),
  };
}
const baseCircuitData = circuitData;
circuitData = function (c) {
  const data = baseCircuitData(c);
  data.defectPriority = val(c, ".ck-defect-priority");
  data.defect = val(c, ".ck-defect");
  data.defectPhotos = (c._defectPhotos || []).map((photo) => ({ ...photo }));
  return data;
};
function saveData(manual = false) {
  if (
    suppressAutosave ||
    !currentProtocolId ||
    document.getElementById("appMain")?.classList.contains("isLocked")
  )
    return;
  clearTimeout(saveTimer);
  if (manual) {
    persistCurrentProtocol(true);
    return;
  }
  setSaveState("saving", "Speichert …");
  saveTimer = setTimeout(() => persistCurrentProtocol(false), 650);
}
function updateLogoPreview() {
  const p = document.getElementById("logoPreview");
  if (p)
    p.innerHTML =
      '<img src="logo.png?v=31" alt="Schaaf-Elektro GmbH Logo"><span>Fest hinterlegtes Firmenlogo</span>';
}
function initSettings() {
  updateLogoPreview();
  const dp = document.getElementById("defaultPruefer");
  if (dp) {
    dp.addEventListener("change", () => {
      const pr = document.getElementById("pruefer");
      if (pr && !pr.value) pr.value = dp.value;
    });
  }
}
async function openPresetDialog() {
  const saved = database ? await dbGet("settings", "company") : null,
    data = (saved && saved.data) || {};
  presetFields.forEach((id) => {
    const e = document.getElementById(id);
    if (e)
      e.value =
        data[id] !== undefined ? data[id] : initialFieldValues[id] || "";
  });
  updateLogoPreview();
  showDialog(document.getElementById("presetDialog"));
}
function closePresetDialog() {
  closeDialog(document.getElementById("presetDialog"));
}
async function savePresetForm(event) {
  event.preventDefault();
  const data = {};
  presetFields.forEach(
    (id) => (data[id] = document.getElementById(id)?.value || ""),
  );
  await dbPut("settings", { key: "company", data, updatedAt: nowIso() });
  closePresetDialog();
  showToast("Voreinstellungen lokal gespeichert");
}
function loadData(data = {}) {
  suppressAutosave = true;
  const blank = makeBlankData();
  const hasDetailedChoice = Object.prototype.hasOwnProperty.call(
    data.fields || {},
    "detailedInsulation",
  );
  const source = {
    ...blank,
    ...data,
    fields: { ...blank.fields, ...(data.fields || {}) },
    checks: data.checks || {},
    uvs: data.uvs || [],
  };
  if (!hasDetailedChoice)
    source.fields.detailedInsulation = dataHasDetailedIsolation(source);
  if (!data.schemaVersion || data.schemaVersion < 20) {
    const legacyMap = { 0: 9, 1: 11, 2: 0, 3: 5, 4: 16, 5: 18, 6: 21, 7: 22 },
      migrated = {};
    Object.entries(source.checks || {}).forEach(([oldIndex, value]) => {
      const target = legacyMap[oldIndex];
      if (target !== undefined) migrated[target] = value;
    });
    source.checks = migrated;
  }
  document.getElementById("uvs").innerHTML = "";
  document
    .querySelectorAll("#checks input[type=radio]")
    .forEach((e) => (e.checked = false));
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  fields.forEach((id) => {
    const e = document.getElementById(id);
    if (e && source.fields[id] !== undefined) {
      if (e.type === "checkbox" || e.type === "radio")
        e.checked = !!source.fields[id];
      else e.value = source.fields[id] || "";
    }
  });
  Object.entries(source.checks || {}).forEach(([i, v]) => {
    const e = document.querySelector(`[name=c${i}][value="${v}"]`);
    if (e) e.checked = true;
  });
  (source.uvs || []).forEach(addUv);
  if (!(source.uvs || []).length) addUv({ name: "UV EG" });
  currentPhotos = Array.isArray(source.photos)
    ? source.photos.map((p) => ({ ...p }))
    : [];
  renderPhotos();
  if (source.sig && source.sig.length > 100) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = source.sig;
  }
  if (!document.getElementById("firma").value)
    document.getElementById("firma").value =
      document.getElementById("firmName").value;
  if (!document.getElementById("pruefer").value)
    document.getElementById("pruefer").value =
      document.getElementById("defaultPruefer").value;
  if (document.getElementById("hakCable"))
    toggleCableCustom(document.getElementById("hakCable"));
  updateLogoPreview();
  updateStructureLabels();
  updateRelevantFields();
  evalAll();
  updateCalibrationStatus();
  suppressAutosave = false;
  showStep(1, false);
}
async function resetData() {
  if (
    !currentProtocolId ||
    !confirm(
      "Diese Prüfung wirklich dauerhaft aus dem Baustellenordner löschen?",
    )
  )
    return;
  const siteId = currentSiteId;
  await dbDelete("protocols", currentProtocolId);
  currentProtocolId = "";
  currentProtocolRecord = null;
  currentPhotos = [];
  showToast("Prüfung gelöscht");
  await openSite(siteId);
}
function completionIssues() {
  const issues = [],
    add = (text, step, critical = false) =>
      issues.push({ text, step, critical });
  [
    ["kunde", "Auftraggeber"],
    ["objekt", "Anlage / Objekt"],
    ["datum", "Beginn der Prüfung"],
    ["pruefer", "Prüfer"],
  ].forEach(([id, label]) => {
    if (!document.getElementById(id).value.trim())
      add(`${label} fehlt`, 1, true);
  });
  if (!document.querySelector("[name=pruefart]:checked"))
    add("Art der Prüfung fehlt", 1, true);
  if (
    !["norm0100600", "norm0105100", "echeck", "dguv3", "betrsichv"].some(
      (id) => document.getElementById(id)?.checked,
    )
  )
    add("Kein Regelwerk ausgewählt", 1, true);
  const startValue = `${document.getElementById("datum").value || ""}T${document.getElementById("startTime").value || "00:00"}`,
    endDateValue = document.getElementById("endDate").value,
    endValue = endDateValue
      ? `${endDateValue}T${document.getElementById("endTime").value || "23:59"}`
      : "";
  if (
    endValue &&
    !Number.isNaN(new Date(startValue).getTime()) &&
    new Date(endValue) < new Date(startValue)
  )
    add("Ende der Prüfung liegt vor dem Beginn", 1, true);
  if (!deviceFields.some((id) => document.getElementById(id)?.value.trim()))
    add("Prüfgerät fehlt", 1, true);
  const currentFields = {};
  deviceFields.forEach(
    (id) => (currentFields[id] = document.getElementById(id)?.value || ""),
  );
  deviceCalibrationIssues(currentFields).forEach((item) =>
    add(item.text, 1, item.critical),
  );
  const unrated = checkItems.filter(
    (_, i) => !document.querySelector(`[name=c${i}]:checked`),
  ).length;
  if (unrated)
    add(`${unrated} Sicht-/Funktionsprüfungen sind unbewertet`, 2, false);
  const voltageDrop = dec(document.getElementById("voltageDrop").value),
    earthResistance = dec(document.getElementById("earthResistance").value),
    paResult = dec(document.getElementById("paResult").value);
  if (!isNaN(voltageDrop) && (voltageDrop < 0 || voltageDrop > 4))
    add(
      "Spannungsfall außerhalb des üblichen Plausibilitätsbereichs von 0 bis 4 %",
      3,
      false,
    );
  if (
    document.getElementById("netzform").value === "TT" &&
    isNaN(earthResistance)
  )
    add("Erdungswiderstand fehlt beim ausgewählten TT-System", 3, true);
  if (!isNaN(earthResistance) && earthResistance <= 0)
    add("Erdungswiderstand ist unplausibel", 3, true);
  if (!isNaN(paResult) && paResult > 1)
    add("Potentialausgleich > 1 Ω – Messwert und Verbindung prüfen", 3, false);
  if (!isNaN(paResult) && paResult < 0)
    add("Potentialausgleich ist unplausibel", 3, true);
  const circuits = [...document.querySelectorAll(".circuit")];
  if (!circuits.length) add("Kein Stromkreis angelegt", 4, true);
  else {
    const incomplete = circuits.filter(
      (c) => !val(c, ".ck-name") || isNaN(effectiveRisoElement(c)),
    ).length;
    if (incomplete)
      add(
        `${incomplete} Stromkreis${incomplete === 1 ? " ist" : "e sind"} unvollständig`,
        4,
        true,
      );
    if (document.getElementById("detailedInsulation").checked) {
      const withoutDetails = circuits.filter((circuit) =>
        [
          ".ck-riso-npe",
          ".ck-riso-l1pe",
          ".ck-riso-l1n",
          ".ck-riso-l2pe",
          ".ck-riso-l2n",
          ".ck-riso-l3pe",
          ".ck-riso-l3n",
          ".ck-riso-l1l2",
          ".ck-riso-l1l3",
          ".ck-riso-l2l3",
        ].every((selector) => !val(circuit, selector)),
      ).length;
      if (withoutDetails)
        add(
          `${withoutDetails} Stromkreis${withoutDetails === 1 ? " hat" : "e haben"} keine Detailwerte zur Isolationsmessung`,
          4,
          false,
        );
    }
  }
  const hasBadCheck = !!document.querySelector(
      '#checks input[value="nio"]:checked',
    ),
    hasBadCircuit = circuits.some((c) =>
      c.querySelector(".status")?.classList.contains("bad"),
    ),
    hasAssignedDefect = circuits.some(
      (c) => val(c, ".ck-defect") || val(c, ".ck-defect-priority"),
    ),
    result = document.getElementById("ergebnis").value || "";
  const badCircuits = circuits.filter((c) =>
      c.querySelector(".status")?.classList.contains("bad"),
    ).length,
    warningCircuits = circuits.filter((c) =>
      c.querySelector(".status")?.classList.contains("warn"),
    ).length;
  if (badCircuits)
    add(
      `${badCircuits} Stromkreis${badCircuits === 1 ? " enthält" : "e enthalten"} unplausible oder nicht bestandene Messwerte`,
      4,
      true,
    );
  if (warningCircuits)
    add(
      `${warningCircuits} Stromkreis${warningCircuits === 1 ? " enthält" : "e enthalten"} Hinweise oder fehlende Werte`,
      4,
      false,
    );
  if (
    (hasBadCheck || hasBadCircuit || hasAssignedDefect) &&
    result === "Anlage ist in Ordnung"
  )
    add(
      "Ergebnis „Anlage ist in Ordnung“ widerspricht festgestellten Fehlern oder Mängeln",
      5,
      true,
    );
  if (!document.getElementById("plakette").value)
    add("Prüfplakette ist nicht bewertet", 5, false);
  if (!document.getElementById("next").value)
    add("Nächster Prüftermin fehlt", 5, false);
  else if (
    document.getElementById("datum").value &&
    document.getElementById("next").value <=
      document.getElementById("datum").value
  )
    add("Nächster Prüftermin liegt nicht nach dem Prüfdatum", 5, true);
  return issues;
}
async function completeProtocol() {
  if (!currentProtocolId) return;
  const issues = completionIssues();
  if (issues.length) {
    showCompletionDialog(issues);
    return;
  }
  await finalizeProtocolCompletion();
}
function showCompletionDialog(issues) {
  const list = document.getElementById("completionIssueList"),
    critical = issues.filter((item) => item.critical).length;
  document.getElementById("completionSummary").textContent = critical
    ? `${critical} wichtige und ${issues.length - critical} weitere offene Angaben wurden gefunden.`
    : `${issues.length} offene Angaben wurden gefunden.`;
  list.innerHTML = issues
    .map(
      (item) =>
        `<div class="completionIssue ${item.critical ? "critical" : ""}"><span class="issueMark">${item.critical ? "⚠" : "ℹ"}</span><span>${esc(item.text)}</span><button type="button" class="secondary" onclick="goToCompletionIssue(${item.step})">Schritt ${item.step}</button></div>`,
    )
    .join("");
  document.getElementById("confirmCompletionButton").textContent = critical
    ? "Bewusst trotzdem abschließen"
    : "Trotzdem abschließen";
  showDialog(document.getElementById("completionDialog"));
}
function closeCompletionDialog() {
  closeDialog(document.getElementById("completionDialog"));
}
function goToCompletionIssue(step) {
  closeCompletionDialog();
  showStep(step);
}
async function confirmProtocolCompletion() {
  closeCompletionDialog();
  await finalizeProtocolCompletion();
}
async function finalizeProtocolCompletion() {
  const now = new Date();
  if (!document.getElementById("endDate").value)
    document.getElementById("endDate").value = now.toISOString().slice(0, 10);
  if (!document.getElementById("endTime").value)
    document.getElementById("endTime").value = now.toTimeString().slice(0, 5);
  document.getElementById("protocolStatus").value = "completed";
  await persistCurrentProtocol(false);
  const record = await dbGet("protocols", currentProtocolId);
  if (record) {
    record.completedAt = nowIso();
    record.updatedAt = record.completedAt;
    await dbPut("protocols", record);
    currentProtocolRecord = record;
  }
  setEditorLocked(true);
  showStep(5);
  showToast("Prüfung abgeschlossen. PDF und Drucken sind jetzt verfügbar.");
}
function setEditorLocked(locked) {
  const app = document.getElementById("appMain"),
    banner = document.getElementById("lockedBanner");
  app.classList.toggle("isLocked", locked);
  banner.classList.toggle("hidden", !locked);
  app
    .querySelectorAll(".draftOnlyAction")
    .forEach((element) => element.classList.toggle("hidden", locked));
  app
    .querySelectorAll(".completedOnlyAction")
    .forEach((element) => element.classList.toggle("hidden", !locked));
  if (locked) {
    const stamp =
      currentProtocolRecord &&
      (currentProtocolRecord.completedAt || currentProtocolRecord.updatedAt);
    document.getElementById("lockedBannerText").textContent =
      `Schreibgeschützt${stamp ? " · abgeschlossen " + formatDate(stamp, true) : ""}. Für Änderungen zuerst erneut bearbeiten.`;
  }
  app
    .querySelectorAll("input,select,textarea")
    .forEach((element) => (element.disabled = locked));
  app.querySelectorAll("button").forEach((button) => {
    const allowed = button.matches(
      "#editorBackButton,#reopenButton,#pdfButton,#printButton,#prevStep,#nextStep,[data-step-target]",
    );
    button.disabled = locked && !allowed;
  });
  canvas.style.pointerEvents = locked ? "none" : "";
}
async function reopenProtocolForEditing() {
  if (
    !currentProtocolId ||
    !confirm(
      "Diese abgeschlossene Prüfung wirklich erneut zur Bearbeitung öffnen?",
    )
  )
    return;
  const record = await dbGet("protocols", currentProtocolId);
  if (!record) return;
  record.status = "draft";
  record.reopenedAt = nowIso();
  record.updatedAt = record.reopenedAt;
  await dbPut("protocols", record);
  currentProtocolRecord = record;
  document.getElementById("protocolStatus").value = "draft";
  setEditorLocked(false);
  showToast("Prüfung ist wieder bearbeitbar");
}
document.addEventListener("input", (e) => {
  if (e.target.closest("#appMain")) {
    if (e.target.matches(".uv-name,.rcd-name,.ck-name"))
      updateStructureLabels();
    evalAll();
    updateCalibrationStatus();
    updateStepProgress();
    saveData();
  }
});
document.addEventListener("change", (e) => {
  if (e.target.closest("#appMain")) {
    if (e.target.id === "protocolStatus" && e.target.value === "completed") {
      e.target.value = "draft";
      completeProtocol();
      return;
    }
    updateRelevantFields();
    evalAll();
    updateCalibrationStatus();
    updateStepProgress();
    saveData();
  }
});
document
  .getElementById("fotos")
  .addEventListener("change", (e) => handlePhotoFiles([...e.target.files]));
const canvas = document.getElementById("sig"),
  ctx = canvas.getContext("2d");
ctx.lineWidth = 4;
ctx.lineCap = "round";
let drawing = false;
function pos(e) {
  const r = canvas.getBoundingClientRect(),
    t = e.touches ? e.touches[0] : e;
  return {
    x: ((t.clientX - r.left) * canvas.width) / r.width,
    y: ((t.clientY - r.top) * canvas.height) / r.height,
  };
}
function start(e) {
  drawing = true;
  const p = pos(e);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  e.preventDefault();
}
function move(e) {
  if (!drawing) return;
  const p = pos(e);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  e.preventDefault();
}
function end() {
  drawing = false;
  saveData();
}
canvas.addEventListener("mousedown", start);
canvas.addEventListener("mousemove", move);
canvas.addEventListener("mouseup", end);
canvas.addEventListener("touchstart", start, { passive: false });
canvas.addEventListener("touchmove", move, { passive: false });
canvas.addEventListener("touchend", end);
function clearSig() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  saveData();
}
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

function circuitEvalText(c, hasRcd, r, useDetailed = true) {
  const isFils = c.device === "fils";
  hasRcd = hasRcd || isFils;
  const riso = effectiveRisoData(c, useDetailed),
    zi = dec(c.zi),
    zs = dec(c.zs),
    ik = dec(c.ik),
    rpe = dec(c.rpe),
    risoV = dec(c.risoV),
    cross = dec(c.cross),
    cores = dec(c.cores),
    phase = c.phase || "single";
  const key = (c.char || "B") + (c.a || "16");
  const ia = fuses[key];
  let ok = true,
    warn = false,
    msg = [];
  if (isNaN(riso)) {
    warn = true;
    msg.push("RISO fehlt");
  } else if (riso < 1) {
    ok = false;
    msg.push("RISO < 1 MΩ");
  }
  if (isNaN(rpe)) {
    warn = true;
    msg.push("RPE fehlt");
  } else if (rpe < 0) {
    ok = false;
    msg.push("RPE negativ");
  } else if (rpe > 1) {
    warn = true;
    msg.push("RPE > 1 Ω prüfen");
  }
  if (isNaN(risoV)) {
    warn = true;
    msg.push("Prüfspannung fehlt");
  } else if (risoV <= 0) {
    ok = false;
    msg.push("Prüfspannung unplausibel");
  }
  if (!isNaN(cross) && cross <= 0) {
    ok = false;
    msg.push("Querschnitt unplausibel");
  }
  const nominalCurrent = dec(c.a),
    crossLimit = [
      [1, 16],
      [1.5, 20],
      [2.5, 25],
      [4, 32],
    ].find(([size]) => cross <= size)?.[1];
  if (!isNaN(cross) && crossLimit && nominalCurrent > crossLimit) {
    warn = true;
    msg.push("LS/Querschnitt prüfen");
  }
  if (phase === "three" && !isNaN(cores) && cores < 4) {
    warn = true;
    msg.push("3-phasig mit weniger als 4 Adern");
  }
  if (!isNaN(zi) && zi > 50) {
    warn = true;
    msg.push("Zi sehr hoch");
  }
  if (!isNaN(zi) && zi <= 0) {
    ok = false;
    msg.push("Zi unplausibel");
  }
  if (!isNaN(zs) && zs <= 0) {
    ok = false;
    msg.push("Zs unplausibel");
  }
  if (!isNaN(ik) && ik <= 0) {
    ok = false;
    msg.push("IK unplausibel");
  }
  if (!isNaN(zs) && zs > 0 && !isNaN(ik) && ik > 0) {
    const expectedIk = 230 / zs;
    if (Math.abs(ik - expectedIk) / expectedIk > 0.35) {
      warn = true;
      msg.push("IK/Zs rechnerisch abweichend");
    }
  }
  if (!hasRcd) {
    if (isNaN(zs) && isNaN(ik)) {
      warn = true;
      msg.push("Zs oder IK fehlt");
    } else {
      if (!isNaN(zs) && ia) {
        const max = 230 / ia;
        if (zs > max) {
          ok = false;
          msg.push(`Zs > ${max.toFixed(2)} Ω`);
        }
      }
      if (!isNaN(ik) && ia && ik < ia) {
        ok = false;
        msg.push(`IK < erforderlicher Auslösestrom ${ia} A`);
      }
    }
  } else {
    if (!isNaN(zs) && zs > 50) {
      warn = true;
      msg.push("Zs sehr hoch");
    }
    const idn = isFils ? dec(c.rcdIdn) : dec(r && r.idn),
      ch = isFils ? c.rcdChar || "" : (r && r.char) || "";
    const ms = dec(c.rcdms),
      ma = dec(c.rcdma),
      ul = dec(c.rcdUl);
    if (isFils && !c.rcdTest) {
      warn = true;
      msg.push("FI/LS-Prüftaste nicht bestätigt");
    }
    if (!isNaN(ul) && ul > 50) {
      ok = false;
      msg.push("RCD-Berührungsspannung > 50 V");
    } else if (!isNaN(ul) && ul < 0) {
      ok = false;
      msg.push("RCD-Berührungsspannung unplausibel");
    }
    if (!isNaN(ms) && ms <= 0) {
      ok = false;
      msg.push("RCD-Zeit unplausibel");
    } else if (!isNaN(ms)) {
      let limit = ch.includes("S /") ? 500 : 300;
      if (ms > limit) {
        ok = false;
        msg.push(`RCD-Zeit > ${limit} ms`);
      }
    } else {
      warn = true;
      msg.push("RCD-Zeit fehlt");
    }
    if (!isNaN(ma) && ma <= 0) {
      ok = false;
      msg.push("RCD-Strom unplausibel");
    } else if (!isNaN(ma) && !isNaN(idn)) {
      if (ma > idn) {
        ok = false;
        msg.push("RCD-Strom > IΔn");
      }
      if (ma < idn * 0.5) {
        warn = true;
        msg.push("RCD-Strom < 0,5×IΔn");
      }
    } else {
      warn = true;
      msg.push("RCD-Strom fehlt");
    }
  }
  return {
    state: ok ? (warn ? "warn" : "ok") : "bad",
    text: ok ? (warn ? "prüfen" : "i.O.") : "n.i.O.",
    msg: msg.join("; "),
  };
}
function rcdEvalText(r) {
  let ok = true,
    warn = false,
    msg = [];
  if (!r.test) {
    warn = true;
    msg.push("Prüftaste nicht bestätigt");
  }
  const ratedCurrent = dec(r.inn),
    idn = dec(r.idn),
    downstreamCurrents = (r.circuits || [])
      .map((circuit) => dec(circuit.a))
      .filter((value) => !isNaN(value));
  if (r.type === "AC") {
    warn = true;
    msg.push("RCD Typ AC fachlich prüfen");
  }
  if (isNaN(idn) || idn <= 0) {
    ok = false;
    msg.push("Bemessungsdifferenzstrom unplausibel");
  }
  if (
    !isNaN(ratedCurrent) &&
    downstreamCurrents.some((value) => value > ratedCurrent)
  ) {
    warn = true;
    msg.push("LS größer als FI-Bemessungsstrom – Vorsicherung prüfen");
  }
  return {
    state: ok ? (warn ? "warn" : "ok") : "bad",
    text: ok ? (warn ? "prüfen" : "i.O.") : "n.i.O.",
    msg: msg.join("; "),
  };
}
function yn(v) {
  return v ? "Ja" : "Nein";
}
function compactCheckRows(checkData = {}) {
  let index = 0;
  const groups = checkGroups.map((group) =>
      group.items.map((item) => {
        const value = checkData && checkData[index++];
        return [
          item,
          value === "io" ? "i.O." : value === "nio" ? "n.i.O." : "—",
        ];
      }),
    ),
    besichtigen = groups[0] || [],
    erproben = groups[1] || [],
    split = Math.ceil(besichtigen.length / 2),
    left = besichtigen.slice(0, split),
    middle = besichtigen.slice(split),
    count = Math.max(left.length, middle.length, erproben.length),
    rows = [];
  for (let i = 0; i < count; i++) {
    rows.push([
      left[i]?.[0] || "",
      left[i]?.[1] || "",
      middle[i]?.[0] || "",
      middle[i]?.[1] || "",
      erproben[i]?.[0] || "",
      erproben[i]?.[1] || "",
    ]);
  }
  return rows;
}
function protocolCircuitEntries(d) {
  const entries = [];
  (d.uvs || []).forEach((u, ui) => {
    (u.rcds || []).forEach((r, ri) =>
      (r.circuits || []).forEach((c, ci) =>
        entries.push({
          number: `${ui + 1}.${ri + 1}.${ci + 1}`,
          uv: u.name || `UV ${ui + 1}`,
          fi: r.name || `FI ${ri + 1}`,
          rcd: r,
          hasUpstreamRcd: true,
          c,
        }),
      ),
    );
    (u.direct || []).forEach((c, ci) =>
      entries.push({
        number: `${ui + 1}.D${ci + 1}`,
        uv: u.name || `UV ${ui + 1}`,
        fi: c.device === "fils" ? "FI/LS integriert" : "—",
        rcd: null,
        hasUpstreamRcd: false,
        c,
      }),
    );
  });
  return entries;
}
function circuitDirectoryEntries(d) {
  return protocolCircuitEntries(d).map((entry) => {
    const c = entry.c,
      protection =
        c.device === "fils"
          ? `FI/LS ${(c.char || "") + (c.a || "")} A · Typ ${c.rcdType || "A"} · ${c.rcdIdn || "30"} mA`
          : `LS ${(c.char || "") + (c.a || "")} A`,
      cable = [
        c.cable,
        c.cores && `${c.cores}-adrig`,
        c.cross && `${deNumber(c.cross)} mm²`,
      ]
        .filter(Boolean)
        .join(" · ");
    return {
      number: entry.number,
      uv: entry.uv,
      name: c.name || "—",
      fi: entry.fi,
      protection,
      cable: cable || "—",
      note: c.note || "",
    };
  });
}
function defectPriorityLabel(value) {
  return value === "hoch"
    ? "Hoch"
    : value === "mittel"
      ? "Mittel"
      : value === "hinweis"
        ? "Hinweis"
        : "—";
}
function reportPhotos(d) {
  const photos = (d.photos || []).map((photo) => ({
    ...photo,
    caption: photo.name || "Allgemeines Foto",
  }));
  protocolCircuitEntries(d).forEach((entry) =>
    (entry.c.defectPhotos || []).forEach((photo) =>
      photos.push({
        ...photo,
        caption: `Stromkreis ${entry.number} · ${entry.c.name || "ohne Bezeichnung"} · ${photo.name || "Foto"}`,
      }),
    ),
  );
  return photos;
}
function preparePrint() {
  evalAll();
  saveData();
  const d = collect();
  const f = d.fields || {};
  const useDetailedInsulation = !!f.detailedInsulation;
  let bad = 0,
    warn = 0,
    rows = "",
    insulationRows = "";
  (d.uvs || []).forEach((u, ui) => {
    const feedTxt = `kommt aus: ${esc(u.source || "-")} | Kabel: ${esc(u.feedCable || "-")} ${u.feedCores ? esc(u.feedCores) + "-adrig " : ""}${u.feedCross ? esc(u.feedCross) + " mm²" : ""} | Vorsicherung: ${esc(u.feedFuse || u.feed || "-")}`;
    rows += `<tr><th colspan="20">UV: ${esc(u.name || "UV " + (ui + 1))} &nbsp; | &nbsp; Ort: ${esc(u.place || "-")} &nbsp; | &nbsp; Zuleitung ${feedTxt}</th></tr>`;
    (u.rcds || []).forEach((r, ri) => {
      const re = rcdEvalText(r);
      if (re.state === "bad") bad++;
      else if (re.state === "warn") warn++;
      const fiNumber = `${ui + 1}.${ri + 1}`;
      rows += `<tr><td colspan="20"><b>FI-Stromkreis ${fiNumber}:</b> ${esc(r.name || "FI " + (ri + 1))} | Typ ${esc(r.type)} | Charakteristik ${esc(r.char)} | In ${esc(r.inn)} | IΔn ${esc(r.idn)} mA | Prüftaste ${yn(r.test)} | <span class="${re.state}">${re.text}</span>${re.msg ? " – " + esc(re.msg) : ""}</td></tr>`;
      rows += measHeader();
      (r.circuits || []).forEach((c, ci) => {
        const number = `${fiNumber}.${ci + 1}`,
          ce = circuitEvalText(c, true, r, useDetailedInsulation);
        if (ce.state === "bad") bad++;
        else if (ce.state === "warn") warn++;
        rows += measRow(u.name, r.name, c, ce, number, true, r);
        if (useDetailedInsulation) insulationRows += insulationRow(number, c);
      });
    });
    if ((u.direct || []).length) {
      rows +=
        `<tr><td colspan="20"><b>Direkte Schutzorgane: LS und FI/LS</b></td></tr>` +
        measHeader();
      (u.direct || []).forEach((c, ci) => {
        const number = `${ui + 1}.D${ci + 1}`,
          ce = circuitEvalText(
            c,
            c.device === "fils",
            null,
            useDetailedInsulation,
          );
        if (ce.state === "bad") bad++;
        else if (ce.state === "warn") warn++;
        rows += measRow(
          u.name,
          c.device === "fils" ? "FI/LS integriert" : "ohne FI/RCD",
          c,
          ce,
          number,
          false,
          null,
        );
        if (useDetailedInsulation) insulationRows += insulationRow(number, c);
      });
    }
  });
  const checksHtml = compactCheckRows(d.checks)
    .map(
      (row) =>
        `<tr>${row.map((value, index) => `<td class="${index % 2 ? "checkValue" : ""}">${esc(value)}</td>`).join("")}</tr>`,
    )
    .join("");
  const prueferSig = d.sig && d.sig.length > 1000 ? `<img src="${d.sig}">` : "",
    entries = protocolCircuitEntries(d),
    defects = entries.filter(
      (entry) => entry.c.defect || entry.c.defectPriority,
    ),
    defectsHtml = defects.length
      ? `<h2>Stromkreisbezogene Mängel</h2><table><thead><tr><th>Nr.</th><th>UV</th><th>Stromkreis</th><th>Priorität</th><th>Feststellung / Maßnahme</th><th>Fotos</th></tr></thead><tbody>${defects.map((entry) => `<tr><td>${entry.number}</td><td>${esc(entry.uv)}</td><td>${esc(entry.c.name || "-")}</td><td>${defectPriorityLabel(entry.c.defectPriority)}</td><td>${esc(entry.c.defect || "-")}</td><td>${(entry.c.defectPhotos || []).length}</td></tr>`).join("")}</tbody></table>`
      : "",
    allPhotos = reportPhotos(d);
  const photosHtml = allPhotos.length
    ? `<h2>Fotodokumentation</h2><div class="printPhotos">${allPhotos.map((photo, i) => `<figure><img src="${photo.dataUrl}" alt="Foto ${i + 1}"><figcaption>${esc(photo.caption || photo.name || `Foto ${i + 1}`)}</figcaption></figure>`).join("")}</div>`
    : "";
  const directoryRows = circuitDirectoryEntries(d),
    directoryHtml = f.includeCircuitDirectory
      ? `<section class="circuitDirectoryPage"><h1>Stromkreisverzeichnis</h1><p><b>Anlage / Objekt:</b> ${esc(f.objekt || "-")} &nbsp; · &nbsp; <b>Adresse:</b> ${esc(f.adresse || "-")}</p><table><thead><tr><th>Nr.</th><th>Verteilung</th><th>Stromkreis / Verbraucher</th><th>FI/RCD</th><th>Schutzorgan</th><th>Leitung</th><th>Bemerkung</th></tr></thead><tbody>${directoryRows.map((entry) => `<tr><td>${esc(entry.number)}</td><td>${esc(entry.uv)}</td><td>${esc(entry.name)}</td><td>${esc(entry.fi)}</td><td>${esc(entry.protection)}</td><td>${esc(entry.cable)}</td><td>${esc(entry.note || "")}</td></tr>`).join("") || '<tr><td colspan="7">Keine Stromkreise vorhanden</td></tr>'}</tbody></table><p class="smalltxt">Erstellt aus dem VDE-Prüfprotokoll ${esc(f.protocolNo || "-")} · Stand ${esc(deDate(f.endDate || f.datum))}</p></section>`
      : "";
  const overall = bad
    ? `<span class="bad">Nicht in Ordnung (${bad} Fehler, ${warn} Hinweise)</span>`
    : warn
      ? `<span class="warn">Prüfen / unvollständig (${warn} Hinweise)</span>`
      : `<span class="ok">In Ordnung</span>`;
  const logo = logoData
    ? `<img src="${logoData}" alt="Firmenlogo">`
    : "<div></div>";
  const standards =
    [
      f.norm0100600 && "DIN VDE 0100-600",
      f.norm0105100 && "DIN VDE 0105-100",
      f.echeck && "E-CHECK",
      f.dguv3 && "DGUV Vorschrift 3",
      f.betrsichv && "BetrSichV",
    ]
      .filter(Boolean)
      .join(" · ") || "-";
  const testType =
    [
      f.erst && "Neuanlage",
      f.aenderung && "Änderung",
      f.erweiterung && "Erweiterung",
      f.wieder && "Wiederholungsprüfung",
      f.instandsetzung && "Instandsetzung",
    ]
      .filter(Boolean)
      .join(", ") || "-";
  const potential =
    potentialFields
      .filter(([id]) => f[id])
      .map(([, label]) => label)
      .concat(f.paOther ? [f.paOther] : [])
      .join(", ") || "Keine Angaben";
  const devices =
    [
      [f.gHersteller, f.gTyp, f.gSerie, f.gKal],
      [f.g2Hersteller, f.g2Typ, f.g2Serie, f.g2Kal],
      [f.g3Hersteller, f.g3Typ, f.g3Serie, f.g3Kal],
    ]
      .filter((row) => row.some(Boolean))
      .map(
        (row, i) =>
          `<b>Messgerät ${i + 1}:</b> ${esc(row[0])} ${esc(row[1])} · SN ${esc(row[2] || "-")} · Kalibrierung ${esc(deDate(row[3]))}`,
      )
      .join("<br>") || "Keine Angaben";
  const footer = `<div class="pdfFooter"><div><b>${esc(f.firmName || "")}</b><br>${esc(f.firmStreet || "")}<br>${esc(f.firmCity || "")}</div><div>Tel.: ${esc(f.firmTel || "")}<br>Fax: ${esc(f.firmFax || "")}<br>Mobil: ${esc(f.firmMobile || "")}<br>E-Mail: ${esc(f.firmEmail || "")}</div><div>${esc(f.firmHRB || "")}<br>${esc(f.firmCourt || "")}<br>Geschäftsführer:<br>${esc(f.firmCEO || "")}</div></div>`;
  document.getElementById("printReport").innerHTML = `
    <div class="printHeader"><div>${logo}</div><div><h1>VDE Prüfprotokoll</h1><p>${esc(standards)}</p></div><div class="smalltxt"><b>Protokoll-Nr.:</b> ${esc(f.protocolNo || "-")}<br><b>Blatt:</b> ${esc(f.sheetNo || "1")} von ${esc(f.sheetTotal || "1")}<br><b>Prüfer:</b> ${esc(f.pruefer || "-")}</div></div>
    <div class="meta">
      <div class="box"><b>Kunden-Nr.:</b> ${esc(f.customerNo || "-")}<br><b>Auftrags-Nr.:</b> ${esc(f.orderNo || "-")}<br><b>Auftraggeber:</b> ${esc(f.kunde)}<br><b>Auftragnehmer:</b> ${esc(f.firmName || f.firma)}<br><b>Anlage:</b> ${esc(f.objekt)}<br><b>Adresse:</b> ${esc(f.adresse)}</div>
      <div class="box"><b>Beginn:</b> ${esc(deDate(f.datum))} ${esc(f.startTime)}<br><b>Ende:</b> ${esc(deDate(f.endDate))} ${esc(f.endTime)}<br><b>Prüfer:</b> ${esc(f.pruefer)}<br><b>Prüfart:</b> ${esc(testType)}<br><b>Regelwerk:</b> ${esc(standards)}</div>
      <div class="box"><b>Netzform:</b> ${esc(f.netzform)}<br><b>Nennspannung:</b> ${esc(f.spannung)}<br><b>Frequenz:</b> ${esc(f.frequenz)}<br><b>Netzbetreiber:</b> ${esc(f.netzbetreiber)}</div>
      <div class="box"><b>Messgeräte nach:</b> ${esc(f.gVde || "-")}<br>${devices}</div>
      <div class="box"><b>Hausanschlusskasten:</b> ${esc(f.hakName)}<br><b>Ort:</b> ${esc(f.hakPlace)}<br><b>Vorsicherung:</b> ${esc(f.hakFuse)}<br><b>Zuleitung:</b> ${esc(displayCable(f.hakCable, f.hakCableCustom))} ${f.hakCores ? esc(f.hakCores) + "-adrig " : ""}${f.hakCross ? esc(f.hakCross) + " mm²" : ""}<br><b>kommt von:</b> ${esc(f.hakSource)}</div>
      <div class="box"><b>Spannungsfall:</b> ${esc(f.voltageDrop || "-")} %<br><b>Erdungswiderstand R<sub>E</sub>:</b> ${esc(f.earthResistance || "-")} Ω<br><b>Potentialausgleich:</b> ${esc(f.paResult || "-")} Ω<br><b>Einbezogen:</b> ${esc(potential)}</div>
    </div>
    <h2>Besichtigen und Erproben</h2>
    <table class="compactChecks"><tr><th>Besichtigen</th><th>Bew.</th><th>Besichtigen</th><th>Bew.</th><th>Erproben</th><th>Bew.</th></tr>${checksHtml}</table>
    <h2>Messwerte nach UV / Schutzart / Stromkreis</h2>
    <table class="measurementTable">${rows || "<tr><td>Keine Messwerte eingetragen</td></tr>"}</table>
    ${useDetailedInsulation ? `<h2>Detaillierte Isolationsmessung</h2><table><tr><th>Nr.</th><th>U Mess V</th><th>Verbraucher</th><th>N–PE</th><th>L1–PE</th><th>L1–N</th><th>L2–PE</th><th>L2–N</th><th>L3–PE</th><th>L3–N</th><th>L1–L2</th><th>L1–L3</th><th>L2–L3</th></tr>${insulationRows || '<tr><td colspan="13">Keine Detailwerte eingetragen</td></tr>'}</table>` : ""}
    <h2>Mängel / Hinweise</h2>
    <div class="box">${esc(f.maengel || "Keine Angaben").replace(/\n/g, "<br>")}</div>
    ${defectsHtml}
    <h2>Ergebnis</h2>
    <div class="box"><b>Automatische Bewertung:</b> ${overall}<br><b>Ergebnis laut Prüfer:</b> ${esc(f.ergebnis)}<br><b>Prüfplakette:</b> ${f.plakette === "ja" ? "Ja" : f.plakette === "nein" ? "Nein" : "Nicht bewertet"}<br><b>Nächste Prüfung empfohlen bis:</b> ${esc(deDate(f.next))}</div>
    ${photosHtml}
    <div class="signatures">
      <div><b>Unterschrift Prüfer</b><div class="signatureLine sigImg">${prueferSig}</div><div class="smalltxt">Datum / Name / Unterschrift</div></div>
      <div><b>Unterschrift Meister</b><div class="signatureLine"></div><div class="smalltxt">${esc(f.masterName || "Name Meister")} · Datum / Unterschrift</div></div>
      <div><b>Unterschrift Auftraggeber / Betreiber</b><div class="signatureLine"></div><div class="smalltxt">Datum / Name / Unterschrift</div></div>
    </div>
    <p class="smalltxt">Hinweis: Automatische Bewertungen sind Hilfsfunktionen und ersetzen nicht die fachliche Beurteilung durch die Elektrofachkraft.</p><div class="footerSpace"></div>${directoryHtml}${footer}`;
}
function printProtocol() {
  preparePrint();
  setTimeout(() => {
    if (typeof window.print === "function") window.print();
    else showToast("Drucken wird von diesem Browser nicht unterstützt.", true);
  }, 120);
}
function pdfImageData(img) {
  try {
    if (!img || !img.complete || !img.naturalWidth) return "";
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    c.getContext("2d").drawImage(img, 0, 0);
    return c.toDataURL("image/png");
  } catch (_) {
    return "";
  }
}
function pdfFileName(f) {
  const base =
    f.protocolNo ||
    document.getElementById("protocolTitle").value ||
    "VDE-Pruefprotokoll";
  return `${
    String(base)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-|-$/g, "") || "VDE-Pruefprotokoll"
  }.pdf`;
}
async function createPdf() {
  const button = document.getElementById("pdfButton"),
    oldText = button && button.textContent;
  if (button) {
    button.disabled = true;
    button.textContent = "PDF wird erstellt …";
  }
  try {
    if (!window.jspdf || !window.jspdf.jsPDF)
      throw new Error("PDF-Modul wurde nicht geladen");
    const { jsPDF } = window.jspdf,
      doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      }),
      d = collect(),
      f = d.fields || {},
      useDetailedInsulation = !!f.detailedInsulation,
      pageW = doc.internal.pageSize.getWidth(),
      pageH = doc.internal.pageSize.getHeight(),
      margin = 10;
    const runTable = (options) => {
      if (typeof doc.autoTable === "function") doc.autoTable(options);
      else if (
        window.jspdfAutotable &&
        typeof window.jspdfAutotable.autoTable === "function"
      )
        window.jspdfAutotable.autoTable(doc, options);
      else throw new Error("PDF-Tabellenmodul wurde nicht geladen");
    };
    const standards =
      [
        f.norm0100600 && "DIN VDE 0100-600",
        f.norm0105100 && "DIN VDE 0105-100",
        f.echeck && "E-CHECK",
        f.dguv3 && "DGUV Vorschrift 3",
        f.betrsichv && "BetrSichV",
      ]
        .filter(Boolean)
        .join(" · ") || "-";
    const testType =
      [
        f.erst && "Neuanlage",
        f.aenderung && "Änderung",
        f.erweiterung && "Erweiterung",
        f.wieder && "Wiederholungsprüfung",
        f.instandsetzung && "Instandsetzung",
      ]
        .filter(Boolean)
        .join(", ") || "-";
    let y = 12;
    const ensure = (height) => {
      if (y + height > pageH - 16) {
        doc.addPage();
        y = 12;
      }
    };
    const section = (title) => {
      ensure(12);
      doc.setFillColor(32, 37, 43);
      doc.rect(margin, y, pageW - margin * 2, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(title, margin + 3, y + 5.5);
      doc.setTextColor(31, 41, 51);
      y += 11;
    };
    const table = (head, body, options = {}) => {
      runTable({
        startY: y,
        head: [head],
        body,
        theme: "grid",
        showHead: "everyPage",
        rowPageBreak: "avoid",
        margin: { left: margin, right: margin },
        styles: {
          font: "helvetica",
          fontSize: options.fontSize || 7.5,
          cellPadding: 1.4,
          valign: "middle",
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [192, 24, 32],
          textColor: 255,
          fontStyle: "bold",
        },
        alternateRowStyles: { fillColor: [247, 249, 251] },
        ...options,
      });
      y = ((doc.lastAutoTable && doc.lastAutoTable.finalY) || y) + 5;
    };
    const logo = pdfImageData(document.querySelector(".appLogo"));
    const titleX = logo ? 34 : margin;
    if (logo) doc.addImage(logo, "PNG", margin, 4, 20, 20, undefined, "FAST");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(19);
    doc.setTextColor(32, 37, 43);
    doc.text("VDE Prüfprotokoll", titleX, 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(102, 120, 138);
    doc.text(standards, titleX, 19);
    doc.setFontSize(8);
    doc.setTextColor(32, 37, 43);
    doc.text(
      `Protokoll-Nr.: ${f.protocolNo || "-"}   ·   Blatt ${f.sheetNo || "1"} von ${f.sheetTotal || "1"}`,
      pageW - margin,
      12,
      { align: "right" },
    );
    doc.text(`Prüfer: ${f.pruefer || "-"}`, pageW - margin, 18, {
      align: "right",
    });
    y = 26;
    section("Auftrag und Prüfungsdaten");
    table(
      ["Angabe", "Wert", "Angabe", "Wert"],
      [
        ["Kunden-Nr.", f.customerNo || "-", "Auftrags-Nr.", f.orderNo || "-"],
        [
          "Auftraggeber",
          f.kunde || "-",
          "Auftragnehmer",
          f.firmName || f.firma || "-",
        ],
        ["Anlage / Objekt", f.objekt || "-", "Adresse", f.adresse || "-"],
        [
          "Beginn",
          `${deDate(f.datum)} ${f.startTime || ""}`.trim(),
          "Ende",
          `${deDate(f.endDate)} ${f.endTime || ""}`.trim(),
        ],
        ["Prüfart", testType, "Regelwerk", standards],
        [
          "Netz",
          `${f.spannung || "-"} · ${f.frequenz || "-"}`,
          "Netzsystem / Betreiber",
          `${f.netzform || "-"} · ${f.netzbetreiber || "-"}`,
        ],
      ],
      {
        columnStyles: {
          0: { cellWidth: 30, fontStyle: "bold" },
          1: { cellWidth: 65 },
          2: { cellWidth: 30, fontStyle: "bold" },
          3: { cellWidth: 65 },
        },
        fontSize: 7,
      },
    );
    section("Verwendete Messgeräte");
    const deviceRows = [
      [f.gHersteller, f.gTyp, f.gSerie, f.gKal],
      [f.g2Hersteller, f.g2Typ, f.g2Serie, f.g2Kal],
      [f.g3Hersteller, f.g3Typ, f.g3Serie, f.g3Kal],
    ]
      .filter((row) => row.some(Boolean))
      .map((row, i) => [
        i + 1,
        row[0] || "-",
        row[1] || "-",
        row[2] || "-",
        deDate(row[3]),
      ]);
    table(
      ["Nr.", "Fabrikat", "Typ", "Seriennummer", "Kalibrierung gültig bis"],
      deviceRows.length ? deviceRows : [["1", "-", "-", "-", "-"]],
      { columnStyles: { 0: { cellWidth: 16 } }, fontSize: 8 },
    );
    section("Besichtigen und Erproben");
    const checkRows = compactCheckRows(d.checks);
    table(
      ["Besichtigen", "Bew.", "Besichtigen", "Bew.", "Erproben", "Bew."],
      checkRows,
      {
        styles: {
          font: "helvetica",
          fontSize: 6.5,
          cellPadding: 1,
          valign: "middle",
          overflow: "linebreak",
        },
        columnStyles: {
          1: { cellWidth: 14, halign: "center" },
          3: { cellWidth: 14, halign: "center" },
          5: { cellWidth: 14, halign: "center" },
        },
        fontSize: 6.5,
      },
    );
    section("Einspeisung, Erdung und Potentialausgleich");
    const potential =
      potentialFields
        .filter(([id]) => f[id])
        .map(([, label]) => label)
        .concat(f.paOther ? [f.paOther] : [])
        .join(", ") || "Keine Angaben";
    table(
      ["Angabe", "Wert"],
      [
        ["Hausanschluss / Ort", `${f.hakName || "-"} · ${f.hakPlace || "-"}`],
        [
          "Vorsicherung / Herkunft",
          `${f.hakFuse || "-"} · ${f.hakSource || "-"}`,
        ],
        [
          "Zuleitung",
          `${displayCable(f.hakCable, f.hakCableCustom) || "-"} · ${f.hakCores || "-"}-adrig · ${deNumber(f.hakCross)} mm²`,
        ],
        ["Spannungsfall", `${deNumber(f.voltageDrop)} %`],
        ["Erdungswiderstand RE", `${deNumber(f.earthResistance)} Ohm`],
        ["Potentialausgleich", `${deNumber(f.paResult)} Ohm`],
        ["Einbezogene Systeme", potential],
      ],
      {
        columnStyles: { 0: { cellWidth: 52, fontStyle: "bold" } },
        fontSize: 8,
      },
    );
    const protectionRows = [],
      measurementRows = [],
      isolationRows = [];
    (d.uvs || []).forEach((u, ui) => {
      (u.rcds || []).forEach((r, ri) => {
        const fiNumber = `${ui + 1}.${ri + 1}`;
        (r.circuits || []).forEach((c, cki) =>
          pdfCircuitRows(
            `${fiNumber}.${cki + 1}`,
            u,
            r,
            c,
            true,
            protectionRows,
            measurementRows,
            isolationRows,
            useDetailedInsulation,
          ),
        );
      });
      (u.direct || []).forEach((c, cki) =>
        pdfCircuitRows(
          `${ui + 1}.D${cki + 1}`,
          u,
          null,
          c,
          false,
          protectionRows,
          measurementRows,
          isolationRows,
          useDetailedInsulation,
        ),
      );
    });
    const defectRows = protocolCircuitEntries(d)
      .filter((entry) => entry.c.defect || entry.c.defectPriority)
      .map((entry) => [
        entry.number,
        entry.uv,
        entry.c.name || "-",
        defectPriorityLabel(entry.c.defectPriority),
        entry.c.defect || "-",
        String((entry.c.defectPhotos || []).length),
      ]);
    doc.addPage();
    y = 12;
    section("Stromkreise und Schutzorgane");
    table(
      [
        "Nr.",
        "UV",
        "Zielbezeichnung",
        "Leitung",
        "Adern / mm²",
        "Schutzart",
        "FI-Zuordnung",
        "Schutzorgan",
        "Bewertung",
      ],
      protectionRows.length
        ? protectionRows
        : [["-", "-", "Keine Stromkreise", "-", "-", "-", "-", "-", "-"]],
      {
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 18 },
          2: { cellWidth: 34 },
          3: { cellWidth: 18 },
          4: { cellWidth: 20 },
          5: { cellWidth: 16 },
          6: { cellWidth: 24 },
          7: { cellWidth: 30 },
          8: { cellWidth: 18 },
        },
        fontSize: 5.5,
      },
    );
    section("Messwerte");
    table(
      [
        "Nr.",
        "RPE Ohm",
        "RISO MOhm",
        "U Mess V",
        "Zi L-N Ohm",
        "Zs L-PE Ohm",
        "IK A",
        "UL V",
        "RCD ms",
        "RCD mA",
        "Bemerkung",
      ],
      measurementRows.length
        ? measurementRows
        : [["-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"]],
      {
        columnStyles: {
          0: { cellWidth: 12 },
          1: { cellWidth: 12 },
          2: { cellWidth: 12 },
          3: { cellWidth: 12 },
          4: { cellWidth: 12 },
          5: { cellWidth: 12 },
          6: { cellWidth: 12 },
          7: { cellWidth: 12 },
          8: { cellWidth: 12 },
          9: { cellWidth: 12 },
          10: { cellWidth: 70 },
        },
        fontSize: 5.3,
      },
    );
    if (useDetailedInsulation) {
      section("Detaillierte Isolationsmessung");
      table(
        [
          "Nr.",
          "Verbr.",
          "N–PE",
          "L1–PE",
          "L1–N",
          "L2–PE",
          "L2–N",
          "L3–PE",
          "L3–N",
          "L1–L2",
          "L1–L3",
          "L2–L3",
        ],
        isolationRows.length
          ? isolationRows
          : [["-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"]],
        {
          columnStyles: {
            0: { cellWidth: 12 },
            1: { cellWidth: 15 },
            2: { cellWidth: 16 },
            3: { cellWidth: 16 },
            4: { cellWidth: 16 },
            5: { cellWidth: 16 },
            6: { cellWidth: 16 },
            7: { cellWidth: 16 },
            8: { cellWidth: 16 },
            9: { cellWidth: 16 },
            10: { cellWidth: 16 },
            11: { cellWidth: 16 },
          },
          fontSize: 5.1,
        },
      );
    }
    if (defectRows.length) {
      section("Stromkreisbezogene Mängel");
      table(
        [
          "Nr.",
          "UV",
          "Stromkreis",
          "Priorität",
          "Feststellung / Maßnahme",
          "Fotos",
        ],
        defectRows,
        {
          columnStyles: {
            0: { cellWidth: 14 },
            1: { cellWidth: 24 },
            2: { cellWidth: 32 },
            3: { cellWidth: 20 },
            4: { cellWidth: 84 },
            5: { cellWidth: 16, halign: "center" },
          },
          fontSize: 6.5,
        },
      );
    }
    section("Mängel und Ergebnis");
    table(
      ["Angabe", "Dokumentation"],
      [
        ["Allgemeine Mängel / Hinweise", f.maengel || "Keine Angaben"],
        ["Ergebnis", f.ergebnis || "-"],
        [
          "Prüfplakette",
          f.plakette === "ja"
            ? "Ja – angebracht"
            : f.plakette === "nein"
              ? "Nein"
              : "Nicht bewertet",
        ],
        ["Nächster Prüftermin", deDate(f.next)],
      ],
      {
        columnStyles: { 0: { cellWidth: 44, fontStyle: "bold" } },
        fontSize: 8,
      },
    );
    ensure(27);
    const signatureGap = 6,
      signatureWidth = (pageW - margin * 2 - signatureGap * 2) / 3,
      masterX = margin + signatureWidth + signatureGap,
      customerX = masterX + signatureWidth + signatureGap,
      lineY = y + 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("Unterschrift Prüfer", margin, y);
    doc.text(`Meister: ${f.masterName || "—"}`, masterX, y, {
      maxWidth: signatureWidth,
    });
    doc.text("Unterschrift Auftraggeber / Betreiber", customerX, y, {
      maxWidth: signatureWidth,
    });
    doc.setDrawColor(90);
    doc.line(margin, lineY, margin + signatureWidth, lineY);
    doc.line(masterX, lineY, masterX + signatureWidth, lineY);
    doc.line(customerX, lineY, customerX + signatureWidth, lineY);
    if (d.sig && d.sig.startsWith("data:image")) {
      try {
        doc.addImage(
          d.sig,
          "PNG",
          margin + 2,
          y + 2,
          signatureWidth - 4,
          14,
          undefined,
          "FAST",
        );
      } catch (_) {
        /* Unterschrift bleibt über der Linie frei */
      }
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(90);
    doc.text("Datum / Name / Unterschrift", margin, lineY + 4);
    doc.text("Datum / Name / Unterschrift", masterX, lineY + 4);
    doc.text("Datum / Name / Unterschrift", customerX, lineY + 4);
    doc.setTextColor(31, 41, 51);
    y += 26;
    const allPhotos = reportPhotos(d);
    if (allPhotos.length) {
      section("Fotodokumentation");
      const photoGap = 8,
        photoWidth = (pageW - margin * 2 - photoGap) / 2,
        photoHeight = 50;
      let x = margin,
        col = 0;
      for (let i = 0; i < allPhotos.length; i++) {
        const photo = allPhotos[i];
        if (col === 2) {
          y += photoHeight + 9;
          x = margin;
          col = 0;
        }
        ensure(photoHeight + 9);
        try {
          doc.addImage(
            photo.dataUrl,
            "JPEG",
            x,
            y,
            photoWidth,
            photoHeight,
            undefined,
            "FAST",
          );
        } catch (_) {
          try {
            doc.addImage(
              photo.dataUrl,
              "PNG",
              x,
              y,
              photoWidth,
              photoHeight,
              undefined,
              "FAST",
            );
          } catch (__) {
            /* Bild überspringen */
          }
        }
        doc.setFontSize(7);
        doc.text(
          photo.caption || photo.name || `Foto ${i + 1}`,
          x,
          y + photoHeight + 4,
          { maxWidth: photoWidth },
        );
        x += photoWidth + photoGap;
        col++;
      }
      y += photoHeight + 9;
    }
    if (f.includeCircuitDirectory) {
      const directoryRows = circuitDirectoryEntries(d).map((entry) => [
        entry.number,
        entry.uv,
        entry.name,
        entry.fi,
        entry.protection,
        entry.cable,
        entry.note || "",
      ]);
      doc.addPage();
      y = 12;
      section("Stromkreisverzeichnis");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        `Anlage / Objekt: ${f.objekt || "-"}   ·   Adresse: ${f.adresse || "-"}`,
        margin,
        y,
        { maxWidth: pageW - margin * 2 },
      );
      y += 5;
      table(
        [
          "Nr.",
          "Verteilung",
          "Stromkreis / Verbraucher",
          "FI/RCD",
          "Schutzorgan",
          "Leitung",
          "Bemerkung",
        ],
        directoryRows.length
          ? directoryRows
          : [["-", "-", "Keine Stromkreise", "-", "-", "-", "-"]],
        {
          columnStyles: {
            0: { cellWidth: 13 },
            1: { cellWidth: 24 },
            2: { cellWidth: 45 },
            3: { cellWidth: 25 },
            4: { cellWidth: 32 },
            5: { cellWidth: 30 },
            6: { cellWidth: 21 },
          },
          fontSize: 6.5,
        },
      );
    }
    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page++) {
      doc.setPage(page);
      doc.setDrawColor(190);
      doc.line(margin, pageH - 10, pageW - margin, pageH - 10);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(90);
      doc.text(
        `${f.firmName || ""} · ${f.firmStreet || ""} · ${f.firmCity || ""} · ${f.firmTel || ""} · ${f.firmEmail || ""}`,
        margin,
        pageH - 6,
      );
      doc.text(`Seite ${page} von ${pages}`, pageW - margin, pageH - 6, {
        align: "right",
      });
    }
    const blob = doc.output("blob"),
      filename = pdfFileName(f),
      file = new File([blob], filename, { type: "application/pdf" });
    let shared = false;
    if (
      navigator.share &&
      (!navigator.canShare || navigator.canShare({ files: [file] }))
    ) {
      try {
        await navigator.share({ files: [file], title: "VDE Prüfprotokoll" });
        shared = true;
        showToast("PDF erstellt und zum Teilen geöffnet");
      } catch (error) {
        if (error && error.name === "AbortError") {
          showToast("Teilen abgebrochen");
          return;
        }
      }
    }
    if (!shared) {
      const url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.target = "_blank";
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      showToast("PDF wurde erstellt und heruntergeladen");
    }
  } catch (error) {
    console.error(error);
    showToast(
      `PDF konnte nicht erstellt werden: ${error.message || "Unbekannter Fehler"}`,
      true,
    );
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = oldText;
    }
  }
}
function pdfCircuitRows(
  number,
  u,
  r,
  c,
  hasUpstreamRcd,
  protectionRows,
  measurementRows,
  isolationRows,
  useDetailedInsulation,
) {
  const hasRcd = hasUpstreamRcd || c.device === "fils",
    ce = circuitEvalText(c, hasRcd, r, useDetailedInsulation),
    effectiveRiso = effectiveRisoData(c, useDetailedInsulation),
    kind = c.device === "fils" ? "FI/LS" : "LS",
    fi =
      c.device === "fils"
        ? "integriert"
        : hasUpstreamRcd
          ? (r && r.name) || "FI"
          : "—",
    device =
      c.device === "fils"
        ? `FI/LS ${c.char || ""}${c.a || ""} A · Typ ${c.rcdType || "A"} · ${c.rcdIdn || "30"} mA`
        : `LS ${c.char || ""}${c.a || ""} A`;
  protectionRows.push([
    number,
    u.name || "-",
    c.name || "-",
    c.cable || "-",
    `${c.cores || "-"} / ${deNumber(c.cross)}`,
    kind,
    fi,
    device,
    ce.text,
  ]);
  measurementRows.push([
    number,
    deNumber(c.rpe),
    deNumber(isNaN(effectiveRiso) ? "" : effectiveRiso),
    deNumber(c.risoV),
    deNumber(c.zi),
    deNumber(c.zs),
    deNumber(c.ik),
    deNumber(c.rcdUl),
    deNumber(c.rcdms),
    deNumber(c.rcdma),
    pdfSafeText(c.note || ce.msg || "-"),
  ]);
  if (useDetailedInsulation)
    isolationRows.push([
      number,
      c.consumer === "ja" ? "Ja" : c.consumer === "nein" ? "Nein" : "-",
      ...risoKeys.map((key) => deNumber(c[key])),
    ]);
}
function protectionLabel(c, hasUpstreamRcd, r) {
  if (c.device === "fils") {
    return {
      kind: "FI/LS",
      fi: "FI/LS integriert",
      device: `FI/LS ${esc((c.char || "") + (c.a || "") + "A")} / Typ ${esc(c.rcdType || "A")} / IΔn ${esc(c.rcdIdn || "30")} mA`,
    };
  }
  if (hasUpstreamRcd) {
    return {
      kind: "LS",
      fi: esc((r && r.name) || "FI"),
      device: `LS ${esc((c.char || "") + (c.a || "") + "A")}`,
    };
  }
  return {
    kind: "LS",
    fi: "—",
    device: `LS ${esc((c.char || "") + (c.a || "") + "A")}`,
  };
}
function measHeader() {
  return `<tr><th>Nr.</th><th>UV</th><th>Stromkreis</th><th>Kabeltyp</th><th>Adern</th><th>Querschnitt</th><th>Schutzart</th><th>FI-Zuordnung</th><th>Schutzorgan</th><th>RPE Ω</th><th>RISO MΩ</th><th>Zi L-N Ω</th><th>Zs L-PE Ω</th><th>IK A</th><th>U L V</th><th>RCD Zeit ms</th><th>RCD Strom mA</th><th>Bemerkung</th><th>Bewertung</th><th>Hinweis</th></tr>`;
}
function measRow(uv, fi, c, ce, n, hasUpstreamRcd = false, r = null) {
  const qs = c.cross ? esc(deNumber(c.cross)) + " mm²" : "-";
  const p = protectionLabel(c, hasUpstreamRcd, r);
  return `<tr><td>${n}</td><td>${esc(uv || "-")}</td><td>${esc(c.name || "-")}</td><td>${esc(c.cable || "-")}</td><td>${esc(c.cores || "-")}</td><td>${qs}</td><td><b>${p.kind}</b></td><td>${p.fi}</td><td>${p.device}</td><td>${esc(deNumber(c.rpe))}</td><td>${esc(deNumber(c.riso))}</td><td>${esc(deNumber(c.zi))}</td><td>${esc(deNumber(c.zs))}</td><td>${esc(deNumber(c.ik))}</td><td>${esc(deNumber(c.rcdUl))}</td><td>${esc(deNumber(c.rcdms))}</td><td>${esc(deNumber(c.rcdma))}</td><td>${esc(c.note || "")}</td><td class="${ce.state}">${ce.text}</td><td>${esc(ce.msg)}</td></tr>`;
}
function insulationRow(n, c) {
  return `<tr><td>${n}</td><td>${esc(deNumber(c.risoV))}</td><td>${c.consumer === "ja" ? "Ja" : c.consumer === "nein" ? "Nein" : "-"}</td>${risoKeys.map((key) => `<td>${esc(deNumber(c[key]))}</td>`).join("")}</tr>`;
}
window.addEventListener("beforeprint", preparePrint);

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("sites"))
        db.createObjectStore("sites", { keyPath: "id" });
      if (!db.objectStoreNames.contains("protocols")) {
        const store = db.createObjectStore("protocols", { keyPath: "id" });
        store.createIndex("siteId", "siteId", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains("settings"))
        db.createObjectStore("settings", { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error ||
          new Error("Lokale Datenbank konnte nicht geöffnet werden."),
      );
  });
}
function dbAction(storeName, mode, action) {
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, mode),
      store = tx.objectStore(storeName),
      request = action(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function dbGet(store, key) {
  return dbAction(store, "readonly", (s) => s.get(key));
}
function dbAll(store) {
  return dbAction(store, "readonly", (s) => s.getAll());
}
function dbPut(store, value) {
  return dbAction(store, "readwrite", (s) => s.put(value));
}
function dbDelete(store, key) {
  return dbAction(store, "readwrite", (s) => s.delete(key));
}
function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID ? crypto.randomUUID() : Date.now() + "_" + Math.random().toString(16).slice(2)}`;
}
function nowIso() {
  return new Date().toISOString();
}
function captureInitialFieldValues() {
  fields.forEach((id) => {
    const e = document.getElementById(id);
    if (!e) return;
    initialFieldValues[id] =
      e.type === "checkbox" ? e.checked : e.type === "radio" ? false : e.value;
  });
}
function makeBlankData(extraFields = {}) {
  return {
    fields: { ...initialFieldValues, ...extraFields },
    checks: {},
    uvs: [],
    photos: [],
    sig: "",
  };
}
function formatDate(value, withTime = false) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(
    "de-DE",
    withTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" },
  ).format(d);
}
function showToast(message, error = false) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast show" + (error ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.className = "toast"), 2600);
}
function setSaveState(kind, text) {
  const e = document.getElementById("saveState");
  if (e) {
    e.className = `saveState ${kind}`;
    e.textContent = text;
  }
}
function showStep(step, scroll = true) {
  currentStep = Math.max(1, Math.min(5, Number(step) || 1));
  document
    .querySelectorAll(".protocolStep")
    .forEach((section) =>
      section.classList.toggle(
        "active",
        Number(section.dataset.step) === currentStep,
      ),
    );
  document.querySelectorAll("[data-step-target]").forEach((button) => {
    const n = Number(button.dataset.stepTarget);
    button.classList.toggle("active", n === currentStep);
    button.classList.toggle("visited", n < currentStep);
  });
  const info = stepInfo[currentStep];
  document.getElementById("stepCounter").textContent =
    `Schritt ${currentStep} von 5`;
  document.getElementById("stepTitle").textContent = info.title;
  document.getElementById("stepDescription").textContent = info.description;
  document.getElementById("prevStep").disabled = currentStep === 1;
  const next = document.getElementById("nextStep");
  next.classList.toggle("hidden", currentStep === 5);
  next.textContent = currentStep === 4 ? "Zum Abschluss →" : "Weiter →";
  updateStepProgress();
  if (scroll)
    document
      .getElementById("stepIntro")
      .scrollIntoView({ behavior: "smooth", block: "start" });
}
function changeStep(direction) {
  showStep(currentStep + Number(direction || 0));
}
function updateStepProgress() {
  const progress = document.getElementById("stepProgress");
  if (!progress) return;
  let completed = 0,
    total = 1,
    label = "";
  if (currentStep === 1) {
    const selectors = ["#kunde", "#objekt", "#adresse", "#datum", "#pruefer"];
    total = selectors.length + 1;
    completed =
      selectors.filter((s) => document.querySelector(s)?.value.trim()).length +
      (document.querySelector("[name=pruefart]:checked") ? 1 : 0);
  }
  if (currentStep === 2) {
    total = checkItems.length;
    completed = checkItems.filter((_, i) =>
      document.querySelector(`[name=c${i}]:checked`),
    ).length;
  }
  if (currentStep === 3) {
    const selectors = [
      "#hakName",
      "#hakPlace",
      "#hakFuse",
      "#hakSource",
      "#hakCable",
      "#hakCores",
      "#hakCross",
      "#voltageDrop",
      "#earthResistance",
      "#paResult",
    ];
    total = selectors.length;
    completed = selectors.filter((s) =>
      document.querySelector(s)?.value.trim(),
    ).length;
  }
  if (currentStep === 4) {
    const circuits = [...document.querySelectorAll(".circuit")];
    total = Math.max(1, circuits.length);
    completed = circuits.filter((c) => {
      const hasRcd = !!c.closest(".rcd") || val(c, ".ck-device") === "fils";
      return (
        val(c, ".ck-name") &&
        !isNaN(effectiveRisoElement(c)) &&
        (hasRcd
          ? val(c, ".ck-rcdms") && val(c, ".ck-rcdma")
          : val(c, ".ck-zs") || val(c, ".ck-ik"))
      );
    }).length;
    label = circuits.length
      ? `${completed} von ${circuits.length} Stromkreisen vollständig`
      : "Noch kein Stromkreis";
  }
  if (currentStep === 5) {
    total = 4;
    completed =
      (document.getElementById("ergebnis").value ? 1 : 0) +
      (document.getElementById("plakette").value ? 1 : 0) +
      (document.getElementById("next").value ? 1 : 0) +
      (document.getElementById("protocolStatus").value === "completed" ? 1 : 0);
  }
  const percent = Math.round((completed / Math.max(1, total)) * 100);
  progress.textContent = label || `${percent} % ausgefüllt`;
  progress.style.setProperty("--progress", `${percent}%`);
}
function showDialog(dialog) {
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}
function closeDialog(dialog) {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

async function initApp() {
  initSettings();
  captureInitialFieldValues();
  try {
    database = await openDatabase();
    await migrateLegacyData();
    document
      .getElementById("siteSearch")
      .addEventListener("input", renderSites);
    document
      .getElementById("backupImport")
      .addEventListener("change", importBackupFile);
    document
      .getElementById("siteForm")
      .addEventListener("submit", saveSiteForm);
    document
      .getElementById("protocolForm")
      .addEventListener("submit", saveProtocolForm);
    document
      .getElementById("presetForm")
      .addEventListener("submit", savePresetForm);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") persistCurrentProtocol(false);
    });
    window.addEventListener("pagehide", () => persistCurrentProtocol(false));
    await renderSites();
    updateStoragePill();
  } catch (error) {
    console.error(error);
    showToast("Lokale Speicherung konnte nicht gestartet werden.", true);
    document.getElementById("siteGrid").innerHTML =
      '<div class="emptyState"><div class="emptyIcon">⚠</div><h3>Lokaler Speicher nicht verfügbar</h3><p>Bitte die App in einem aktuellen Browser oder als installierte PWA öffnen.</p></div>';
  }
}

async function migrateLegacyData() {
  if (await dbGet("settings", "migration-v15")) return;
  const raw = localStorage.getItem(LEGACY_STORAGE);
  if (raw) {
    try {
      const data = JSON.parse(raw),
        f = data.fields || {},
        time = nowIso();
      const site = {
        id: makeId("site"),
        name: f.objekt || f.kunde || "Importierte Baustelle",
        customer: f.kunde || "",
        address: f.adresse || "",
        orderNo: "",
        note: "Aus der bisherigen V15 übernommen",
        createdAt: time,
        updatedAt: time,
      };
      const protocol = {
        id: makeId("protocol"),
        siteId: site.id,
        title: `${f.erst ? "Erstprüfung" : f.wieder ? "Wiederholungsprüfung" : f.aenderung ? "Änderung / Erweiterung" : "Prüfung"}${f.datum ? " · " + f.datum : ""}`,
        status: "draft",
        createdAt: time,
        updatedAt: time,
        data,
      };
      await dbPut("sites", site);
      await dbPut("protocols", protocol);
    } catch (error) {
      console.warn("V15-Daten konnten nicht übernommen werden.", error);
    }
  }
  await dbPut("settings", { key: "migration-v15", doneAt: nowIso() });
}

async function updateStoragePill() {
  if (!navigator.storage || !navigator.storage.estimate) return;
  try {
    const estimate = await navigator.storage.estimate(),
      used = estimate.usage || 0;
    document.getElementById("storagePill").title =
      `Belegt: ${used < 1048576 ? Math.round(used / 1024) + " KB" : (used / 1048576).toFixed(1) + " MB"} · nur auf diesem Gerät`;
  } catch (_) {
    /* Anzeige bleibt ohne Mengenangabe */
  }
}
async function updateBackupReminder(protocols) {
  const box = document.getElementById("backupReminder");
  if (!box || !database) return;
  const all = protocols || (await dbAll("protocols")),
    completed = all.filter((item) => item.status === "completed");
  if (!completed.length) {
    box.classList.add("hidden");
    return;
  }
  const saved = await dbGet("settings", "last-backup"),
    at = (saved && saved.at) || "",
    newer = completed.filter(
      (item) => (item.updatedAt || item.completedAt || "") > at,
    ).length,
    age = at
      ? Math.floor((Date.now() - new Date(at).getTime()) / 86400000)
      : Infinity;
  if (!at || newer || age >= 14) {
    box.classList.remove("hidden");
    box.innerHTML = `<b>Sicherung empfohlen</b><br>${!at ? "Noch keine Sicherung erstellt." : newer ? `${newer} abgeschlossene Prüfung${newer === 1 ? " wurde" : "en wurden"} seit der letzten Sicherung geändert.` : `Letzte Sicherung vor ${age} Tagen.`}`;
  } else box.classList.add("hidden");
}

async function renderSites() {
  const [sites, protocols] = await Promise.all([
    dbAll("sites"),
    dbAll("protocols"),
  ]);
  const query = (document.getElementById("siteSearch").value || "")
    .trim()
    .toLocaleLowerCase("de");
  const filtered = sites
    .filter((s) =>
      [s.name, s.customer, s.address, s.orderNo]
        .join(" ")
        .toLocaleLowerCase("de")
        .includes(query),
    )
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  const drafts = protocols.filter((p) => p.status !== "completed").length;
  document.getElementById("workspaceStats").innerHTML =
    `<b>${sites.length}</b> Baustellen · <b>${protocols.length}</b> Prüfungen · <b>${drafts}</b> offene Entwürfe`;
  await updateBackupReminder(protocols);
  const grid = document.getElementById("siteGrid");
  if (!filtered.length) {
    grid.innerHTML = `<div class="emptyState"><div class="emptyIcon">▰</div><h3>${query ? "Keine Baustelle gefunden" : "Noch keine Baustelle angelegt"}</h3><p>${query ? "Bitte einen anderen Suchbegriff verwenden." : "Lege den ersten Baustellenordner an. Darin kannst du beliebig viele Prüfungen speichern."}</p>${query ? "" : '<button onclick="openSiteDialog()">+ Erste Baustelle anlegen</button>'}</div>`;
    return;
  }
  grid.innerHTML = filtered
    .map((site) => {
      const files = protocols.filter((p) => p.siteId === site.id),
        open = files.filter((p) => p.status !== "completed").length;
      return `<article class="siteCard"><button class="siteCardMain" onclick="openSite('${site.id}')"><div class="folderIcon">▰</div><h3>${esc(site.name)}</h3><p>${esc(site.customer || site.address || "Keine Zusatzangaben")}</p><div class="cardMeta"><span>${files.length} Prüfung${files.length === 1 ? "" : "en"}${open ? ` · ${open} offen` : ""}</span><span>${formatDate(site.updatedAt)}</span></div></button><div class="protocolActions"><button class="secondary" onclick="editSite('${site.id}')">Bearbeiten</button><button class="secondary" onclick="deleteSite('${site.id}')">Löschen</button></div></article>`;
    })
    .join("");
}

function showSiteOverview() {
  currentSiteId = "";
  document.getElementById("siteDetail").classList.add("hidden");
  document.getElementById("siteOverview").classList.remove("hidden");
  renderSites();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function openSite(siteId) {
  const site = await dbGet("sites", siteId);
  if (!site) {
    showToast("Baustelle nicht gefunden.", true);
    return;
  }
  currentSiteId = siteId;
  document.getElementById("libraryMain").classList.remove("hidden");
  document.getElementById("appMain").classList.add("hidden");
  document.getElementById("siteOverview").classList.add("hidden");
  document.getElementById("siteDetail").classList.remove("hidden");
  document.getElementById("siteDetailName").textContent = site.name;
  document.getElementById("siteDetailMeta").textContent =
    [site.orderNo && `Auftrag ${site.orderNo}`, site.customer, site.address]
      .filter(Boolean)
      .join(" · ") || "Keine Zusatzangaben";
  await renderProtocols(siteId);
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function renderProtocols(siteId) {
  const protocols = (await dbAll("protocols"))
    .filter((p) => p.siteId === siteId)
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  const grid = document.getElementById("protocolGrid");
  if (!protocols.length) {
    grid.innerHTML =
      '<div class="emptyState"><div class="emptyIcon">▤</div><h3>Noch keine Prüfung</h3><p>Erstelle die erste Prüfung. Sie wird danach automatisch als Entwurf gespeichert.</p><button onclick="openProtocolDialog()">+ Erste Prüfung beginnen</button></div>';
    return;
  }
  grid.innerHTML = protocols
    .map((p) => {
      const f = (p.data && p.data.fields) || {};
      return `<article class="protocolCard"><button class="protocolCardMain" onclick="openProtocol('${p.id}')"><div class="protocolTop"><div class="documentIcon">▤</div><span class="statusBadge ${p.status === "completed" ? "completed" : "draft"}">${p.status === "completed" ? "Abgeschlossen" : "Entwurf"}</span></div><h3>${esc(p.title || "Unbenannte Prüfung")}</h3><p>${esc([f.datum && formatDate(f.datum), f.pruefer].filter(Boolean).join(" · ") || "Noch keine Prüfungsangaben")}</p><div class="cardMeta"><span>${((p.data && p.data.uvs) || []).length} UV</span><span>Geändert ${formatDate(p.updatedAt, true)}</span></div></button><div class="protocolActions"><button onclick="openProtocol('${p.id}')">${p.status === "completed" ? "Ansehen" : "Fortsetzen"}</button><button class="secondary" onclick="duplicateProtocol('${p.id}')">Duplizieren</button><button class="secondary" onclick="deleteProtocol('${p.id}')">Löschen</button></div>${p.status === "completed" ? `<div class="protocolOutputActions"><button onclick="openProtocolOutput('${p.id}','pdf')">PDF erstellen / teilen</button><button class="secondary" onclick="openProtocolOutput('${p.id}','print')">Drucken</button></div>` : ""}</article>`;
    })
    .join("");
}

async function openProtocolOutput(protocolId, action) {
  const protocol = await dbGet("protocols", protocolId);
  if (!protocol || protocol.status !== "completed") {
    showToast("Die Prüfung muss zuerst abgeschlossen werden.", true);
    return;
  }
  await openProtocol(protocolId);
  if (action === "pdf") await createPdf();
  else if (action === "print") printProtocol();
}

function openSiteDialog() {
  document.getElementById("siteDialogTitle").textContent = "Baustelle anlegen";
  document.getElementById("siteForm").reset();
  document.getElementById("siteEditId").value = "";
  showDialog(document.getElementById("siteDialog"));
  setTimeout(() => document.getElementById("siteName").focus(), 50);
}
async function editSite(siteId) {
  const site = await dbGet("sites", siteId);
  if (!site) return;
  document.getElementById("siteDialogTitle").textContent =
    "Baustelle bearbeiten";
  document.getElementById("siteEditId").value = site.id;
  document.getElementById("siteName").value = site.name || "";
  document.getElementById("siteOrder").value = site.orderNo || "";
  document.getElementById("siteCustomer").value = site.customer || "";
  document.getElementById("siteAddress").value = site.address || "";
  document.getElementById("siteNote").value = site.note || "";
  showDialog(document.getElementById("siteDialog"));
}
function editCurrentSite() {
  if (currentSiteId) editSite(currentSiteId);
}
function closeSiteDialog() {
  closeDialog(document.getElementById("siteDialog"));
}
async function saveSiteForm(event) {
  event.preventDefault();
  const id = document.getElementById("siteEditId").value,
    existing = id ? await dbGet("sites", id) : null,
    time = nowIso();
  const site = {
    id: id || makeId("site"),
    name: document.getElementById("siteName").value.trim(),
    orderNo: document.getElementById("siteOrder").value.trim(),
    customer: document.getElementById("siteCustomer").value.trim(),
    address: document.getElementById("siteAddress").value.trim(),
    note: document.getElementById("siteNote").value.trim(),
    createdAt: (existing && existing.createdAt) || time,
    updatedAt: time,
  };
  if (!site.name) return;
  await dbPut("sites", site);
  closeSiteDialog();
  showToast(existing ? "Baustelle aktualisiert" : "Baustelle angelegt");
  if (currentSiteId === site.id) await openSite(site.id);
  else await renderSites();
}
async function deleteSite(siteId) {
  const site = await dbGet("sites", siteId);
  if (!site) return;
  const protocols = (await dbAll("protocols")).filter(
    (p) => p.siteId === siteId,
  );
  if (
    !confirm(
      `Baustelle „${site.name}“ und ${protocols.length} zugehörige Prüfung${protocols.length === 1 ? "" : "en"} dauerhaft löschen?`,
    )
  )
    return;
  for (const p of protocols) await dbDelete("protocols", p.id);
  await dbDelete("sites", siteId);
  showToast("Baustelle gelöscht");
  if (currentSiteId === siteId) showSiteOverview();
  else renderSites();
}

async function openProtocolDialog() {
  if (!currentSiteId) return;
  document.getElementById("protocolForm").reset();
  document.getElementById("newProtocolDate").value = new Date()
    .toISOString()
    .slice(0, 10);
  const preset = await dbGet("settings", "company"),
    d = (preset && preset.data) || {},
    device = [d.gHersteller, d.gTyp, d.gSerie].filter(Boolean).join(" · "),
    hint = document.getElementById("protocolDeviceHint");
  hint.classList.toggle("warning", !device);
  hint.innerHTML = device
    ? `<b>Prüfgerät:</b> ${esc(device)} wird automatisch übernommen.`
    : "<b>Noch kein Prüfgerät voreingestellt.</b> Bitte zuerst unter „Voreinstellungen“ eintragen.";
  showDialog(document.getElementById("protocolDialog"));
  setTimeout(() => document.getElementById("newProtocolTitle").focus(), 50);
}
function closeProtocolDialog() {
  closeDialog(document.getElementById("protocolDialog"));
}
async function saveProtocolForm(event) {
  event.preventDefault();
  const site = await dbGet("sites", currentSiteId);
  if (!site) return;
  const company = await dbGet("settings", "company"),
    time = nowIso(),
    type = document.getElementById("newProtocolType").value;
  const data = makeBlankData({
    ...((company && company.data) || {}),
    kunde: site.customer || "",
    objekt: site.name || "",
    adresse: site.address || "",
    datum: document.getElementById("newProtocolDate").value,
    startTime: new Date().toTimeString().slice(0, 5),
    orderNo: site.orderNo || "",
    erst: type === "erst",
    wieder: type === "wieder",
    aenderung: type === "aenderung",
    erweiterung: type === "erweiterung",
    instandsetzung: type === "instandsetzung",
  });
  const typeLabels = {
      erst: "Neuanlage",
      wieder: "Wiederholungsprüfung",
      aenderung: "Änderung",
      erweiterung: "Erweiterung",
      instandsetzung: "Instandsetzung",
    },
    subject = document.getElementById("newProtocolTitle").value.trim(),
    typeLabel = typeLabels[type] || "Prüfung";
  const protocol = {
    id: makeId("protocol"),
    siteId: site.id,
    title: `${typeLabel} · ${subject}`,
    status: "draft",
    createdAt: time,
    updatedAt: time,
    data,
  };
  await dbPut("protocols", protocol);
  site.updatedAt = time;
  await dbPut("sites", site);
  closeProtocolDialog();
  await openProtocol(protocol.id);
}
async function openProtocol(protocolId) {
  if (currentProtocolId && currentProtocolId !== protocolId)
    await persistCurrentProtocol(false);
  const protocol = await dbGet("protocols", protocolId);
  if (!protocol) {
    showToast("Prüfung nicht gefunden.", true);
    return;
  }
  const site = await dbGet("sites", protocol.siteId);
  if (!site) return;
  currentSiteId = site.id;
  currentProtocolId = protocol.id;
  currentProtocolRecord = protocol;
  document.getElementById("libraryMain").classList.add("hidden");
  document.getElementById("appMain").classList.remove("hidden");
  document.getElementById("editorSiteName").textContent = site.name;
  document.getElementById("protocolTitle").value = protocol.title || "";
  document.getElementById("protocolStatus").value = protocol.status || "draft";
  const protocolData = protocol.data || makeBlankData(),
    preset = await dbGet("settings", "company");
  protocolData.fields = protocolData.fields || {};
  [...deviceFields, "masterName"].forEach((id) => {
    if (!protocolData.fields[id] && preset && preset.data)
      protocolData.fields[id] = preset.data[id] || "";
  });
  loadData(protocolData);
  setSaveState("saved", "Gespeichert");
  setEditorLocked(protocol.status === "completed");
  window.scrollTo({ top: 0, behavior: "smooth" });
}
async function closeEditor() {
  const siteId = currentSiteId;
  await persistCurrentProtocol(false);
  currentProtocolId = "";
  currentProtocolRecord = null;
  currentPhotos = [];
  document.getElementById("appMain").classList.add("hidden");
  document.getElementById("libraryMain").classList.remove("hidden");
  await openSite(siteId);
}
async function persistCurrentProtocol(manual = false) {
  clearTimeout(saveTimer);
  if (suppressAutosave || !database || !currentProtocolId) return;
  try {
    setSaveState("saving", "Speichert …");
    const existing = await dbGet("protocols", currentProtocolId);
    if (!existing) return;
    const title =
        document.getElementById("protocolTitle").value.trim() ||
        "Unbenannte Prüfung",
      time = nowIso(),
      data = collect();
    const record = {
      ...existing,
      title,
      status: document.getElementById("protocolStatus").value || "draft",
      updatedAt: time,
      data,
    };
    await dbPut("protocols", record);
    currentProtocolRecord = record;
    const site = await dbGet("sites", record.siteId);
    if (site) {
      site.updatedAt = time;
      await dbPut("sites", site);
    }
    setSaveState("saved", "Gespeichert");
    if (manual) showToast("Prüfung lokal gespeichert");
    updateStoragePill();
  } catch (error) {
    console.error(error);
    setSaveState("error", "Fehler");
    showToast("Speichern fehlgeschlagen.", true);
  }
}
async function duplicateProtocol(protocolId) {
  const source = await dbGet("protocols", protocolId);
  if (!source) return;
  const time = nowIso(),
    copy =
      typeof structuredClone === "function"
        ? structuredClone(source)
        : JSON.parse(JSON.stringify(source));
  copy.id = makeId("protocol");
  copy.title = `${source.title || "Prüfung"} – Kopie`;
  copy.status = "draft";
  copy.createdAt = time;
  copy.updatedAt = time;
  await dbPut("protocols", copy);
  showToast("Prüfung dupliziert");
  renderProtocols(source.siteId);
}
async function deleteProtocol(protocolId) {
  const protocol = await dbGet("protocols", protocolId);
  if (!protocol || !confirm(`Prüfung „${protocol.title}“ dauerhaft löschen?`))
    return;
  await dbDelete("protocols", protocolId);
  showToast("Prüfung gelöscht");
  renderProtocols(protocol.siteId);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
async function resizePhoto(file) {
  const source = await readFileAsDataUrl(file),
    img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = source;
  });
  const max = 1600,
    scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)),
    w = Math.max(1, Math.round(img.naturalWidth * scale)),
    h = Math.max(1, Math.round(img.naturalHeight * scale)),
    photoCanvas = document.createElement("canvas");
  photoCanvas.width = w;
  photoCanvas.height = h;
  photoCanvas.getContext("2d").drawImage(img, 0, 0, w, h);
  return {
    id: makeId("photo"),
    name: file.name || "Foto",
    type: "image/jpeg",
    dataUrl: photoCanvas.toDataURL("image/jpeg", 0.82),
  };
}
async function handlePhotoFiles(files) {
  if (!files.length) return;
  setSaveState("saving", "Fotos …");
  try {
    for (const file of files) {
      if (file.type.startsWith("image/"))
        currentPhotos.push(await resizePhoto(file));
    }
    renderPhotos();
    saveData(true);
    document.getElementById("fotos").value = "";
  } catch (error) {
    console.error(error);
    showToast("Ein Foto konnte nicht gespeichert werden.", true);
  }
}
function renderPhotos() {
  const preview = document.getElementById("preview");
  preview.innerHTML = "";
  currentPhotos.forEach((photo, index) => {
    const item = document.createElement("div");
    item.className = "photoItem";
    const img = document.createElement("img");
    img.src = photo.dataUrl;
    img.alt = photo.name || `Foto ${index + 1}`;
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "×";
    button.title = "Foto entfernen";
    button.addEventListener("click", () => removePhoto(index));
    item.append(img, button);
    preview.appendChild(item);
  });
}
function removePhoto(index) {
  currentPhotos.splice(index, 1);
  renderPhotos();
  saveData();
}

async function exportBackup() {
  const [sites, protocols, settings] = await Promise.all([
    dbAll("sites"),
    dbAll("protocols"),
    dbAll("settings"),
  ]);
  const backup = {
    format: "schaefchen-vde-backup",
    version: APP_VERSION,
    exportedAt: nowIso(),
    sites,
    protocols,
    settings,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = `schaefchen-sicherung-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  await dbPut("settings", { key: "last-backup", at: nowIso() });
  await updateBackupReminder(protocols);
  showToast("Sicherungsdatei heruntergeladen");
}
async function importBackupFile(event) {
  const file = event.target.files && event.target.files[0];
  event.target.value = "";
  if (!file) return;
  try {
    const backup = JSON.parse(await file.text());
    if (
      backup.format !== "schaefchen-vde-backup" ||
      !Array.isArray(backup.sites) ||
      !Array.isArray(backup.protocols)
    )
      throw new Error("Ungültiges Sicherungsformat");
    if (
      !confirm(
        `${backup.sites.length} Baustellen und ${backup.protocols.length} Prüfungen aus dieser Sicherung zusätzlich importieren?`,
      )
    )
      return;
    const siteMap = new Map(),
      time = nowIso();
    for (const source of backup.sites) {
      const copy = {
        ...source,
        id: makeId("site"),
        name: `${source.name || "Importierte Baustelle"} (Import)`,
        createdAt: source.createdAt || time,
        updatedAt: time,
      };
      siteMap.set(source.id, copy.id);
      await dbPut("sites", copy);
    }
    for (const source of backup.protocols) {
      const mapped = siteMap.get(source.siteId);
      if (!mapped) continue;
      const copy =
        typeof structuredClone === "function"
          ? structuredClone(source)
          : JSON.parse(JSON.stringify(source));
      copy.id = makeId("protocol");
      copy.siteId = mapped;
      copy.updatedAt = time;
      await dbPut("protocols", copy);
    }
    const company = await dbGet("settings", "company"),
      backupCompany = (backup.settings || []).find((s) => s.key === "company");
    if (!company && backupCompany) await dbPut("settings", backupCompany);
    await renderSites();
    showToast("Sicherung importiert");
    updateStoragePill();
  } catch (error) {
    console.error(error);
    showToast("Diese Datei ist keine gültige Schäfchen-Sicherung.", true);
  }
}

initApp();
