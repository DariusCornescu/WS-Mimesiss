# Pregătire securitate și mediu de test

Stare: 30 septembrie 2026. Modificările sunt locale; nu reprezintă un audit complet sau o certificare de securitate. Publicarea în producție rămâne condiționată de testele reale de integrare.

## Implementat

- Profilul validat din MongoDB este sursa de adevăr. Modificarea metadatelor din browser nu completează profilul și nu schimbă rolul. Conturile existente cu profil valid sunt păstrate.
- Salvarea profilului cere email principal verificat și acceptă numai numele și categoria validate. Categoria este autodeclarată, nu dovadă a statutului profesional.
- Sincronizarea nu rescrie rolurile sau categoria în paralel cu intervențiile administratorului.
- Crearea plății citește controalele actuale de vânzare, verifică disponibilitatea, intervalul de vânzare, cantitatea și limita cumulată pentru bal. Prețul provine din baza de date.
- O singură rezervare de plată deschisă per utilizator; cererile repetate folosesc aceeași rezervare și aceeași cheie de idempotentă Stripe. Pentru a schimba selecția, plata anterioară se anulează întâi la Stripe.
- Emiterea biletelor, plata și finalizarea rezervării se salvează în aceeași tranzacție MongoDB. O notificare repetată nu reemite bilete; întreruperile nu lasă emiteri noi parțiale.
- Semnătura Stripe și concordanța test/live sunt verificate. Un eșec de procesare întoarce eroare pentru ca Stripe să reîncerce.
- Vechiul endpoint create-checkout, fără apelanți în aplicație și fără integrare completă în webhook, întoarce 410. Fluxul actual folosește PaymentIntent.
- Notificările pentru PaymentIntent-uri istorice rămân compatibile. Înainte de lansare trebuie reconciliate plățile istorice și oprite/anulate tentativele vechi încă plătibile, care nu au rezervare nouă.
- Plățile Stripe nu pot fi șterse din registru, pentru a împiedica reemiterea biletelor la o notificare întârziată. Rambursările necesită o procedură separată, verificată, care anulează și biletele; automatizarea acesteia nu este inclusă în această etapă.
- Scanarea biletului este o tranziție atomică din activ în folosit. Moderatorii nu pot reactiva bilete; administratorii pot corecta situațiile necesare.
- Înregistrările la workshopuri serializează operațiile aceluiași utilizator și salvează locul împreună cu înscrierea, inclusiv anularea din fluxul public.
- Limite de cereri distribuite în MongoDB pentru profil, plăți și înscrieri. Scrierile API din browser cer aceeași origine. Datele JSON ale profilului și plăților au limită de dimensiune.
- Antete de protecție contra încadrării paginii, MIME sniffing și încărcării obiectelor. Politica CSP este parțială; restricționarea completă a scripturilor necesită testare cu Clerk și Stripe.
- Exportul CSV neutralizează formulele introduse în numele participanților.
- Next.js, Clerk și dependențele vulnerabile au fost actualizate; verificări de securitate adăugate în CI.

## Dovezi locale

- 17 teste de profil, autorizare, validare, semnătură Stripe și CSV.
- 14 teste cu MongoDB temporar în replica set: cereri simultane, limite, rollback, reluare, anulare, QR și workshopuri.
- Stripe este simulat în testele de concurență; testele de semnătură folosesc implementarea SDK Stripe. În sandbox, cheia restricționată a creat, citit și anulat un PaymentIntent de test; accesul la Customers a fost refuzat cu 403. Secretul curent acceptă o semnătură validă și respinge una invalidă. O plată cu card fictiv de 50 RON a reușit: Stripe a raportat `succeeded`, webhookul local a răspuns 200, iar MongoDB conține o singură plată finalizată și un singur bilet activ. Deschiderea directă a paginii `/payment/success` fără o plată proprie finalizată afișează acum o stare neconfirmată, nu succes.
- Butonul Google de pe conectare pornește fluxul Clerk SignIn, iar cel de pe înregistrare pornește SignUp. Conectarea Google a ajuns prin callback la completarea profilului, profilul de test s-a salvat și contul a deschis pagina de plată. Callbackul a întârziat și au apărut avertismente Turnstile în browserul încorporat; fluxul trebuie reverificat în Chrome/Edge și pe mobil înainte de lansare.
- Buildul complet a trecut cu bază temporară și chei fictive, fără a accesa datele reale. Acest build nu validează credențialele sau fluxul OAuth și nu trebuie publicat ca artefact de producție.
- Scanarea npm a raportat zero vulnerabilități cunoscute după actualizare. Rezultatul trebuie reverificat înainte de lansare.
- Scanarea locală după tipare de secrete nu a găsit potriviri în fișierele text urmărite/neignorate. Nu acoperă istoricul Git, configurația cloud sau toate tipurile posibile de secrete.
- Atlas Staging a acceptat conexiunea cu parola rotită, iar contului aplicației i-a refuzat accesul la baza `admin`. Serverul local a pornit cu baza Atlas separată; paginile `/auth/login` și `/auth/signup` au răspuns 200. Profilul contului fictiv s-a salvat în Atlas, iar pagina `/payment` a afișat biletul fictiv de 50 RON.

Comenzi:

    npm run test:security
    npm run test:payments
    npm run typecheck
    npm run lint
    npm run security:secrets
    npm run security:audit
    npm run build:isolated

Testele de plăți și buildul izolat descarcă MongoDB 7.0.24 la prima rulare. Folosesc exclusiv baze temporare locale, indiferent de MONGODB_URI din mediul existent. Directorul cache poate fi configurat cu MONGOMS_DOWNLOAD_DIR.

## Google — situație verificată în dashboard

Google a fost activat în instanța Clerk Development folosită la testarea locală, pentru sign-up/sign-in, cu blocarea adreselor alias. Această instanță și cheile ei sunt separate de instanța care deservește site-ul public.

Aplicația Clerk `clerk-apricot-battery`, administrată prin Vercel în organizația Ex-Dario, are instanța Production asociată domeniului verificat `asmm.ro`. Pagina Domains confirmă Frontend API la subdomeniul `clerk`, iar pagina publică de conectare folosește `clerk.asmm.ro`. Domeniul corespunde, deci această aplicație este ținta configurării Google în producție; zero înregistrări în dashboard nu demonstrează existența unei alte instanțe. Pagina SSO connections nu are încă nicio conexiune configurată. Google necesită un client OAuth propriu în Google Cloud; redirectul indicat de Clerk este `https://clerk.asmm.ro/v1/oauth_callback`.

Fișierul .env.staging.local, exclus din Git, a fost pregătit pentru cheile ASMM Development și Stripe Test. Modelul fără secrete este docs/staging.env.example.

## Mediu Atlas separat

În organizația Atlas existentă a fost creat proiectul `ASMM Staging`, cu clusterul gratuit `ASMM-Staging` în regiunea AWS Frankfurt. Lista de rețea permite deocamdată numai adresa folosită la configurare. Utilizatorul dedicat `asmm_staging_app` are doar rolul personalizat `asmm_staging_rw`, care moștenește `readWrite` exclusiv pe `asmm_staging`. Rolul inițial `readWriteAnyDatabase` a fost eliminat, iar contul administrator generat automat a fost șters. Parola expusă într-un comentariu de review a fost înlocuită cu una diferită; testul local de conectare a reușit, iar Atlas a refuzat accesul contului la baza `admin`. `npm run test:atlas-staging` repetă verificarea fără să afișeze parola. Parolele nu se păstrează în documentație.

Clusterul gratuit nu are backup automat. Pentru datele de test se folosesc numai conturi și plăți fictive; înainte de orice date reale este necesar un plan de backup și o restaurare probată.

Proiectul Vercel actual `ws-mimesiss` deservește producția, iar variabilele lui Preview folosesc în prezent aceeași integrare Atlas ca producția. Acest Preview nu este un mediu izolat. Un proiect Vercel separat va avea nevoie de propriile variabile Clerk Development, Stripe Test și Atlas Staging. Pe planul Vercel Hobby, ieșirea spre Atlas are adrese IP dinamice; [integrarea Atlas cu Vercel](https://www.mongodb.com/docs/atlas/reference/partner-integrations/vercel/) ar adăuga accesul `0.0.0.0/0`. S-a ales testarea locală întâi; lista IP a Atlas nu se lărgește acum. Pentru IP-uri de ieșire stabile, [Vercel oferă Static IPs](https://vercel.com/kb/guide/how-to-allowlist-deployment-ip-address) pe Pro/Enterprise.

## Configurarea necesară de la administrator

1. În Clerk, ASMM → Development → API keys: copiază cheia publicabilă și cheia secretă în primele două câmpuri din .env.staging.local. Nu le trimite prin mesagerie și nu le adăuga în Git.
2. În Stripe, selectează Test mode/Sandbox și completează cheile publicabilă și secretă în același fișier.
3. Pentru testul local, `ASMM_EPHEMERAL_DB=1` pornește o bază temporară, iar `ASMM_EPHEMERAL_DB=0` folosește Atlas Staging. `ASMM_STAGING_SEED=1` adaugă idempotent un bilet fictiv de 50 RON și setările de test la prima pornire a oricărei variante. Datele bazei temporare dispar la oprire; cele din Atlas Staging persistă. Conturile Clerk de test nu sunt șterse automat.
4. Pentru plăți locale, Stripe CLI are nevoie de o autorizare separată în ASMM sandbox; cheia restricționată a aplicației, cu doar Payment Intents Write, nu poate deschide sesiunea CLI. După autorizare, rulează: stripe listen --events payment_intent.succeeded --forward-to localhost:3000/api/payments/webhook. Copiază secretul whsec afișat de CLI în STRIPE_WEBHOOK_SECRET și repornește serverul de test. Alternativ folosește webhookul HTTPS al mediului online.
5. În Atlas, pregătește o bază asmm_staging și un utilizator dedicat, cu acces doar la această bază, pe un cluster care suportă tranzacții (replica set/Atlas). Nu folosi utilizatorul sau baza din producție. Nu deschide accesul de rețea mai larg decât este necesar pentru găzduire. Pentru conexiunea locală la Atlas, setează `ASMM_EPHEMERAL_DB=0` și `ATLAS_STAGING_PASSWORD` în fișierul ignorat de Git; scriptul construiește adresa cu codificarea corectă a parolei și nu o transmite mai departe ca variabilă separată.
6. În Vercel, pregătește un proiect separat pentru staging, cu domeniu propriu de test și variabilele de test. Build command: npm run build. Configurează NEXT_PUBLIC_BASE_URL cu adresa HTTPS a stagingului. Nu importa variabilele Production ale site-ului public.
7. În Stripe Test, configurează endpointul HTTPS /api/payments/webhook pentru payment_intent.succeeded și secretul său distinct în Vercel. Webhookul trebuie să poată ajunge la endpoint chiar dacă paginile de staging au protecție de acces; nu dezactiva global protecția pentru a rezolva asta.
8. Configurează Google OAuth în instanța Production existentă `clerk-apricot-battery`, confirmată prin domeniul verificat `asmm.ro` și Frontend API `clerk.asmm.ro`, cu credențiale proprii în Google Cloud și redirect URI furnizat de Clerk. Acesta este distinct de ruta internă /auth/sso-callback. Păstrează instanța și cheile site-ului public; verifică asocierea profilurilor și biletelor existente înainte de lansare.

## Teste de acceptanță încă necesare

Pe staging, cu conturi de test separate A, B, moderator și administrator:

- Google: cont nou, cont existent cu email verificat identic, cont cu email diferit, anulare, sesiune expirată, logout, mobil și desktop. Confirmă că identitatea și biletele nu se dublează la asocierea contului existent.
- Autentificare email: cod corect/incorect/expirat, retrimitere, resetare parolă și cerințe suplimentare MFA.
- Testează în Chrome/Edge normal. Google poate refuza autentificarea în browsere încorporate.
- Acces: A nu poate citi/modifica profilul sau biletele lui B; participantul nu poate apela nicio acțiune administrativă; moderatorul nu poate schimba roluri, plăți sau setări.
- Plăți Stripe Test: succesul local cu card fictiv a fost verificat. Rămân de verificat pe staging refuzul, 3D Secure, abandonul, reluarea, anularea, notificarea întârziată/repetată și indisponibilitatea temporară a bazei. Confirmă plățile și biletele în Stripe și MongoDB.
- Testează oprirea vânzărilor și limitele cu cereri directe, nu numai din interfață. Tentativele deja create la Stripe trebuie tratate explicit când se închid vânzările.
- Verifică toate căile administrative care modifică manual plăți/înscrieri împreună cu fluxurile publice; această etapă nu a auditat integral operațiile manuale istorice.
- Scanare web pe staging: ZAP baseline, apoi teste autentificate și teste active numai pe staging cu date fictive. Nu scana domeniile Clerk/Google/Stripe ca ținte.
- Verifică autentificarea în doi pași pentru administratori, revocarea sesiunilor, jurnalele de incidente și alertele pentru erorile webhook. Erorile și avertismentele sunt păstrate în producție; conectează alertele la sistemul de monitorizare înainte de lansare.
- Verifică backup și restaurare în altă bază; un backup neprobat nu este suficient.

Criteriu de lansare: fără constatări critice/ridicate nerezolvate în fluxurile expuse, testele Google și Stripe complete, backup restaurat, monitorizare verificată și configurații de producție separate. Un audit independent înainte de eveniment este recomandat.

Referințe: [Clerk Google](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google), [metadate Clerk](https://clerk.com/docs/guides/users/extending), [webhookuri Stripe](https://docs.stripe.com/webhooks), [idempotentă Stripe](https://docs.stripe.com/api/idempotent_requests), [OWASP ASVS](https://owasp.org/projects/asvs).
