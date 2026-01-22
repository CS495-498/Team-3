import { Suspense } from 'react'
import ResetCodeClient from './ResetCodeClient'

export const dynamic = 'force-dynamic'

export default function ResetCodePage() {
  return (
    <Suspense fallback={null}>
      <ResetCodeClient />
    </Suspense>
  )
}
