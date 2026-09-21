import Image from 'next/image'
export default function PersonCard({ name, role, imageUrl, className = '' }: {name:string; role:string; imageUrl:string; className?:string}) {
  return <article className={`person-card ${className}`}><Image src={imageUrl} alt={name} width={500} height={625} sizes="(max-width: 640px) 50vw, 400px" /><h3>{name}</h3><p>{role}</p></article>
}
