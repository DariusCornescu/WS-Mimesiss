'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FaChartBar, FaCalendarAlt, FaUsers, FaTicketAlt, FaCreditCard, FaCogs, FaProjectDiagram, FaArrowLeft } from 'react-icons/fa'
import styles from './AdminPreview.module.css'

const sections = [
  { id: 'overview', label: 'Dashboard Admin', icon: FaChartBar },
  { id: 'workshops', label: 'Administrare Workshop-uri', icon: FaCalendarAlt },
  { id: 'projects', label: 'Administrare Proiecte', icon: FaProjectDiagram },
  { id: 'users', label: 'Administrare Utilizatori', icon: FaUsers },
  { id: 'tickets', label: 'Administrare Bilete', icon: FaTicketAlt },
  { id: 'payments', label: 'Administrare Plăți', icon: FaCreditCard },
  { id: 'settings', label: 'Setări Aplicație', icon: FaCogs },
  { id: 'attendance', label: 'Moderator · Prezență', icon: FaCalendarAlt },
] as const
type Section = typeof sections[number]['id']

const tables: Record<Exclude<Section, 'overview' | 'settings'>, { description: string; columns: string[]; rows: string[][] }> = {
  workshops: { description: 'Exemple pentru discutarea listei de ateliere, capacității și stării înscrierilor.', columns: ['Atelier', 'Locație', 'Participanți', 'Stare'], rows: [
    ['Atelier demonstrativ de suturi', 'Sala de simulare A', '2 / 20', 'Activ'],
    ['Prim ajutor — exemplu', 'Sala de simulare B', '1 / 15', 'Activ'],
  ] },
  projects: { description: 'Structura proiectelor și a edițiilor. Publicarea reală se face din panoul autentificat.', columns: ['Proiect', 'Tip', 'Ediție', 'Stare'], rows: [
    ['MIMESISS — exemplu', 'Congres', 'Ediție demonstrativă', 'Ciornă'],
  ] },
  users: { description: 'Persoanele de mai jos sunt fictive. Rolurile ilustrează opțiunile existente în aplicație.', columns: ['Nume', 'Email', 'Tip', 'Rol'], rows: [
    ['Alex Exemplu', 'alex@example.com', 'Student', 'Utilizator'],
    ['Maria Demo', 'maria@example.com', 'Student', 'Moderator'],
    ['Andrei Test', 'andrei@example.com', 'Rezident', 'Administrator'],
  ] },
  tickets: { description: 'Tarife fictive, folosite doar pentru previzualizare.', columns: ['Bilet', 'Categorie', 'Preț demonstrativ', 'Stare'], rows: [
    ['Participant activ — demo', 'Workshop', '100 RON', 'Activ'],
    ['Participant pasiv — demo', 'Conferință', '50 RON', 'Activ'],
  ] },
  payments: { description: 'Plăți fictive. Această pagină nu inițiază tranzacții și nu contactează Stripe.', columns: ['Referință demo', 'Participant', 'Sumă', 'Stare'], rows: [
    ['DEMO-001', 'Alex Exemplu', '100 RON', 'Finalizată'],
    ['DEMO-002', 'Maria Demo', '50 RON', 'În așteptare'],
  ] },
  attendance: { description: 'Exemplu de listă pentru verificarea prezenței. Scanarea QR și confirmarea reală necesită autentificare.', columns: ['Participant', 'Atelier', 'Prezență'], rows: [
    ['Alex Exemplu', 'Atelier demonstrativ de suturi', 'Confirmată'],
    ['Maria Demo', 'Atelier demonstrativ de suturi', 'Neconfirmată'],
    ['Andrei Test', 'Prim ajutor — exemplu', 'Neconfirmată'],
  ] },
}

export default function AdminPreview() {
  const [section, setSection] = useState<Section>('overview')
  const [query, setQuery] = useState('')
  const [registration, setRegistration] = useState(true)
  const [visible, setVisible] = useState(true)
  const current = sections.find(item => item.id === section)!
  function navigate(id: Section) { setSection(id); setQuery('') }
  const table = section !== 'overview' && section !== 'settings' ? tables[section] : null
  const filtered = table?.rows.filter(row => row.join(' ').toLocaleLowerCase('ro').includes(query.toLocaleLowerCase('ro')))

  return <div className={styles.preview}>
    <div className={styles.notice}><strong>PREVIZUALIZARE LOCALĂ</strong><span>Date fictive · Modificările sunt temporare · Nu este conectată la operațiunile reale de administrare</span></div>
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.identity}>Administrator demonstrativ<small>MIMESISS · Explorare interfață</small></div>
        <nav aria-label="Secțiuni previzualizare admin">{sections.map(item => <button key={item.id} type="button" aria-current={section === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><item.icon aria-hidden="true" />{item.label}</button>)}</nav>
        <Link href="/" className={styles.back}><FaArrowLeft aria-hidden="true" />Înapoi la site</Link>
      </aside>
      <div className={styles.content}>
        <div className={styles.card}><h1>{section === 'overview' ? 'Panou Administrare' : current.label}</h1><p>{section === 'overview' ? 'Explorează structura panoului: workshopuri, utilizatori, bilete și setări.' : table?.description || 'Comutatoarele de mai jos schimbă doar această demonstrație. Se resetează la reîncărcare.'}</p></div>
        {section === 'overview' && <>
          <div className={styles.stats}>{[{label:'Utilizatori demo',value:3,icon:FaUsers},{label:'Workshopuri demo',value:2,icon:FaCalendarAlt},{label:'Înscrieri demo',value:3,icon:FaTicketAlt}].map(stat => <div className={styles.card} key={stat.label}><stat.icon aria-hidden="true" /><p>{stat.label}</p><strong>{stat.value}</strong></div>)}</div>
          <section className={styles.card}><h2>Acțiuni rapide</h2><div className={styles.actions}><button onClick={() => navigate('workshops')}>Vezi workshopurile</button><button onClick={() => navigate('users')}>Vezi utilizatorii</button><button onClick={() => navigate('settings')}>Explorează setările</button></div></section>
          <section className={styles.card}><h2>Activitate recentă</h2><div className={styles.empty}><FaCogs aria-hidden="true" /><h3>În dezvoltare</h3><p>Și în panoul actual, această secțiune este rezervată unui viitor istoric al activității.</p></div></section>
        </>}
        {table && <section className={styles.card}>
          <label className={styles.search}>Caută în exemple<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nume, stare sau categorie…" /></label>
          <div className={styles.tableWrap}><table><caption className="sr-only">{current.label} — date demonstrative</caption><thead><tr>{table.columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{filtered?.map((row, index) => <tr key={index}>{row.map((cell, col) => <td key={col}>{cell}</td>)}</tr>)}</tbody></table></div>
          {!filtered?.length && <p role="status" className={styles.empty}>Niciun exemplu nu corespunde căutării.</p>}
        </section>}
        {section === 'settings' && <section className={styles.card}>
          <h2>Setări congres · demonstrație</h2>
          <label className={styles.setting}><span>Înscrieri la workshopuri<small>{registration ? 'Activate în demonstrație' : 'Dezactivate în demonstrație'}</small></span><input type="checkbox" checked={registration} onChange={event => setRegistration(event.target.checked)} /></label>
          <label className={styles.setting}><span>Workshopuri vizibile public<small>{visible ? 'Vizibile în demonstrație' : 'Ascunse în demonstrație'}</small></span><input type="checkbox" checked={visible} onChange={event => setVisible(event.target.checked)} /></label>
          <div className={styles.setting}><span>Plăți online<small>Indisponibile în previzualizare</small></span><span>Dezactivate</span></div>
          <p role="status">Setările reale ale aplicației nu sunt modificate.</p>
        </section>}
      </div>
    </div>
  </div>
}
