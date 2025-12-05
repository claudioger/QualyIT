'use client';

import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">QualyIT</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crear nueva organización
        </p>
      </div>
      <SignUp
        appearance={{
          elements: {
            rootBox: 'w-full',
            card: 'shadow-lg border',
            headerTitle: 'text-xl font-semibold',
            headerSubtitle: 'text-muted-foreground',
            formButtonPrimary:
              'bg-primary hover:bg-primary/90 text-primary-foreground',
            footerActionLink: 'text-primary hover:text-primary/90',
          },
        }}
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/onboarding"
      />
    </div>
  );
}
