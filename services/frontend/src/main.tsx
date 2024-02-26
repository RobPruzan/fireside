import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { edenTreaty } from "@elysiajs/eden";
import { z } from "zod";
import type { App } from "@fireside/backend";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useNavigate } from "@tanstack/react-router";
import darkAsset from "./assets/dark.png";
import lightAsset from "./assets/light.png";
import logo from "./assets/bonfire.png";

import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "./hooks/useTheme";
import Landing from "./components/Landing";
import Login from "./components/Login";
import Register from "./components/Register";
import { Button } from "./components/ui/button";

const envSchema = z.object(
  {
    VITE_API_URL: z.string(),
  },
  {
    errorMap: (error) => ({
      message: `Missing environment variable ${error.path.join(".")}`,
    }),
  }
);

envSchema.parse({
  VITE_API_URL: import.meta.env.VITE_API_URL,
});

declare global {
  interface ImportMetaEnv extends z.infer<typeof envSchema> {}
}

const client = edenTreaty<App>(import.meta.env.VITE_API_URL);

function RootComponent() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate({
    from: "/",
  });

  const toggleTheme = () => {
    setTheme(theme.value === "light" ? "dark" : "light");
  };

  const handleLoginClick = () => {
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen  flex flex-col items-start w-screen justify-start">
      <div className="flex justify-between items-center mx-auto w-full px-10 pt-5">
        <Link to="/" className="flex items-center">
          <img src={logo} alt="Logo" className="h-8 w-8 mr-2" />
          <span className={`text-xl`}>Fireside</span>
        </Link>
        <div className="flex items-center">
          <Button variant={"ghost"} onClick={toggleTheme} className="mr-3">
            <img
              src={theme.value === "light" ? lightAsset : darkAsset}
              alt="Theme toggle"
              className="h-6 w-6"
            />
          </Button>
          <div className="mx-3 h-6 w-px bg-foreground"></div>
          <Button
            variant={"ghost"}
            onClick={handleLoginClick}
            className={`text-sm mr-3 `}
          >
            Log in
          </Button>
          <Button
            variant={"ghost"}
            onClick={() => {
              navigate({ to: "/register" });
            }}
            className={`px-4 py-2 rounded`}
          >
            Get Started
          </Button>
        </div>
      </div>
      <Outlet />
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </div>
  );
}

const rootRoute = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  component: RootComponent,
});

const landingPageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Landing,
});

const registerPageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: Register,
});

const loginPageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: Login,
});

const queryClient = new QueryClient();

const routeTree = rootRoute.addChildren([
  landingPageRoute,
  registerPageRoute,
  loginPageRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  context: {
    queryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
