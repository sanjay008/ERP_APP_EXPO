# Mobile Documents — remaining backend work

Copy/paste this to the backend team.

```
Mobile Documents – remaining types

Already showing on app from get-quick-upload-types:
- ID
- Passport / Paspoort
- VOG
- Driving Licence
- Certificate
- NIWO (keep sending this; app will show it)

Please ADD these 3 types to get-quick-upload-types
(mobile_only=1 and mobile_only=0). Same endpoint, same shape.

Do NOT send SIR (use Certificate).
Do NOT send payslips / loonstrook / jaaropgave.

1. Work permit
{
  "type": "Work permit",
  "slug": "work_permit",
  "min_photos": 1,
  "expire_date_required": true,
  "allow_camera": true,
  "allow_multiple": false,
  "accept_pdf": true,
  "required": true,
  "show_on_mobile": true,
  "max_files": 1
}

2. Diploma
{
  "type": "Diploma",
  "slug": "diploma",
  "min_photos": 1,
  "expire_date_required": false,
  "allow_camera": true,
  "allow_multiple": true,
  "accept_pdf": true,
  "required": false,
  "show_on_mobile": true,
  "max_files": 24
}

3. Bank document
{
  "type": "Bank document",
  "slug": "bank_document",
  "min_photos": 1,
  "expire_date_required": false,
  "allow_camera": true,
  "allow_multiple": false,
  "accept_pdf": true,
  "required": false,
  "show_on_mobile": true,
  "max_files": 1
}

Please also keep NIWO:
{
  "type": "NIWO-vergunning",
  "slug": "niwo",
  "min_photos": 1,
  "expire_date_required": true,
  "allow_camera": true,
  "allow_multiple": false,
  "accept_pdf": true,
  "required": false,
  "show_on_mobile": true,
  "max_files": 1
}

Passport should be min_photos: 2 (front + back), expire_date_required: true.

Upload stays one API:
POST /api/documenten/quick-upload
type = exact type string
front_file required
back_file only for ID / Passport / Driving Licence
Diploma/Certificate extra photos = new rows, do not overwrite
```
