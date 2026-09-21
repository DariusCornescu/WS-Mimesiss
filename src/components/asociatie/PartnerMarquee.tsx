'use client'

import Image from 'next/image'
import { useState } from 'react'
import styles from './PartnerMarquee.module.css'

type Organization = { name: string; logo: string }

const institutionalPartners: Organization[] = [
  { name: 'Spitalul Universitar de Urgență Militar Central „Dr. Carol Davila”', logo: '/orgs/2.png' },
  { name: 'Direcția Medicală', logo: '/orgs/3.png' },
  { name: 'Universitatea de Medicină și Farmacie „Carol Davila”', logo: '/orgs/4.png' },
  { name: 'Institutul Medico-Militar', logo: '/orgs/5.png' },
  { name: 'Institutul Național de Medicină Aeronautică și Spațială', logo: '/orgs/aero.png' },
]

// Adăugăm aici doar sponsorii și asociațiile partenere confirmate.
const sponsorsAndAssociations: Organization[] = []

function OrganizationCards({ organizations }: { organizations: Organization[] }) {
  return organizations.map(organization => (
    <div className={styles.logo} key={organization.logo}>
      <Image src={organization.logo} alt={organization.name} width={200} height={150} sizes="(max-width: 760px) 150px, 200px" />
    </div>
  ))
}

function PartnerLane({ title, organizations }: { title: string; organizations: Organization[] }) {
  const [paused, setPaused] = useState(false)

  return (
    <div className={styles.lane}>
      <div className={styles.laneHeading}>
        <h2>{title}</h2>
        {organizations.length > 1 && <button
          type="button"
          className={styles.pauseButton}
          aria-pressed={paused}
          aria-label={paused ? `Pornește mișcarea: ${title}` : `Oprește mișcarea: ${title}`}
          onClick={() => setPaused(value => !value)}
        >
          {paused ? 'Pornește' : 'Pauză'}
        </button>}
      </div>
      {organizations.length > 0 ? <div className={styles.viewport}>
        <div className={`${styles.track} ${paused ? styles.paused : ''}`}>
          <div className={styles.group}><OrganizationCards organizations={organizations} /></div>
          <div className={styles.group} aria-hidden="true"><OrganizationCards organizations={organizations} /></div>
        </div>
      </div> : <p className={styles.empty}>Aici vor apărea siglele sponsorilor și ale asociațiilor partenere confirmate.</p>}
    </div>
  )
}

export default function PartnerMarquee() {
  return (
    <section className={styles.section} aria-label="Colaborări">
      <div className={styles.rows}>
        <PartnerLane title="Parteneri instituționali" organizations={institutionalPartners} />
        <PartnerLane title="Sponsori și asociații partenere" organizations={sponsorsAndAssociations} />
      </div>
    </section>
  )
}
