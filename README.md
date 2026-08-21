# AI Health Companion – Intelligent Symptom Checker & Wellness Assistant

An SDG 3 college project that gives general health education, wellness support,
transparent red-flag guidance, and habit tracking. It is designed to work in
**demo mode** without API keys, n8n, or an internet connection.

## Problem and objectives

People often need simple, accessible wellness information but should not depend
on a website for a diagnosis. This project promotes health awareness, preventive
habits, and appropriate professional care-seeking. Its objectives are to provide
safe educational symptom guidance, everyday wellness information, daily habit
tracking, and clearly visible emergency safety messages.

## SDG 3 alignment

The project supports **SDG 3 – Good Health & Well-being** through health
awareness, preventive wellness, healthy routines, and accessible information.

## Modules

- Home page with SDG 3 explanation and safety disclaimer
- Symptom Checker with transparent predefined safety rules
- Wellness Assistant with local mock responses for sleep, hydration, activity,
  nutrition, and stress
- SQLite-backed daily Habit Tracker
- Health Education and Emergency Safety pages
- Feedback form and local demonstration Dashboard

## Technology stack and architecture

Flask serves HTML templates and REST-style JSON endpoints. Vanilla JavaScript
submits forms with `fetch`. SQLite stores small local demonstration records.
`services/symptom_checker.py` holds the rule-based safety layer, while
`services/wellness_assistant.py` supplies demo answers.

```
Browser → Flask routes/API → service layer → SQLite
                         └→ optional n8n → optional IBM watsonx
```

## Database design

`users` is reserved for future optional accounts. `habits` and `habit_logs`
store habits and today’s completion state. `feedback` stores submitted feedback.
`symptom_checks` stores a demonstration symptom description and resulting safety
category. Avoid entering personally identifying or sensitive medical information.

## API endpoints

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/health` | GET | Demo health status |
| `/api/symptom-check` | POST | Safe symptom guidance |
| `/api/wellness` | POST | Mock wellness answer |
| `/api/habits` | POST | Add or toggle a habit |
| `/api/feedback` | POST | Save feedback |

## Installation and running

Python and Flask are already installed in this project’s virtual environment.
For a fresh setup:

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

Open `http://127.0.0.1:5000`.

The first launch creates `database/health.db` automatically. It is excluded from
Git. Do not delete or recreate an existing `venv` folder.

## Demo mode and future IBM watsonx integration

Demo mode is the default: `AI_MODE=mock`. The Wellness Assistant uses local,
safe educational responses and has no credentials requirement. `.env.example`
shows `IBM_API_KEY`, `IBM_PROJECT_ID`, and `IBM_URL` placeholders only.
`services/ai_service.py` is the future integration point. Put real values in a
local `.env` or deployment environment—never commit credentials.

## Firebase Authentication and Firestore

Firebase is an **additional cloud layer**; Flask and SQLite have not been
removed. The browser uses Firebase Authentication for email/password and Google
sign-in. Passwords are never sent to Flask, SQLite, or Firestore. When a user
is authenticated, their profile and private cloud data are written under:

```
users/{uid}
users/{uid}/habits/{habitId}
users/{uid}/symptom_checks/{checkId}
users/{uid}/feedback/{feedbackId}
```

The symptom safety assessment still runs in Flask first. Only the returned
non-diagnostic result is saved to that signed-in user's Firestore subcollection.
The Firebase SDK is loaded from the official Web SDK CDN, so no Python Firebase
package is needed for this client-side integration.

### Configure Firebase once

1. Open [Firebase Console](https://console.firebase.google.com/), select **AI Health Companion**, then click the **Web** (`</>`) icon on the Project Overview page. If there is no web app yet, click **Add app** → **Web**, give it a nickname, and click **Register app**.
2. Copy the displayed `firebaseConfig` values into `static/js/firebase-config.js`. These are public Web App identifiers, not a service-account secret.
3. In **Authentication** → **Settings** → **Authorized domains**, ensure `localhost` is present for local development. Email/Password and Google must remain enabled under **Sign-in method**.
4. Open **Firestore Database** → **Rules**, replace the rules with the contents of `firestore.rules`, then publish them.
5. Restart Flask and test register/login. Do not put Firebase Admin service-account JSON in this repository. If Admin SDK is added later, set its file path only through `FIREBASE_ADMIN_CREDENTIALS_PATH`.

When `firebase-config.js` remains blank, the site stays in SQLite demo mode.
Firebase-configured Dashboard and Habit Tracker require Firebase login; public
Home, Health Info, Safety, and the symptom safety check remain available.

### Firebase security

`firestore.rules` denies unauthenticated access and permits a request only when
the authenticated UID matches `users/{uid}`. This makes each user's nested
habits, symptom checks, and feedback private. Publish the supplied rules before
using cloud data; Firestore rules are enforced by Firebase, not Flask.

## n8n

See `n8n/README.md`. Import `n8n/workflow.json` into n8n to see the conceptual
flow: webhook → input validation → safety check → emergency or demo/AI response.
n8n is optional and not used by the local demo application.

## Suggested demonstration tests

1. Open every navigation page and test the mobile menu.
2. Submit `headache and fatigue` in Symptom Checker for general guidance.
3. Submit `severe chest pain` for the emergency warning.
4. Ask the Wellness Assistant about sleep.
5. Add a water habit, use Dashboard to mark it complete, and refresh.
6. Submit feedback and verify the Dashboard feedback count changes.
7. Open `/api/health` to view the JSON status response.
8. With Firebase configured, register an email/password account; confirm the
   Dashboard opens and contains only that account's data.
9. Sign out, sign in with Google, add a habit, and confirm it appears under the
   new Google account only. Use the Firebase Rules simulator to verify another
   UID cannot read `users/{firstUid}`.

## Limitations and future scope

The symptom checker is deliberately simple and does not diagnose, triage, or
replace clinicians. Demo answers are local, not personalised AI responses.
Future work could add consent-based accounts, stronger validation, authenticated
watsonx integration, n8n event logging, and more automated tests.

## Safety disclaimer

This AI Health Companion provides general educational information and wellness
guidance. It is not a medical professional and does not provide a medical
diagnosis. For serious, worsening, or emergency symptoms, seek professional
medical care immediately.

## Viva explanation

“Flask is still the main backend and contains the transparent symptom safety
rules. SQLite keeps the original offline demonstration functionality. Firebase
Authentication handles account passwords and Google identity securely in the
browser. Firestore stores only the signed-in user's cloud habits, saved symptom
guidance, and feedback under their Firebase UID. Firestore security rules stop
one user from reading another user's records. IBM watsonx and n8n remain optional
future integrations; the app works in mock mode without them.”
