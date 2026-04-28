## Docmosis API Key aktualisieren & URL prüfen

### 1. API Key ersetzen
Der Docmosis API Key (`DOCMOSIS_API_KEY`) wird über das Lovable Secret-Management aktualisiert. Da Secrets aus Sicherheitsgründen niemals direkt im Chat oder Code gesetzt werden, wird ein Secret-Update-Dialog ausgelöst, in dem du den neuen Wert bestätigst:

```
ODAyNWE0ZjgtM2ViMC00NzZhLWJlZWQtYjE4Mjk1M2JmODg5OjEyMjkxOTMyODc
```

Nach Bestätigung steht der neue Key automatisch allen Edge Functions via `Deno.env.get('DOCMOSIS_API_KEY')` zur Verfügung — keine Code-Änderung nötig.

### 2. URL prüfen
Die aktuell in allen 7 Edge Functions hartkodierte URL ist bereits:
```
https://eu1.dws4.docmosis.com/api/render
```

Das entspricht deiner gewünschten Basis-URL `https://eu1.dws4.docmosis.com/api/` (mit Endpoint `render`). **Keine Änderung erforderlich.**

Betroffene Funktionen (verifiziert, alle nutzen dieselbe URL):
- `generate-rechnung-pdf`
- `generate-rechnung-docx`
- `generate-kaufvertrag-pdf`
- `generate-kaufvertrag-docx`
- `generate-treuhandvertrag-pdf`
- `generate-treuhandvertrag-docx`
- `generate-insolvenzpanel-documents`

### Ablauf nach Approval
1. Secret-Update-Dialog für `DOCMOSIS_API_KEY` öffnen
2. Du bestätigst den neuen Wert
3. Funktionen verwenden ab sofort den neuen Key — kein Redeploy nötig

### Optional (nicht Teil dieses Plans, aber als Hinweis)
Falls du später die URL über ein Secret konfigurierbar machen willst (z. B. Region-Wechsel ohne Code), kann das in einem separaten Schritt zentralisiert werden.
