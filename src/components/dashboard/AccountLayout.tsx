import type { ReactNode } from 'react'
import DashboardSidebar from './DashboardSidebar'
import type { DashboardNavigationUser } from './DashboardSidebar'
import styles from './AccountLayout.module.css'

interface AccountLayoutProps {
  children: ReactNode
  user: DashboardNavigationUser
}

export default function AccountLayout({ children, user }: AccountLayoutProps) {
  return (
    <div className={styles.shell}>
      <a href="#account-content" className={styles.skipLink}>Sari la conținutul contului</a>
      <DashboardSidebar user={user} />
      <div id="account-content" tabIndex={-1} className={styles.content}>
        <div className={styles.contentInner}>{children}</div>
      </div>
    </div>
  )
}
