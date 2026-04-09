import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export default async function AppPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin')
  }
  
  redirect('/admin')
}
