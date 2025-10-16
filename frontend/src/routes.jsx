import { createBrowserRouter } from "react-router";
import Layout from "@/pages/Layout";
import Home from '@/pages/Home'
import Notes from '@/pages/Notes'
import Profile from '@/pages/Profile'
import Login from '@/pages/Login'
import Register from "@/pages/Register";
import EmailVerification from "@/pages/EmailVerification";
import PageNotFound from "@/pages/PageNotFound";
import Editor from "@/pages/Editor";
import Blank from "@/pages/Blank";
import EditorNew from "./pages/EditorNew";


const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <PageNotFound />,
    children: [
        { index: true, Component: Home },
        { path: "profile", Component: Profile },
        { path: "login", Component: Login },
        { path: "signup", Component: Register },
        { path: "verify", Component: EmailVerification},
        { path: "notes", Component: Notes, errorElement: <Blank />, children:
          [
            { index: true, Component: Blank},
            { path: ":noteId", Component: Editor},
            { path: "new", Component: EditorNew},
          ]
        },
    ]
  },
]);

export default router