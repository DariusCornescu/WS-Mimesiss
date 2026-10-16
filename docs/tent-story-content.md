# Texte pentru Cortul IMM

Administratorii pot deschide **Proiecte → Cortul IMM · Povestea animată → Editează textele**, la `/admin/proiecte/cortul-imm`. Fiecare imagine de album are un titlu (maximum 80 de caractere) și o descriere (maximum 1200 de caractere). Salvarea publică textele imediat; câmpurile goale lasă zona liberă. Fotografia de grup și imaginile de album nu sunt înlocuite de formular.

Pe desktop fotografia și textul ocupă coloane separate. Pe telefon, fotografia este deasupra textului. Descrierile lungi sunt împărțite în pasaje la scroll, păstrând aceeași imagine. Textele sunt afișate ca text simplu, fără HTML.

Conținutul se păstrează în colecția `projectstorycontents`, cu cheia unică `cortul-imm`. Nu este necesară migrarea datelor existente: primul save creează documentul. Nu se introduc texte implicite în producție. Pagina și acțiunea de salvare verifică rolul de administrator din MongoDB; câmpurile sunt validate și pe server.

Cache-ul public conține numai cele șase câmpuri de text, are o expirare de cinci minute și este invalidat imediat după salvare prin tag-ul `tent-story-copy`. Identitatea administratorului nu intră în cache. Citirile eșuate propagă eroarea; salvările eșuate afișează o eroare și nu invalidează cache-ul.

Verificări: `npm run test:stories` include validarea câmpurilor, blocarea salvării fără rol, tratarea erorilor și împărțirea pasajelor. `node --test scripts/test-tent-story-storage.mjs` verifică persistența și golirea câmpurilor într-o bază locală temporară; refuză conexiunile către gazde externe. CI execută acest test cu MongoDB local. Previzualizarea formularului de la `/preview/cortul-imm` este disponibilă numai în dezvoltare și are salvarea dezactivată.


## Other animated projects

MIMESISS and Balul bobocilor have scene title and description editors at `/admin/proiecte/poveste/mimesiss` and `/admin/proiecte/poveste/balul-bobocilor`. Both are linked from project administration. Their existing text is the default until saved; explicit empty values hide the text while keeping the photograph. Each project writes only its fixed slug and known scene keys to `projectstorycontents`, and expires its own public cache tag after an authorized save. Limits match Cortul IMM (80 / 1200 characters). Long descriptions are split into scroll passages; the project keeps its existing imagery and visual style.

All project story photographs are displayed without an original-photo opening command. The separate gallery viewer remains available.
