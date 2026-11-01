# Înregistrare și conectare Google

Paginile `/auth/signup` și `/auth/login` folosesc același antet ca pagina principală. Ambele oferă Google și email; emailul păstrează verificarea prin cod.

Google revine în aplicație prin `/auth/sso-callback`. Componenta de autentificare gestionează asocierea conturilor existente și cerințele suplimentare, apoi continuă spre `/auth/complete-profile`. Cerințele suplimentare ale furnizorului pot fi completate și prin paginile `/sign-in` sau `/sign-up`.

Completarea profilului este verificată exclusiv din datele validate în MongoDB. Metadatele editabile din browser nu acordă permisiuni și nu pot ocoli acest pas. Salvarea cere un email principal verificat; rolurile existente rămân neschimbate. Vezi și [pregătirea de securitate](security-readiness.md).

## Configurare pentru producție

1. În instanța Clerk de producție, activează conexiunea Google pentru înregistrare și conectare.
2. Configurează aplicația OAuth Google pentru domeniile publice folosite și introdu în Google URI-ul de redirecționare furnizat de Clerk. Acesta este diferit de ruta internă `/auth/sso-callback`.
3. Introdu credențialele OAuth în Clerk și verifică starea de publicare a aplicației Google.
4. Testează un cont nou, un cont existent cu aceeași adresă verificată, anularea conectării, categoria de participant și păstrarea biletelor pe identitatea existentă. O adresă diferită poate duce la un cont separat.

Documentație: [conexiunea Google](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google) și [asocierea conturilor](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/account-linking).

## Verificare locală

`npm run test:registration` verifică validarea și limitele endpointului folosind servicii simulate. Aceste teste nu înlocuiesc verificarea integrală OAuth într-o instanță de test. `npm run typecheck` și `npm run lint` verifică sursele. Buildul complet are nevoie de variabilele pentru serviciile configurate, inclusiv Stripe.
