import OnboardingForm from './onboarding-form'
import { AuthLayout } from '@/components/auth/auth-layout'

export function OnboardingPage() {
  return (
    <AuthLayout subtitle="Almost there. Set up your identity.">
      <OnboardingForm />
    </AuthLayout>
  )
}
