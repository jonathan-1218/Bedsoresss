# Bedsores Dashboard Ready

## Run
### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:5000

## Demo Login
- Email: caretaker@example.com
- Password: 123456

## Notes
- For email OTP, edit `backend/server.js` and replace:
  - `YOUR_EMAIL@gmail.com`
  - `YOUR_GMAIL_APP_PASSWORD`
- If you don't configure Gmail SMTP, OTP won't send.

## ESP32 API endpoint
POST JSON to:
`http://YOUR_PC_IP:5000/api/esp32-data`

## Train Position Model
From the project root:

```bash
"/Users/jonathanjeshua/Projects/bedsores final/.venv/bin/python" train_model.py
```

This reads `data.csv`, trains a position classifier, and writes `position_model.pkl`.

## Predict Position From Sensor Readings

```bash
"/Users/jonathanjeshua/Projects/bedsores final/.venv/bin/python" predict_position.py --sensors "S:2100,200,1900,2400,0,0"
```

You can also use JSON input:

```bash
"/Users/jonathanjeshua/Projects/bedsores final/.venv/bin/python" predict_position.py --json '{"S1":2100,"S2":200,"S3":1900,"S4":2400,"S5":0,"S6":0}'
```

## Backend ML Position Prediction

The backend now uses the trained model for incoming ESP32 sensor updates on `/api/esp32-data` and `/sensors`.
If ML files are missing or prediction fails, it automatically falls back to rule-based detection.

Optional environment overrides:
- `PYTHON_BIN` (default: `../.venv/bin/python` relative to `backend/`)
- `POSITION_PREDICT_SCRIPT` (default: `../predict_position.py`)
- `POSITION_MODEL_PATH` (default: `../position_model.pkl`)
