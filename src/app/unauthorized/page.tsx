import Link from 'next/link'
import { FaShieldAlt, FaHome, FaTachometerAlt } from 'react-icons/fa'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4">
      <div className="max-w-md mx-auto w-full">
        {/* Main Error Card */}
        <div className="mimesiss-card p-8 text-center">
          <div className="mb-6">
            <FaShieldAlt className="mx-auto h-20 w-20 text-destructive mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Acces Refuzat
            </h1>
            <p className="text-muted-foreground">
              Nu aveți permisiunea de a accesa această pagină.
            </p>
          </div>

          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Link
                href="/dashboard"
                className="w-full inline-flex justify-center items-center px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FaTachometerAlt className="h-4 w-4 mr-2" />
                Mergi la Dashboard
              </Link>
              
              <Link
                href="/"
                className="w-full inline-flex justify-center items-center px-6 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <FaHome className="h-4 w-4 mr-2" />
                Înapoi la Pagina Principală
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
