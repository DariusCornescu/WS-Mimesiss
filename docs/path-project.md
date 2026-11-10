# PATH

PATH (Practical Abilities & Training in Healthcare) is a project page at `/proiecte/path`. Its content
lives in code, in `src/lib/path-project.ts`, so the page, the homepage and the mobile menu stay in sync.

## What is where

| Piece | File |
|-------|------|
| Dates, texts, workshops | `src/lib/path-project.ts` |
| Page | `src/app/proiecte/path/page.tsx`, `src/components/path/` |
| Countdown (shared) | `src/components/ui/Countdown.tsx` |
| Cover and hero artwork | `public/projects/path/` |
| Colours | `--path-*` tokens in `src/app/globals.css` |

## Adding the workshops and doctors

Fill `pathWorkshops` in `src/lib/path-project.ts`. Put photos in `public/projects/path/workshops/`.

```ts
export const pathWorkshops: PathWorkshop[] = [
  {
    title: 'Tehnici de sutură',
    doctor: 'Dr. Nume Prenume',
    doctorRole: 'Medic primar chirurgie generală',
    description: 'Ce exersează participanții, în două-trei propoziții.',
    image: '/projects/path/workshops/sutura.webp',
    imageAlt: 'Studenți exersând suturi pe un model.',
    schedule: 'Vineri, 4 decembrie · 10:00–12:00',
    location: 'Sala de simulare',
    seats: 20,
  },
]
```

While the list is empty the page shows a "published soon" notice instead.

## Phases

The page moves through four phases on its own, from the dates in `pathProject`:

1. Before `registrationOpensAt`: countdown to the opening of registrations.
2. Until `startsAt`: countdown to the event. The sign-up button appears only when `registrationHref` is set.
3. Until `endsAt`: "in progress".
4. Afterwards: "ended". The homepage drops the event from "Evenimente viitoare".

Dates are written with the Romanian UTC offset (`+02:00` in winter). `endsAt` is exclusive: midnight after
the last day.

## Homepage

- The next dated event gets a featured card with a countdown. PATH is merged into the list by
  `withPathEvent`; editions from the database appear the same way.
- `withPathProject` adds the PATH card to project lists. The homepage grid still appears only when
  projects are published from the admin.
- If a project with the slug `path` is created in the admin, its card replaces the built-in one. The
  page at `/proiecte/path` stays the one from code.
