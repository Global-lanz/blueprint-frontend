# BluePrint Frontend

Angular frontend (standalone components) with basic pages and Auth.

## Setup

```powershell
cd blueprint-frontend
npm ci
npm start
```

The app is served by the Angular dev server on http://localhost:4200 and will proxy API requests to http://localhost:3333 using `proxy.conf.json`.

## Notes
- Simple login and admin templates pages are included.
- Add more pages, NgRx state management, guards and role-based UI as needed.
