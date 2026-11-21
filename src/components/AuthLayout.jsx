
import '../styles/auth.css'

export default function AuthLayout({ children, page = 'login' }) {
  return (
    <main className="auth-shell">
      <section className="auth-visual">
        <div className="visual-glow glow-one" />
        <div className="visual-glow glow-two" />

        <a className="brand" href="/">
          <span className="brand-icon">
            <span>+</span>
          </span>
          <span>
            <strong>MediStock</strong>
            <small>INVENTORY INTELLIGENCE</small>
          </span>
        </a>

        <div className="visual-content">
          <span className="eyebrow">
            <span className="status-dot" />
            SMARTER HEALTHCARE OPERATIONS
          </span>

          <h1>
            Smarter inventory.
            <br />
            <span>Safer healthcare.</span>
          </h1>

          <p>
            Keep essential medicines in stock, stay ahead of expiry
            dates, and give your team the confidence to deliver better care.
          </p>

          <div className="visual-card">
            <div className="visual-card-top">
              <div>
                <small>INVENTORY OVERVIEW</small>
                <h3>Your stock. Under control.</h3>
              </div>
              <span className="mini-pulse">↗</span>
            </div>

            <div className="stock-bars">
              <div><span style={{ height: '48%' }} /></div>
              <div><span style={{ height: '72%' }} /></div>
              <div><span style={{ height: '57%' }} /></div>
              <div><span style={{ height: '88%' }} /></div>
              <div><span style={{ height: '66%' }} /></div>
              <div><span style={{ height: '96%' }} /></div>
              <div><span style={{ height: '76%' }} /></div>
              <div><span style={{ height: '84%' }} /></div>
            </div>

            <div className="visual-card-bottom">
              <span><i className="legend-dot" /> Stock visibility</span>
              <strong>Care starts here.</strong>
            </div>
          </div>
        </div>

        <div className="visual-footer">
          <span>Designed for better medicine management.</span>
          <span>MEDISTOCK © 2026</span>
        </div>
      </section>

      <section className="auth-panel">
        <div className="mobile-brand brand">
          <span className="brand-icon"><span>+</span></span>
          <span>
            <strong>MediStock</strong>
            <small>INVENTORY INTELLIGENCE</small>
          </span>
        </div>

        <div className="auth-content">
          {children}
        </div>

        <footer className="auth-footer">
          <span>♧</span> Secure access for healthcare inventory management
        </footer>
      </section>
    </main>
  )
}
