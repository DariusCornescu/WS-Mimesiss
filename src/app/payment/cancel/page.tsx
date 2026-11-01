import PaymentResult from '@/components/payments/PaymentResult';
import PaymentShell from '@/components/payments/PaymentShell';

export default function PaymentCancelPage() {
  return (
    <PaymentShell
      eyebrow="ASMM · STAREA PLĂȚII"
      title="Plata a fost oprită"
      description="Poți relua selecția biletului oricând, fără să pierzi accesul la cont."
    >
      <PaymentResult
        variant="cancelled"
        title="Nu s-a perceput nicio taxă"
        description="Procesul de plată a fost anulat înainte de confirmare."
        detail="Poți încerca din nou când ești pregătit sau poți reveni în contul tău."
        actions={[
          { href: '/payment', label: 'Încearcă din nou' },
          { href: '/dashboard', label: 'Înapoi la cont', variant: 'secondary' },
        ]}
      />
    </PaymentShell>
  );
}
