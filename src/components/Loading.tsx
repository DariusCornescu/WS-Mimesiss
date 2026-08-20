import Image from 'next/image'
import { AiOutlineLoading } from "react-icons/ai";

export default function Loading() {
  return (
	<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
	  <div className="flex flex-col items-center gap-6">
		{/* Logo */}
		<div className="relative h-24 w-48">
		  <Image src="/icons/asmm.png" alt="MIMESISS" fill style={{ objectFit: 'contain' }} />
		</div>

		{/* Spinner + text */}
		<div className="flex flex-col items-center gap-3">
		 <AiOutlineLoading className="animate-spin h-14 w-14 text-primary" />
		  
		</div>
	  </div>
	</div>
  )
}
