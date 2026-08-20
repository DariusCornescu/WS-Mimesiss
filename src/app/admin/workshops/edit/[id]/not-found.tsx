export default function NotFound() {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Workshop Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The workshop you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <a
          href="/admin/workshops"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
        >
          Back to Workshops
        </a>
      </div>
    </div>
  )
}
