import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in to Ntole" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-margin-mobile py-xl">
      {/* Ambient backdrop — neon halo high-up to anchor the brand */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 bg-[#0a0c0c]"
      >
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(57,255,20,0.10)_1px,transparent_1px),radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:48px_48px,32px_32px] [background-position:0_0,16px_16px]" />
        <div className="absolute inset-0 [background:radial-gradient(circle_at_50%_15%,rgba(57,255,20,0.10),transparent_60%)]" />
        <div className="absolute inset-0 map-gradient-overlay" />
      </div>

      <div className="w-full max-w-[430px]">
        <div className="mb-xl flex flex-col items-center gap-md">
          {/* Brand mark — the Ntole "N + peak" used in the favicon */}
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-container neon-glow-primary">
            <svg viewBox="0 0 24 24" className="h-9 w-9" aria-hidden>
              <path
                d="M5 14 12 5l7 9h-3l-4-5-4 5H5Zm0 1.5h14v2H5v-2Z"
                fill="#053900"
              />
            </svg>
          </div>
          <h1 className="font-display-lg text-[34px] leading-tight font-extrabold tracking-tight text-primary text-center max-w-[300px]">
            Welcome to Ntole
          </h1>
          <p className="text-center font-body-md text-body-md text-on-surface-variant max-w-[320px]">
            Hail a ride or send a package across Malawi. Sign in with your
            email and password.
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
