import HeaderContent from "@/components/ui/HeaderContent";
import { FaEnvelope, FaPhone } from "react-icons/fa";
import { FaInstagram, FaFacebook } from "react-icons/fa";
import Link from "next/link";

export default function ContactPage() {
	return (
		<>
			<HeaderContent title='Contact' />
			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
				{/* Secretariat Information */}
				<div className="mimesiss-card p-4 space-y-6">
					<h2 className="text-2xl font-bold text-accent text-center  md:col-span-2" >Echipa de Secretariat</h2>
					<div className="text-center">
						<FaEnvelope className="h-8 w-8 text-primary mx-auto mb-4" />
						<h4 className="text-lg font-semibold text-white mb-2">Email</h4>
						<Link href="mailto:secretariat@asmm-bucuresti.com" className="mimesiss-text-secondary hover:text-primary transition duration-200">
							secretariat@asmm-bucuresti.com
						</Link>
					</div>
				</div>

				{/* Secretariat Information */}
				<div className="mimesiss-card p-4 space-y-4">
					<h2 className="text-2xl font-bold text-accent text-center" >Președinte Congres</h2>
					<div className="text-center">
						<FaPhone className="h-8 w-8 text-primary mx-auto mb-4" />
						<h4 className="text-lg font-semibold text-white mb-2">Anghel Liviu Florin</h4>
						<Link href="tel:0760200222" className="mimesiss-text-secondary hover:text-primary transition duration-200">
							0760200222
						</Link>
					</div>	
				</div>

				{/* Sponsorship Information */}
				<div className="mimesiss-card p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
					<h2 className="text-2xl font-bold text-accent text-center  md:col-span-2" >Sponsorizări & Parteneriate</h2>
					<div className="text-center">
						<FaPhone className="h-8 w-8 text-primary mx-auto mb-4" />
						<h4 className="text-lg font-semibold text-white mb-2">Vicepreședinte Externe: Bosca Mihai Iulian</h4>
						<Link href="tel:0742138755" className="mimesiss-text-secondary hover:text-primary transition duration-200">
							0742138755
						</Link>
					</div>
					<div className="text-center border-t border-primary pt-4 md:pt-0 md:border-t-0 md:border-l">
						<FaPhone className="h-8 w-8 text-primary mx-auto mb-4" />
						<h4 className="text-lg font-semibold text-white mb-2">Responsabil Fundraising - Oncel Mara Elena</h4>
						<Link href="tel:0753642438" className="mimesiss-text-secondary hover:text-primary transition duration-200">
							0753642438
						</Link>
					</div>

					<div className="text-center border-t border-primary pt-4 md:col-span-2 mt-4 gap-4">
						<FaEnvelope className="h-8 w-8 text-primary mx-auto mb-4" />
						<h4 className="text-lg font-semibold text-white mb-2">Email oficial ASMM</h4>
						<Link href="mailto:office.asmm@gmail.com" className="mimesiss-text-secondary hover:text-primary transition duration-200">
							office.asmm@gmail.com
						</Link>
					</div>
				</div>


				{/* Social Media */}
				<div className="mimesiss-card p-4 space-y-4">
					<h2 className="text-2xl font-bold text-accent text-center  md:col-span-2" >Urmărește activitatea ASMM</h2>
					<div className="flex flex-row justify-center items-center space-x-6">
						<Link href="https://www.instagram.com/asmm.bucuresti?igsh=MWExZHc0Y3hrNWh1bg==" target="_blank" aria-label="Instagram">
							<FaInstagram className="h-6 w-6 text-primary mb-4" />
						</Link>

						<Link href="https://www.facebook.com/share/1CmCN8trYg/?mibextid=wwXIfr" target="_blank" aria-label="Facebook">
							<FaFacebook className="h-6 w-6 text-primary mb-4" />
						</Link>

					</div>
				</div>
			</div>
		</>
	);
}