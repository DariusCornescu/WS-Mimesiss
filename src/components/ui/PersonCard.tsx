import Image from 'next/image'
import styles from './PersonCard.module.css'

type PersonCardProps = {
  name: string
  role: string
  imageUrl: string
  priority?: boolean
  imageOffsetX?: number
}

export default function PersonCard({ name, role, imageUrl, priority = false, imageOffsetX = 0 }: PersonCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.portrait}>
        <div className={styles.imageFrame}>
          <Image
            src={imageUrl}
            alt={name}
            width={800}
            height={1000}
            sizes="(max-width: 479px) calc(100vw - 44px), (max-width: 1023px) calc((100vw - 72px) / 2), (max-width: 1200px) calc((100vw - 104px) / 3), 366px"
            priority={priority}
            style={{ left: `${imageOffsetX}%` }}
          />
        </div>
      </div>
      <div className={styles.caption}>
        <h3>{name}</h3>
        <p>{role}</p>
      </div>
    </article>
  )
}
