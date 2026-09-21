import CongressInfo from '@/components/asociatie/CongressInfo'
import { getAppSettings } from '@/lib/settings'
import { getAllTickets } from './actions'
export default async function Page() {
 const settings = await getAppSettings()
 const tickets = (await getAllTickets()).filter(ticket => ticket.enabled !== false)
 return <CongressInfo paymentEnabled={settings.paymentsEnabled} activeTicket={tickets.find(ticket => ticket.type === 'active')} passiveTicket={tickets.find(ticket => ticket.type === 'passive')} />
}
