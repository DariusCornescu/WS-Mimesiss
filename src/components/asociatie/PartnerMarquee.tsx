'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { Partner } from '@/lib/partner-types'
import styles from './PartnerMarquee.module.css'

type Organization = Pick<Partner, 'id' | 'name' | 'logo'>

function OrganizationCards({ organizations }: { organizations: Organization[] }) {
  return organizations.map(organization => (
    <div className={styles.logo} key={organization.id}>
      <Image src={organization.logo} alt={organization.name || 'Logo organizație parteneră'} width={200} height={150} unoptimized sizes="(max-width: 760px) 150px, 200px" />
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
        <div className={`${styles.track} ${organizations.length === 1 ? styles.staticTrack : ''} ${paused ? styles.paused : ''}`}>
          <div className={styles.group}><OrganizationCards organizations={organizations} /></div>
          {organizations.length > 1 && <div className={styles.group} aria-hidden="true"><OrganizationCards organizations={organizations} /></div>}
        </div>
      </div> : <p className={styles.empty}>Aici vor apărea siglele sponsorilor și ale asociațiilor partenere confirmate.</p>}
    </div>
  )
}

export default function PartnerMarquee({ partners }: { partners: Partner[] }) {
  const institutionalPartners = partners.filter(partner => partner.visible && partner.category === 'institutional')
  const sponsors = partners.filter(partner => partner.visible && partner.category === 'sponsor')
  if (!institutionalPartners.length && !sponsors.length) return null
  return (
    <section className={styles.section} aria-label="Colaborări">
      <div className={styles.rows}>
        {institutionalPartners.length > 0 && <PartnerLane title="Parteneri instituționali" organizations={institutionalPartners} />}
        {sponsors.length > 0 && (
          <PartnerLane title="Sponsori" organizations={sponsors} />
        )}
      </div>
    </section>
  )
}
