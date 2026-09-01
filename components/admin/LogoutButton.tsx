import { logout } from '@/app/actions/auth'

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button type="submit">
        <i className="fas fa-power-off" aria-hidden="true"></i> Log out
      </button>
    </form>
  )
}
