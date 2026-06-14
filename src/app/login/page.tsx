import type { Metadata } from "next";
import { Layers, Radar, Route, ShieldCheck } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in · FleetView",
};

const highlights = [
  { icon: Radar, title: "Live tracking", text: "Real-time positions refreshed automatically across your whole fleet." },
  { icon: Route, title: "Trip playback", text: "Replay any device's route with speed, distance and stops." },
  { icon: ShieldCheck, title: "Geofencing", text: "Draw circular or polygon fences right on the map." },
];

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-500 p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-white/15 backdrop-blur">
            <Layers className="size-5" />
          </div>
          <div>
            <div className="font-heading text-lg font-semibold">FleetView</div>
            <div className="text-xs text-white/70">Tracksolid Pro command center</div>
          </div>
        </div>

        <div className="space-y-6">
          <h1 className="max-w-md font-heading text-3xl leading-tight font-semibold">
            Every vehicle, every route, in one fast live console.
          </h1>
          <ul className="space-y-4">
            {highlights.map((item) => (
              <li key={item.title} className="flex items-start gap-3">
                <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-white/15">
                  <item.icon className="size-4" />
                </div>
                <div>
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-white/75">{item.text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-xs text-white/60">Secured with encrypted sessions · Tracksolid Open API</div>
      </section>

      <section className="grid place-items-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="brand-mark">
                <Layers className="size-4" />
              </div>
              <span className="font-heading text-lg font-semibold">FleetView</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-heading text-2xl font-semibold">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in with your Tracksolid account to access the fleet.</p>
          </div>

          <LoginForm />

          <p className="text-center text-xs text-muted-foreground">
            Your credentials are verified directly against Tracksolid and never stored in plain text.
          </p>
        </div>
      </section>
    </main>
  );
}
