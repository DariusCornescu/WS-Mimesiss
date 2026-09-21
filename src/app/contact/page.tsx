import Link from 'next/link'
import HeaderContent from '@/components/ui/HeaderContent'
import { FaEnvelope, FaPhone, FaInstagram, FaFacebook } from 'react-icons/fa'
export const metadata = {title:'Contact',description:'Date de contact ale Asociației Studenților Mediciniști Militari.'}
const contacts = [
  {title:'Secretariat',name:'Întrebări despre congres și participare',href:'mailto:secretariat@asmm-bucuresti.com',label:'secretariat@asmm-bucuresti.com',email:true},
  {title:'Președinte congres',name:'Anghel Liviu Florin',href:'tel:0760200222',label:'0760 200 222'},
  {title:'Sponsorizări și parteneriate',name:'Vicepreședinte Externe · Bosca Mihai Iulian',href:'tel:0742138755',label:'0742 138 755'},
  {title:'Fundraising',name:'Oncel Mara Elena',href:'tel:0753642438',label:'0753 642 438'},
  {title:'Email oficial ASMM',name:'Pentru idei, colaborări și întrebări despre asociație',href:'mailto:office.asmm@gmail.com',label:'office.asmm@gmail.com',email:true},
]
export default function ContactPage() {return <><HeaderContent title="Hai să vorbim." kicker="ASMM · Contact"/><div className="public-page"><p className="public-intro">Ai o întrebare despre congres, o idee de proiect sau vrei să colaborăm? Alege persoana potrivită și ia legătura cu noi.</p><div className="public-grid">{contacts.map(contact => <section key={contact.href} className="public-card"><div className="mb-6">{contact.email ? <FaEnvelope size={24} aria-hidden="true"/> : <FaPhone size={24} aria-hidden="true"/>}</div><h2>{contact.title}</h2><p>{contact.name}</p><a href={contact.href} className="public-link break-all">{contact.label}</a></section>)}</div><section className="mt-16"><h2 className="text-3xl mb-6">Urmărește activitatea ASMM</h2><div className="flex flex-wrap gap-8"><Link href="https://www.instagram.com/asmm.bucuresti?igsh=MWExZHc0Y3hrNWh1bg==" target="_blank" rel="noreferrer" className="public-link"><FaInstagram aria-hidden="true"/> Instagram</Link><Link href="https://www.facebook.com/share/1CmCN8trYg/?mibextid=wwXIfr" target="_blank" rel="noreferrer" className="public-link"><FaFacebook aria-hidden="true"/> Facebook</Link></div></section></div></>}
