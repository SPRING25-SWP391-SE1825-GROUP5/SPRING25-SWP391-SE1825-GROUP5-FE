import './AppFooter.scss'

export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="container py-4 text-center">
        <p className="text-sm text-secondary-700">© {new Date().getFullYear()} EV Service. All rights reserved.</p>
      </div>
    </footer>
  )
}

