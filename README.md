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
