import type { Metadata } from 'next'

import LoginForm from '@/components/admin/LoginForm'

export const metadata: Metadata = {
  title: 'Sign in — Admin',
  robots: { index: false, follow: false },
}

/** Ported from resources/views/admin/login.blade.php. */
export default function AdminLoginPage() {
  return (
    <div className="login-body">
    <div className="login-wrap">
      <div className="brand">
        <span className="brand-logo">
          AA<span className="logo-dot"></span>
        </span>
        <p>Portfolio Admin</p>
      </div>

      <div className="login-card">
        <h1>Sign in</h1>
        <p>Manage your projects, posts and enquiries.</p>

        <LoginForm />
      </div>
    </div>
    </div>
  )
}
