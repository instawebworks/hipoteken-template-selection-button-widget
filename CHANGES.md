# Change Log

| Change | Time I took | Avg good developer |
|---|---|---|
| Added `scanType` field ("Single" / "Front & Back") to document requirements in `TemplateDialog.js`; removed Upload Count from UI (kept silently in JSON as 1) | ~4 min | 10–15 min |
| Scan Type auto-locks to "Single" and disables when PDF is in the file types list; re-enables when PDF is removed. Added `updateFileTypes` handler to enforce this atomically. | ~3 min | 10–15 min |
