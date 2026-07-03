import { DashboardShell } from '../components/layout/DashboardShell'
import { supabase } from '../lib/supabase'
import { PremedDashboard } from '../../premed/src/ui/PremedDashboard'

// "Real profile mode" operates on this fixed user_id rather than the actual
// logged-in session's own id — a deliberate session-7 shortcut (see
// docs/handoffs/2026-07-03-premed-session-7.md). RLS is still fully in
// effect, so real-mode reads/writes only succeed while logged in as the
// account this id belongs to (crm2263@gmail.com in this environment).
// Deriving it from useAuth()'s session.user.id instead is deferred to the
// auth-wiring session.
const DEV_USER_ID = 'f022dd8c-3d18-4b78-b4f3-511b61022207'

export function PremedPage() {
  return (
    <DashboardShell>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Premed</h1>
      <PremedDashboard supabase={supabase} devUserId={DEV_USER_ID} />
    </DashboardShell>
  )
}
