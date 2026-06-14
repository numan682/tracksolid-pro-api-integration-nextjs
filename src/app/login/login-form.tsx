"use client";

import { useActionState } from "react";
import { AlertTriangle, Loader2, LockKeyhole, MapPinned, UserRound } from "lucide-react";
import { login, type LoginState } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);

  return (
    <form action={action} className="space-y-4">
      {state?.error ? (
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="account">Account</Label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="account"
            name="account"
            autoComplete="username"
            placeholder="Your Tracksolid account"
            className="h-10 pl-9"
            required
            autoFocus
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-10 pl-9"
            required
          />
        </div>
      </div>

      <Button type="submit" size="lg" className="live-action-button h-10 w-full" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <MapPinned className="size-4" />}
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
