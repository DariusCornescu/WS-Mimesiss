interface FormMessageProps {
  message: string;
  type: 'success' | 'error';
}

export default function FormMessage({ message, type }: FormMessageProps) {
  const baseClasses = "px-4 py-3 rounded-md text-sm";
  const typeClasses = type === 'success'
    ? "bg-green-50 border border-green-200 text-green-700"
    : "bg-destructive/10 border border-destructive/20 text-destructive";

  return (
    <div className={`${baseClasses} ${typeClasses}`}>
      {message}
    </div>
  );
}
