'use client';

import { useEffect, useState, useCallback } from 'react';
import { FaDownload, FaShare } from 'react-icons/fa';
import Image from 'next/image';
import QRCode from 'qrcode';

interface SimpleUserQRCodeProps {
	userId: string;
	userName?: string;
}

export default function SimpleUserQRCode({ userId, userName }: SimpleUserQRCodeProps) {
	const [qrUrl, setQrUrl] = useState<string>('');
	const [qrDataUrl, setQrDataUrl] = useState<string>('');
	const [isLoading, setIsLoading] = useState(true);

	const generateQRCode = useCallback(async (url: string) => {
		try {
			const dataUrl = await QRCode.toDataURL(url, {
				width: 300,
				margin: 2,
				color: {
					dark: '#DF5739',
					light: '#FFFFFF'
				},
				errorCorrectionLevel: 'M'
			});
			setQrDataUrl(dataUrl);
			setIsLoading(false);
		} catch (error) {
			console.error('Error generating QR code:', error);
			setIsLoading(false);
		}
	}, []); // Add state setters as dependencies

	useEffect(() => {
		if (typeof window !== 'undefined' && userId) {
			const url = `${window.location.origin}/qr/${userId}`;
			setQrUrl(url);
			generateQRCode(url);
		}
	}, [userId, generateQRCode]);

	const downloadQRCode = async () => {
		if (!qrDataUrl) return;

		try {
			const link = document.createElement('a');
			link.href = qrDataUrl;
			link.download = userName ? `MIMESISS_QR_${userName.replace(/\s+/g, '_')}.png` : `MIMESISS_QR_User_${userId}.png`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			console.error('Error downloading QR code:', error);
			alert('Eroare la descărcarea codului QR. Încearcă din nou.');
		}
	};

	const shareQRCode = async () => {
		if (!qrDataUrl) return;

		try {
			if (navigator.share && navigator.canShare) {
				// Convert data URL to blob
				const response = await fetch(qrDataUrl);
				const blob = await response.blob();
				const file = new File([blob], 'mimesiss-qr.png', { type: 'image/png' });

				if (navigator.canShare({ files: [file] })) {
					await navigator.share({
						title: 'Codul meu QR MIMESISS',
						text: 'Scanează acest cod QR pentru a confirma prezența mea la workshop-uri MIMESISS.',
						files: [file]
					});
					return;
				}
			}

			// Fallback: copy URL to clipboard
			await navigator.clipboard.writeText(qrUrl);
			alert('Link-ul QR a fost copiat în clipboard!');
		} catch (error) {
			console.error('Error sharing QR code:', error);
			try {
				await navigator.clipboard.writeText(qrUrl);
				alert('Link-ul QR a fost copiat în clipboard!');
			} catch {
				alert('Nu s-a putut partaja codul QR.');
			}
		}
	};

	if (isLoading) {
		return (
			<div className="p-6">
				<h3 className="text-lg font-semibold mb-4">Codul tău QR</h3>
				<div className="flex justify-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="text-center space-y-4">
				{/* Simple QR Code */}
				{qrDataUrl && (
					<div className="flex justify-center">
						<Image
							width={300}
							height={300}
							src={qrDataUrl}
							alt="QR Code pentru confirmarea prezenței"
							className="w-[300px] h-[300px]"
						/>
					</div>
				)}

				<p className="text-sm text-muted-foreground">
					Codul QR pentru confirmarea prezenței la workshop-uri.
				</p>

				<div className="flex gap-3 justify-center">
					<button
						type='button'
						onClick={downloadQRCode}
						className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
					>
						<FaDownload className="mr-2 h-4 w-4" />
						Descarcă
					</button>

					<button
						type='button'
						onClick={shareQRCode}
						className="inline-flex items-center px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg"
					>
						<FaShare className="mr-2 h-4 w-4" />
						Partajează
					</button>
				</div>
			</div>
		</div>
	);
}