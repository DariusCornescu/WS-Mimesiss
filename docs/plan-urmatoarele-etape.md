# Plan pentru următoarele etape ale site-ului ASMM

Actualizat: 14 septembrie 2026

## 1. Identitate vizuală inspirată din pagina de Instagram

Site-ul public folosește acum bleumarin (`#142641`), galben (`#FFD037`) și alb. Înainte de schimbarea globală avem nevoie de 3–5 postări reprezentative sau capturi din pagina oficială de Instagram, fiindcă profilul nu poate fi citit automat în mod fiabil.

Din referințe vom extrage:

- culorile principale și culorile de accent;
- stilul titlurilor, formelor și fundalurilor;
- felul în care sunt tratate fotografiile;
- elementele care trebuie păstrate pentru accesibilitate: contrast, text lizibil și starea de focus.

Schimbarea se va face prin variabilele globale ale suprafeței publice, astfel încât homepage-ul, proiectele, congresul și paginile informative să rămână consecvente. Panoul administrativ poate rămâne în tema lui închisă.

## 2. Fotografii organizate pe eveniment

Structura recomandată este:

`Proiect → Ediție → Eveniment/Workshop → Album → Fotografii`

MongoDB va păstra doar informațiile despre album și fotografii (titlu, descriere, adresă, ordine, autor și dată). Fișierele foto vor fi păstrate într-un serviciu de obiecte, nu direct în MongoDB.

Funcții necesare:

- creare album din panoul admin;
- încărcare multiplă de fotografii;
- copertă, reordonare, descriere și publicare/ciornă;
- galerie publică pe pagina evenimentului;
- ștergerea fișierului din stocare când fotografia este eliminată;
- limită de dimensiune și conversie automată în WebP/AVIF;
- acces la upload doar pentru admin/moderator.

### Varianta recomandată: Cloudflare R2

R2 se potrivește cu infrastructura Cloudflare deja aleasă. Include lunar 10 GB de stocare, 1 milion de operații de scriere și 10 milioane de citiri, fără taxă de trafic către internet. Peste limita gratuită, stocarea Standard costă 0,015 USD/GB/lună, iar operațiile se taxează separat. Sursa oficială: <https://developers.cloudflare.com/r2/pricing/>.

Exemplu realist după optimizare:

- 1.000 fotografii × aproximativ 1 MB = aproximativ 1 GB;
- 5.000 fotografii × aproximativ 1 MB = aproximativ 5 GB;
- până la aproximativ 10.000 de fotografii optimizate poate rămâne în limita gratuită de stocare.

Costul tehnic lunar poate fi 0 USD la început. Trebuie urmărite utilizarea și backupul; timpul de administrare este mai important decât costul de stocare în această etapă.

Cloudflare Images poate genera automat versiuni pentru mobil, card și fotografie mare. Planul gratuit include 5.000 de transformări unice pe lună. Peste această limită, planul plătit taxează 0,50 USD/1.000 de transformări; dacă fotografiile sunt găzduite direct în Cloudflare Images, costul este 5 USD/100.000 de imagini stocate și 1 USD/100.000 de livrări. Sursa oficială: <https://developers.cloudflare.com/images/pricing/>.

Estimare pentru R2, presupunând aproximativ 1 MB/fotografie după optimizare:

| Arhivă | Spațiu estimat | Cost R2 estimat |
| --- | ---: | ---: |
| 2.000 fotografii | 2 GB | 0 USD/lună |
| 10.000 fotografii | 10 GB | 0 USD/lună |
| 25.000 fotografii | 25 GB | aproximativ 0,23 USD/lună pentru spațiul peste limita gratuită |
| 100.000 fotografii | 100 GB | aproximativ 1,35 USD/lună pentru spațiul peste limita gratuită |

Operațiile rămân gratuite cât timp nu depășim un milion de scrieri și zece milioane de citiri lunar. Recomandarea pentru început este R2 Standard + transformările gratuite Cloudflare Images, limită de 10 MB per fișier la upload și maximum trei versiuni vizuale per fotografie. Mentenanța de rutină ar trebui să însemne verificarea consumului și a backupului o dată pe trimestru.

Alternative:

- Vercel Blob: integrare simplă cu aplicația; 1 GB stocare și 10 GB transfer incluse pe Hobby, apoi aproximativ 0,023 USD/GB stocare și 0,05 USD/GB transfer, în funcție de regiune. <https://vercel.com/docs/vercel-blob/usage-and-pricing>
- Cloudinary: optimizare și transformări foto foarte bune; plan gratuit cu 25 credite lunare, dar următorul plan public pornește de la 99 USD/lună. <https://cloudinary.com/pricing>

## 3. Domeniu nou și emailurile organizației

Domeniul trebuie ales înainte de configurarea adreselor de email. Același domeniu ar trebui folosit pentru site și email, de exemplu:

- `asmm.ro` — prima opțiune dacă este disponibil;
- `asmm-bucuresti.ro`;
- `asociatia-asmm.ro`;
- `medicinistimilitar.ro`.

Disponibilitatea și prețul trebuie verificate în ziua cumpărării. Domeniul trebuie înregistrat pe numele organizației, într-un cont controlat de cel puțin două persoane din board, cu recuperare și facturare ale organizației.

Verificare WHOIS RoTLD făcută la 14 septembrie 2026:

| Domeniu | Rezultat la verificare | Recomandare |
| --- | --- | --- |
| `asmm.ro` | fără înregistrare găsită | prima alegere: scurt și ușor de reținut |
| `asmm-bucuresti.ro` | fără înregistrare găsită | rezervă clară și explicită |
| `asociatia-asmm.ro` | fără înregistrare găsită | rezervă, dar mai lungă |
| `medicinistimilitar.ro` | fără înregistrare găsită | bun pentru comunicare, mai puțin apropiat de acronim |
| `asmm.org.ro` | fără înregistrare găsită | rezervă specifică unei organizații nonprofit |

RoTLD afișează un tarif direct de 12 EUR + TVA/an atât pentru înregistrare, cât și pentru reînnoire: <https://www.rotld.ro/prices/>. Un registrar partener poate avea alt tarif. Disponibilitatea nu este rezervată prin simpla verificare și se poate schimba înaintea cumpărării.

La aceeași verificare, `mimesiss.ro` apărea cu statusul `PendingDelete`, deci noul domeniu al asociației nu trebuie amânat sau condiționat de păstrarea acestuia.

După alegerea domeniului putem crea:

- adrese personale: `prenume.nume@domeniu.ro`;
- adrese de rol: `presedinte@`, `secretar@`, `trezorier@`, `comunicare@`, `evenimente@`;
- grupuri: `board@`, `voluntari@`, `parteneriate@`.

Adresele de rol și grupurile reduc problemele când se schimbă boardul.

### Serviciul recomandat: Google Workspace for Nonprofits

Asociațiile nonprofit din România pot fi eligibile după verificarea prin Goodstack. Planul nonprofit este 0 USD/utilizator/lună și include email pe domeniu, administrare centrală și 100 TB de stocare comună. Surse oficiale: <https://support.google.com/nonprofits/answer/3215869?co=GENIE.CountryCode%3DRO&hl=en> și <https://www.google.com/intl/ro/nonprofits/offerings/workspace/>.

Dacă organizația nu este acceptată, varianta comercială Google Workspace Business Starter este în jur de 7 USD/utilizator/lună cu angajament anual sau 8,40 USD flexibil; prețul final local trebuie verificat înainte de cumpărare.

## 4. Lista actualizată a boardului

Pentru fiecare persoană avem nevoie de:

| Câmp | Exemplu |
| --- | --- |
| Nume complet | Maria Popescu |
| Funcție oficială | Președinte |
| Fotografie | JPG/PNG original, preferabil vertical |
| Ordinea afișării | 1, 2, 3… |
| Mandat | 2026–2027 |
| Email public | opțional |
| Instagram/LinkedIn | opțional |
| Acord pentru publicarea pozei | da/nu |

Fotografiile ar trebui livrate la rezoluție cât mai mare, cu fața clară și spațiu în jurul capului. Site-ul va genera automat versiuni optimizate.

## Ordinea de lucru

1. Primim referințele vizuale de pe Instagram și lista boardului.
2. Alegem și înregistrăm domeniul pe organizație.
3. Aplicăm identitatea vizuală pe toate paginile publice.
4. Configurăm Cloudflare R2 și implementăm albumele pe evenimente.
5. Solicităm Google for Nonprofits și configurăm emailurile și grupurile.
6. Facem verificarea finală pe mobil, desktop, autentificare și panoul admin.
