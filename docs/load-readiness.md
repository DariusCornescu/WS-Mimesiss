# Pregătirea vârfului de înscrieri MIMESISS

Țintă actualizată: până la 1.000 participanți în primele câteva minute.
Modelul de sosiri folosește 5 minute; rafalele de 500/750/1.000 operații pornite
simultan sunt scenarii distincte, mai dure, nu o capacitate garantată.
Evaluare începută la 30 septembrie 2026.

## Extinderea la 1.000 — 30 septembrie 2026

Rularea locală progresivă 500/750/1.000 a trecut verificările de integritate,
dar a depășit ținta de latență. Nicio supralocare, înscriere duplicată sau
emitere suplimentară la reluarea notificărilor; toate operațiile care aveau
locuri disponibile s-au finalizat. Acest rezultat nu validează site-ul online.

| Operații pornite simultan | Înscrieri pe 10 ateliere, p95 | Același atelier, p95 | Emitere bilete, p95 |
| --- | --- | --- | --- |
| 500 | 2,52s | 6,29s | 6,84s |
| 750 | 6,52s | 26,97s | 10,11s |
| 1.000 | 10,48s | 67,56s | 15,68s |

La 1.000 pentru ultimul loc, exact unul a fost înscris și 999 au primit «plin»;
p95 2,48s. Recuperarea finală a unei operații a fost 13ms. Scenariul cu un singur
atelier îi oferă intenționat 1.000 de locuri, pentru a forța 1.000 de scrieri
concurente reușite; nu reprezintă un atelier mic cu 20–30 de locuri.

Pe același atelier, cele 1.000 de înscrieri au generat 81.401 conflicte de scriere
și 82.401 porniri de tranzacție. Este o dovadă de contendență pe date comune în
acest test, nu o dovadă că trebuie cumpărat un anumit plan Vercel/Atlas. Un upgrade
de găzduire nu înlocuiește optimizarea sau controlul concurenței.

Dovadă: `.stress-results/local-2026-09-30T08-28-54-175Z.json`.
Această etapă a modificat numai instrumentul local de test și documentația,
nu logica aplicației, și nu a publicat versiunea din workspace.

### Sosiri distribuite în cinci minute

A doua rulare a programat câte o înscriere pentru 1.000 de utilizatori fictivi,
uniform, în 300s, pe 10 ateliere cu locuri suficiente. Toate 1.000 au reușit,
contoarele au corespuns înscrierilor, fără duplicate sau conflicte de scriere.
p50 9ms, p95 15ms, p99 18ms pentru operația locală; durata totală 299,71s,
rata 3,3 operații/s, întârzierea generatorului p95 14ms. Verificările finale
de dublu click, limită per participant, anulare și recuperare au trecut.

**Concurența observată a fost doar o operație în zbor**, fiindcă operațiile
locale au terminat înaintea următoarei sosiri la 300ms. Nu se poate prezenta
această probă ca «1.000 de utilizatori simultani» sau latență a site-ului.
Nu include loginul, navigarea, API-urile externe sau două înscrieri per persoană.
Este o limită inferioară simplificată; rafala simultană de mai sus arată că
distribuția reală a sosirilor poate schimba radical rezultatul.

Dovadă: `.stress-results/local-2026-09-30T08-33-01-662Z.json`.
Concluzie: nu alegem încă un nivel Atlas sau o promisiune de capacitate Vercel
doar din aceste rezultate locale. Ambele forme de trafic trebuie validate
end-to-end în mediul online autorizat; rafala pe date comune cere optimizare
sau control al concurenței înainte de a fi considerată pregătită pentru lansare.

Instrumentul actualizat a trecut verificarea sintactică și ESLint. Cele patru
teste ale protecțiilor HTTP au trecut; cinci configurații locale invalide
(peste plafon, zero, profil necunoscut, mai multe niveluri la sosiri și fereastră
prea lungă) au fost refuzate înainte de pornirea bazei. Testele complete ale
aplicației nu au fost reluate în această etapă; logica aplicației nu s-a schimbat.
După adăugarea profilului de sosiri, suita de rafale a fost reverificată la 25:
toate scenariile au trecut, inclusiv plăți și reluări. Dovadă:
`.stress-results/local-2026-09-30T08-38-39-992Z.json`.

Conexiunea la clusterul Atlas Staging separat a fost verificată read-only:
ping și citirea listei colecțiilor de test au reușit; accesul la baza `admin`
a fost refuzat. Nu s-a generat trafic de volum spre Atlas. Prima încercare din
mediul cu rețea restricționată a expirat; verificarea cu acces de rețea a reușit.
Acesta nu este un audit complet al tuturor drepturilor sau configurației cloud.

Etapa online rămâne neexecutată: trebuie un deployment separat, configurație
de rețea aprobată pentru Atlas și un buget acceptat. Politica explicită Vercel
pentru load testing îl rezervă Enterprise și cere discuție prealabilă pentru
testele dinaintea unui contract. Ghidul practic mai nou cere coordonare pentru
încărcare semnificativă. Până la clarificarea/aprobarea scrisă pentru planul și
scenariul nostru, nu rulăm volum pe Vercel. Cumpărarea Pro nu constituie aprobare
de test; nu este o recomandare să cumpărăm Enterprise doar pentru această probă.

## Etapa inițială: 250–400, cu marjă la 500

Verdict: integritatea a trecut după optimizare, dar ținta de latență nu este
îndeplinită în toate scenariile. **Lansarea la 400 simultan nu este încă validată.**
Nu s-au făcut deploy, upgrade, teste de volum pe domeniul public sau modificări
ale serviciilor cloud. Modificările din această etapă rămân locale, peste
modificările preexistente din workspace, care au fost păstrate.

Prima rulare a versiunii locale inițiale a găsit 70/250 emiteri care nu au
reușit în circa 120s și aproximativ 40s pentru un lot de 250 înscrieri pe același
atelier. Testul s-a oprit la eșec; nivelurile următoare nu au fost executate atunci.
O primă ajustare a reîncercărilor a fost insuficientă la 400.

Optimizările finale păstrează toate scrierile critice în tranzacții:

- Pauze aleatoare cu creștere și plafon de 1s între reluările tranzacțiilor;
  timpul nu este petrecut cu un lock de document dobândit.
- Rezervarea locului precedă verificările suplimentare per utilizator;
  duplicatele și depășirea limitei anulează tranzacția, inclusiv locul rezervat.
- Emiterea rezervă un bloc de numere înaintea celorlalte scrieri, în aceeași
  tranzacție; eșecurile, duplicatele și istoricul parțial păstrează numerotarea.
- Notificările deja finalizate au o cale de citire fără tranzacție când
  atributele plății corespund; cazul concurent este verificat din nou în tranzacție.

O rulare completă la 100/250/400/500 și două repetări suplimentare la 400 au
trecut toate verificările de integritate. Timpi p95 (95% dintre operații au
terminat până la acest timp), trei rafale la 400:

| Scenariu | p95 local, interval între rulări |
| --- | --- |
| 400 cereri pentru ultimul loc | 0,78–1,27s; exact o înscriere |
| Înscrieri pe 10 ateliere | 1,89–3,22s |
| Toate înscrierile pe un atelier cu 400 locuri | 4,87–5,50s |
| Rezervare + PaymentIntent simulat | 0,50–0,77s |
| Emiterea a câte două bilete pentru 400 plăți | 5,90–6,09s |
| Repetarea notificărilor deja procesate | 0,05–0,12s; fără bilete suplimentare |

La 500: p95 înscrieri distribuite 2,39s, același atelier 5,93s, emitere 6,53s.
Ținta provizorie locală de 5s este depășită, chiar dacă nu au existat erori.
Rulările locale nu sunt un benchmark controlat al găzduirii; folosesc același
calculator pentru generarea cererilor și MongoDB. Cea mai proastă rafală la
același atelier modelează intenționat o capacitate mai mare decât un atelier mic.

Dovezi (fișiere ignorate de Git, fără date personale sau chei):

- `.stress-results/local-2026-09-30T07-57-27-157Z.json`: eșecul inițial.
- `.stress-results/local-2026-09-30T08-09-34-283Z.json`: toate nivelurile după optimizare.
- `.stress-results/local-2026-09-30T08-11-08-301Z.json`: două repetări la 400.

Verificări suplimentare: 17 teste de securitate/profil + 17 teste MongoDB
(inclusiv rollback, numerotare, istoric parțial și refund replay) + 4 teste
pentru protecțiile țintei HTTP: toate trecute. TypeScript a trecut; ESLint fără
erori, cu 9 avertismente în fișiere neatinse de această etapă. Nu s-a refăcut
buildul complet în această etapă. Proba k6 este pregătită și verificată sintactic;
nu a fost executată cu runtime-ul k6 sau împotriva unei aplicații online.

Rămân puncte de urmărit: contorul global de bilete este încă o resursă comună,
același atelier poate produce conflicte, iar fluxul public apelează `currentUser`
și sincronizarea profilului înainte de înscriere. Costul Clerk/rețea/sincronizare
nu intră în aceste măsurători. Anulările au fost verificate la 10 cereri concurente
pentru același utilizator, nu la 400 de utilizatori diferiți.

## Ce măsurăm și ce nu

`npm run test:stress` execută codul actual de înscriere, rezervare de plată și
emitere pe MongoDB 7.0.24 temporar, local, cu pool de 10 conexiuni ca în aplicație.
Nu citește `.env`, nu folosește Atlas, nu trimite emailuri și nu apelează Stripe
sau Clerk. Nu adaugă rute speciale sau ocoliri de autentificare în aplicație.
Rapoartele JSON sunt în `.stress-results/`, ignorat de Git, cu amprentele surselor.

Scenarii: ultimul loc; înscrieri distribuite pe 10 ateliere; toate înscrierile
pe același atelier; rezervare și PaymentIntent simulat; emitere; reluare notificări;
dublu click; limita de două ateliere; anulare simultană; revenire după încărcare.
Se verifică numărul real de înscrieri, contoarele, capacitatea, unicitatea
biletelor și finalizarea fiecărei plăți, nu doar rezolvarea promisiunilor.

Acestea sunt **operații locale**, nu 1.000 de browsere sau un test Vercel.
Timpii includ așteptarea în pool și reîncercările tranzacțiilor. Rezultatele nu
includ autentificare, randare, rețea, throttling Atlas sau scalare serverless.
Testele existente `test:security` și `test:payments` acoperă suplimentar semnături,
autorizare, rollback și duplicate. Vechiul script `test-concurrent-registration.mjs`
apelează acum implementarea reală, pe bază temporară, nu o copie depășită.

Exemplu rapid PowerShell:

```powershell
$env:STRESS_LEVELS = '25'
npm run test:stress
Remove-Item Env:STRESS_LEVELS
```

Rafale progresive, pe bază temporară nouă la fiecare rulare:

```powershell
$env:STRESS_LEVELS = '500,750,1000'
$env:STRESS_PROFILE = 'burst'
npm run test:stress
Remove-Item Env:STRESS_LEVELS, Env:STRESS_PROFILE
```

O înscriere per participant, 1.000 de sosiri uniforme în 5 minute, pe 10 ateliere:

```powershell
$env:STRESS_LEVELS = '1000'
$env:STRESS_PROFILE = 'arrivals'
$env:STRESS_ARRIVAL_SECONDS = '300'
npm run test:stress
Remove-Item Env:STRESS_LEVELS, Env:STRESS_PROFILE, Env:STRESS_ARRIVAL_SECONDS
```

Profilul `arrivals` acceptă un singur nivel, nu repetă celelalte scenarii de
plată/rafală; păstrează verificările finale de dublu click, limită și anulare.
Timpii p95 exclud așteptarea programată înainte de sosire, dar includ așteptarea
DB și reluările. `arrivalDelayP95Ms` măsoară întârzierea generatorului față de
orar, `peakActive` numără operațiile simultan în zbor. Rata medie de 3,33
înscrieri/secundă nu este rata tuturor cererilor HTTP ale 1.000 de vizitatori;
nu acoperă o distribuție neuniformă, navigarea, loginul sau mai multe înscrieri
per persoană. Plafonul local este 1.000; plafonul probei HTTP rămâne 500 până la
aprobarea și dimensionarea etapei online.

Prima pornire descarcă binarul MongoDB; `MONGOMS_DOWNLOAD_DIR` poate configura
directorul cache. Descărcarea inițială nu trebuie confundată cu durata testului.
Un cod de ieșire 0 confirmă integritatea scenariilor, nu atingerea țintei de
latență. Consultă separat `latencyTargetPassed` din raport (p95 local sub 5s).

## Etapa HTTP — pregătită, nu certificată

`scripts/load/public.k6.mjs` este o probă **doar de citire** a paginii dinamice
`/congres/workshops`. Are etape smoke/ramp/spike și revenire la trafic mic,
pauze de 5–7 secunde per vizitator și plafon configurabil de cel mult 500 VU.
La 500 VU, pauzele limitează ritmul la aproximativ 100 cereri/secundă sau mai puțin.
Nu descarcă resurse ca un browser și nu reprezintă fluxul de înscriere/plată.

Pregătire obligatorie înainte de rulare:

1. Proiect de test separat, cu același cod/build ca versiunea evaluată, fără
   variabile Production moștenite. Nu folosi Preview-ul actual fără reverificare:
   documentația de securitate arată o integrare Mongo comună cu producția.
2. Bază pe infrastructură separată, cont cu drepturi numai în baza de test,
   date exclusiv sintetice. O altă bază pe același cluster nu izolează resursele.
3. Ediție activă, atelier fictiv cu nume unic de cel puțin 12 caractere, setarea
   `workshopVisibleToPublic=true`. Markerul verificat trebuie să fie numele
   atelierului, nu doar titlul ediției sau sigla, pentru a detecta liste goale.
4. Coordonare conform politicii Vercel, buget acceptat, sursă/IP și fereastră
   de test stabilite. Nu dezactiva global WAF/protecția de deployment.
5. Smoke cu 10 VU; apoi câte o rulare la 100, 250, 400 și 500, analizând rezultatul
   înainte de a crește. Spike numai după trecerea etapelor anterioare. Cel puțin
   trei repetări la nivelul țintă; separă rezultatele reci de cele încălzite.

Exemplu local (k6 instalat separat; server production-like izolat pornit):

```powershell
$env:STRESS_BASE_URL = 'http://127.0.0.1:3100'
$env:STRESS_EXPECTED_TEXT = 'Atelier fictiv pentru test'
$env:STRESS_VUS = '10'
$env:STRESS_SHAPE = 'smoke'
k6 run scripts/load/public.k6.mjs
```

Pentru o țintă online, scriptul cere suplimentar `STRESS_APPROVED_ORIGIN` exact
egal cu originea HTTPS, `STRESS_ISOLATED_BACKENDS=yes` și
`STRESS_PROVIDER_APPROVAL=yes`. Sunt confirmări ale operatorului, **nu dovezi
automate** că un mediu este izolat sau autorizat. Domeniile publice cunoscute sunt
refuzate, redirecționările sunt oprite. `VERCEL_AUTOMATION_BYPASS_SECRET`, dacă este
necesar și autorizat, rămâne în mediu, nu în comandă, Git sau raport. Nu exporta
loguri HTTP detaliate care ar putea include antetele.

Raport: `stress-http-summary.json`. Praguri inițiale: sub 1% răspunsuri/validări
eșuate, p95 sub 3s și p99 sub 5s. Pragurile p95 și erori opresc anticipat testul
după perioada de evaluare. 429, autentificarea redirecționată și o pagină fără
atelierul fictiv nu se contabilizează ca succes.

**Rămâne de executat separat fluxul autentificat complet.** Folosește conturi
Clerk de test distincte și sesiuni proprii fiecărui participant; nu același cont
copiat de 400 ori. Server Actions sunt serializate per client, iar identificatorii
lor depind de build: nu fixa un ID preluat dintr-o versiune veche. Nu introduce
un endpoint public care ocolește autentificarea. Testele intensive de plată trebuie
să simuleze furnizorul într-un mediu dedicat; testele Stripe reale rămân funcționale,
în volum mic (succes, refuz, 3DS, retry). Nu încărca serviciul Stripe Sandbox.

## Praguri de lansare și operare

| Semnal | Țintă inițială / acțiune |
| --- | --- |
| Supralocare, duplicat, plată fără emitere definitivă | Zero; orice caz blochează lansarea |
| Înscriere din perspectiva utilizatorului | p95 < 3s, p99 < 5s la 1.000 sosiri/5 minute; separat vârful aprobat, măsurat end-to-end |
| Erori neașteptate | < 1%; răspunsurile «plin» se verifică separat |
| Revenire după vârf | La nivelul de bază în cel mult 2 minute |
| MongoDB | Conexiuni și operații cu rezervă; fără throttling sau timeout |
| Webhook | Erori 5xx și plăți nefinalizate urmărite; nicio pierdere la retry |

Monitorizare de configurat în cloud, încă **neactivată de aceste scripturi**:

- Vercel: trafic, p95/p99 pentru acțiuni dinamice, 5xx/429, timeouturi, consum CPU,
  memorie și cost. Corelează cu intervalele de test, nu doar media întregii zile.
- Atlas: conexiuni, latențe, operații/secundă, CPU/memorie dacă planul le expune,
  conflicte de tranzacții și interogări lente. Nu mări automat pool-ul de 10:
  fiecare instanță serverless poate crea propriul pool.
- Stripe: livrări webhook eșuate și tentative pending vechi. Nu relansa plata
  manual ca soluție pentru un webhook lent; reconciliază același PaymentIntent.
- Alerte: responsabil de eveniment și înlocuitor nominalizați; avertizare la
  1% erori/5 minute, p95 peste 3s/5 minute, webhookuri care eșuează repetat și
  praguri de consum 50/75/90%. Testează efectiv livrarea alertelor.
- Backup: snapshot/export verificat și restaurare probată în altă bază înainte
  de eveniment. Nu face rollback de date peste plăți noi confirmate.

## Decizia de capacitate și cost

Prețurile orientative verificate la 30 septembrie 2026: Vercel Pro de la 20 USD/lună;
Atlas Dedicated de la 0,08 USD/oră (aproximativ 58,40 USD/730h). Baza combinată
este aproximativ 78,40 USD/lună, nu un plafon. Regiunea, backupurile, consumul,
locurile suplimentare pentru dezvoltatori, taxele și comisioanele Stripe pot
crește costul. Clerk Hobby are gratuitate în limitele planului; verifică separat
prețurile resursei Marketplace existente. Nu a fost activat niciun upgrade.

Dimensionarea nu se deduce numai din «1.000 utilizatori». Dacă testul reprezentativ
arată throttling/limite Mongo, evaluăm cluster dedicat în aceeași regiune cu
funcțiile Vercel; repetăm testul după schimbare. Dacă problema este concurența
pe un document sau apeluri repetate Clerk, optimizăm codul înainte de a cumpăra
resurse. Nu promitem că un anumit plan rezolvă o problemă de tranzacții.

### De ce Vercel Pro, separat de capacitatea MongoDB

Conform [condițiilor Hobby](https://vercel.com/docs/plans/hobby), acesta este
pentru utilizare personală, necomercială. Pentru platforma asociației care
vinde bilete, Pro este opțiunea propusă, nu un prag arbitrar de vizitatori.
[Pro](https://vercel.com/docs/plans/pro-plan) pornește de la 20 USD/lună, cu un
loc pentru publicare și 20 USD credit lunar de infrastructură. Consumul peste
credit și opțiunile suplimentare sunt facturabile. Include acces read-only
gratuit pentru colaboratori, administrarea consumului și nivelul de bază Flat
Rate CDN (1 milion de cereri CDN și 1 TB transfer/lună, la verificarea curentă).
Scalarea funcțiilor și HTTPS există și pe Hobby; Pro nu este singurul plan care
poate scala. Pro nu include costul serviciilor Marketplace MongoDB/Clerk/Stripe
și nu garantează că 1.000 de înscrieri concurente vor fi rapide. Nu este necesar
să alegem Enterprise numai din cauza estimării de 1.000 participanți.

O coadă de acces este o variantă de rezervă, nu o schimbare DNS: ar trebui să
controleze efectiv admiterea la operația server, cu token verificat și expirare,
nu doar să amâne butonul din browser. Ar necesita testarea echității și a
recuperării; nu o activăm fără dovezi că este necesară.

## În ziua evenimentului

1. Versiune stabilă verificată, fără deploy în fereastra deschiderii înscrierilor.
2. Verifică ediția, fusul orar, start/deadline, capacitățile și toate setările
   efective. O pagină goală datorită setărilor nu este test de capacitate trecut.
3. Smoke cu conturi de test controlate; dashboardurile și alertele deschise.
4. Dacă apar erori: oprește creșterea testului sau noile înscrieri folosind
   setarea existentă, păstrează livrarea webhookurilor, verifică plățile în curs.
5. Revenire la versiunea stabilă numai după verificarea compatibilității datelor;
   nu șterge tentativele de plată și nu reseta contoarele manual.

Referințe: [politica Vercel](https://vercel.com/kb/guide/what-s-vercel-s-policy-regarding-load-testing-deployments),
[ghidul de test Vercel](https://vercel.com/kb/guide/how-to-effectively-load-test-your-vercel-application),
[limitele și testarea Stripe](https://docs.stripe.com/rate-limits),
[k6 praguri](https://grafana.com/docs/k6/latest/using-k6/thresholds/),
[Vercel prețuri](https://vercel.com/pricing), [Atlas prețuri](https://www.mongodb.com/pricing),
[Clerk prețuri](https://clerk.com/pricing).
