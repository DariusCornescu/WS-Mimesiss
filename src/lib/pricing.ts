// Ticket pricing configuration
export const TICKET_PRICES = {
  active: {
    price: 12000, // 120 RON in cents
    displayPrice: '120 RON',
    name: 'Bilet Activ',
    description: 'Acces complet la toate workshop-urile și sesiunile',
    features: [
      'Acces la toate workshop-urile',
      'Participare activă la sesiuni',
      'Materiale de curs incluse',
      'Certificat de participare',
      'Networking cu specialiștii',
    ],
  },
  passive: {
    price: 17000, // 170 RON in cents
	  displayPrice: '170 RON',
    name: 'Bilet Pasiv',
    description: 'Acces la vizionarea sesiunilor în mod pasiv',
    features: [
      'Vizionare sesiuni în mod pasiv',
      'Acces la materialele de bază',
      'Certificat de participare',
    ],
  },
} as const;

export type TicketType = keyof typeof TICKET_PRICES;