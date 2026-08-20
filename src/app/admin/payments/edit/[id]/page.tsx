interface NewPaymentPageProps {

	params: Promise<{
		id: string
	}>
}

export default async function EditPaymentPage({ params }: NewPaymentPageProps) {
	const { id } = await params;
	return <div>Edit Payment Page for ID: {id}</div>
}

