import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathname = path.join("/");

  if (pathname.endsWith(".js")) {
    return new NextResponse(
      `
        (async function () {
          try {
            const registrations = navigator.serviceWorker ? await navigator.serviceWorker.getRegistrations() : [];
            await Promise.all(registrations.map((registration) => registration.unregister()));
            if (window.caches) {
              const keys = await caches.keys();
              await Promise.all(keys.map((key) => caches.delete(key)));
            }
          } catch (error) {}
          window.location.replace("/");
        })();
      `,
      {
        headers: {
          "Content-Type": "application/javascript; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      },
    );
  }

  return NextResponse.redirect(new URL("/", request.url));
}
