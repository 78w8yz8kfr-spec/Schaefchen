# Schäfchen · VDE Prüfungen

Offline-fähige Prüfapp für DIN VDE 0100-600, DIN VDE 0105-100 und DGUV Vorschrift 3.

## Funktionen

- Baustellen als übersichtliche Ordner
- beliebig viele Prüfungen je Baustelle
- automatische lokale Entwurfsspeicherung
- Prüfungen fortsetzen, duplizieren, abschließen und als PDF drucken
- lokale Fotodokumentation und Prüferunterschrift
- vollständige JSON-Sicherung mit Import
- installierbare Progressive Web App mit Offline-Cache

## Datenspeicherung

Alle Baustellen, Prüfungen, Fotos und Unterschriften werden ausschließlich in der lokalen Browser-Datenbank des verwendeten Geräts gespeichert. Das Repository und ein Webhost erhalten keine eingegebenen Kundendaten oder Messwerte.

Wichtig: Beim Löschen der Browser- beziehungsweise Website-Daten gehen die lokalen Inhalte verloren. Deshalb regelmäßig über **Sicherung exportieren** eine Sicherungsdatei herunterladen.

## Lokal starten

Die Dateien können über einen einfachen statischen Webserver geöffnet werden, zum Beispiel:

```bash
python3 -m http.server 8000
```

Anschließend `http://localhost:8000` aufrufen. Für Installation und zuverlässige Offline-Nutzung ist HTTPS erforderlich; dafür kann die App direkt über GitHub Pages bereitgestellt werden. Render oder ein anderer App-Server wird nicht benötigt.

## Technischer Aufbau

Die App besteht ausschließlich aus HTML, CSS und JavaScript. Nutzdaten liegen in IndexedDB, die bisherige einzelne V15-Prüfung wird beim ersten Start automatisch als Baustelle übernommen. Die PDF-Ausgabe erfolgt über den Druckdialog des Browsers.

Automatische Bewertungen sind Hilfsfunktionen und ersetzen nicht die fachliche Beurteilung durch eine Elektrofachkraft.
