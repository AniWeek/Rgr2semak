import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { TestInfo } from "./pages/TestInfo";
import { TestTaking } from "./pages/TestTaking";
import { TestResults } from "./pages/TestResults";
import { CreateTest } from "./pages/CreateTest";
import { Statistics } from "./pages/Statistics";
import { AdminPanel } from "./pages/AdminPanel";
import { UserStatistics } from "./pages/UserStatistics";
import { TestStatistics } from "./pages/TestStatistics";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
    { path: "/login", element: <Login /> },
    {
        path: "/",
        element: <Layout />,
        children: [
            { index: true, element: <ProtectedRoute allowedRoles={['USER', 'TESTER', 'ADMIN']}><Dashboard /></ProtectedRoute> },
            { path: "my-statistics", element: <ProtectedRoute allowedRoles={['USER', 'TESTER', 'ADMIN']}><UserStatistics /></ProtectedRoute> },
            { path: "test/:id/info", element: <ProtectedRoute allowedRoles={['USER', 'TESTER', 'ADMIN']}><TestInfo /></ProtectedRoute> },
            { path: "test/:id/take", element: <ProtectedRoute allowedRoles={['USER', 'TESTER', 'ADMIN']}><TestTaking /></ProtectedRoute> },
            { path: "results/:id", element: <ProtectedRoute allowedRoles={['USER', 'TESTER', 'ADMIN']}><TestResults /></ProtectedRoute> },
            { path: "create-test", element: <ProtectedRoute allowedRoles={['TESTER', 'ADMIN']}><CreateTest /></ProtectedRoute> },
            { path: "edit-test/:id", element: <ProtectedRoute allowedRoles={['TESTER', 'ADMIN']}><CreateTest /></ProtectedRoute> },
            { path: "statistics", element: <ProtectedRoute allowedRoles={['TESTER', 'ADMIN']}><Statistics /></ProtectedRoute> },
            { path: "test-statistics/:id", element: <ProtectedRoute allowedRoles={['TESTER', 'ADMIN']}><TestStatistics /></ProtectedRoute> },
            { path: "admin", element: <ProtectedRoute allowedRoles={['ADMIN']}><AdminPanel /></ProtectedRoute> },
        ],
    },
]);