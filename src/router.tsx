import Index from "./pages/Index";
import CultivationPage from "./pages/CultivationPage";
import DaodejingPage from "./pages/DaodejingPage";
import ProfilePage from "./pages/ProfilePage";
import ApiDocsPage from "./pages/ApiDocsPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

export const routers = [
    {
      path: "/",
      name: 'home',
      element: <Index />,
    },
    {
      path: "/cultivate",
      name: 'cultivate',
      element: <CultivationPage />,
    },
    {
      path: "/daodejing/:chapter?",
      name: 'daodejing',
      element: <DaodejingPage />,
    },
    {
      path: "/profile",
      name: 'profile',
      element: <ProfilePage />,
    },
    {
      path: "/api-docs",
      name: 'api-docs',
      element: <ApiDocsPage />,
    },
    {
      path: "/admin",
      name: 'admin',
      element: <AdminPage />,
    },
    /* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */
    {
      path: "*",
      name: '404',
      element: <NotFound />,
    },
];

declare global {
  interface Window {
    __routers__: typeof routers;
  }
}

window.__routers__ = routers;