import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="max-w-md text-center">
        <div className="font-display text-gold text-sm tracking-[0.3em]">404</div>
        <h1 className="font-serif text-5xl text-foreground mt-4">Страница не найдена</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Похоже, здесь пусто. Вернитесь на главную.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block border border-gold px-8 py-3 font-display text-sm text-gold hover:bg-gold hover:text-black transition-colors"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-3xl text-foreground">Что-то пошло не так</h1>
        <p className="mt-3 text-sm text-muted-foreground">Попробуйте обновить страницу.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="border border-gold px-6 py-2 font-display text-sm text-gold hover:bg-gold hover:text-black transition-colors"
          >
            Повторить
          </button>
          <a href="/" className="border border-border px-6 py-2 font-display text-sm text-foreground hover:border-gold transition-colors">
            На главную
          </a>
        </div>
      </div>
    </div>
  );
}

const SCISSORS_FAVICON =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23C8A96E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='6' cy='6' r='3'/><path d='M8.12 8.12 12 12'/><path d='M20 4 8.12 15.88'/><circle cx='6' cy='18' r='3'/><path d='M14.8 14.8 20 20'/></svg>";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BLADE & STYLE — Барбершоп премиум-класса · Онлайн-запись" },
      { name: "description", content: "Мужской барбершоп BLADE & STYLE. Классические стрижки, оформление бороды, королевское бритьё. Онлайн-запись за минуту." },
      { property: "og:title", content: "BLADE & STYLE — Барбершоп" },
      { property: "og:description", content: "Твой стиль — наше мастерство. Онлайн-запись 24/7." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: SCISSORS_FAVICON, type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Inter:wght@300;400;500;600&family=Bebas+Neue&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
