import { Outlet } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'

export default function DashboardLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

