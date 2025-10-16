import { useEffect, useState } from "react";
import { Book, Sunset, Trees, Key, FilePlus, Settings, LogOut} from "lucide-react";

import ArxLogo from '@/assets/logo.svg'
import { NavBarComponent } from '@/components/NavBar/NavBarComponent'
import { useUserContext } from '@/hooks/useUserContext';
import { useNotesContext } from "@/hooks/useNotesContext";
import useNotes from "@/hooks/useNotes";
import { useNavigate } from "react-router-dom";
import DisappearingAlert from "../DisappearingAlert";


const NavBar = () => {
    const navigate = useNavigate();
    const { user, logout } = useUserContext();
    const { createEncryptedNote, error } = useNotes();
    const [notesNavBar, setNotesNavBar] = useState({ title: "Notes", url: "/notes", });

    const handleNewNoteCreation = async () => {
        const status = await createEncryptedNote({title: 'New Note', body: ''}, 'encryption key NavBar.jsx');
        if (status.success) {
            navigate(`/notes/${status.data.id}`);
        } else {
            // TODO: display Alert with error message
        }
    }

    useEffect(() => {
        if (user) {
            setNotesNavBar(c => ({...c, items: [
                    {
                        title: "New Note",
                        icon: <FilePlus className="size-5 shrink-0" />,
                        url: "/notes/new",
                        isButton: true,
                        function: handleNewNoteCreation,
                    },
                    {
                        title: "Notes List",
                        icon: <Book className="size-5 shrink-0" />,
                        url: "/notes",
                    },
                ],
            }))
        } else {
            setNotesNavBar(({items, ...c}) => c) // Remove `items` from notesNavBar
        }
    }, [user]);


    const logo = {
        url: "/",
        src: ArxLogo,
        alt: "logo",
        size: 10
    }

    const menu = [
        {
            title: "Home",
            url: "/"
        },
        notesNavBar,
        {
            title: "Source Code",
            url: "https://github.com/Marcin-Konarski/Arx",
        },
    ]

    const authAnonymous = [
        {
            title: "Login",
            url: "/login",
            variant: "default"
        },
        {
            title: "Sign Up",
            url: "/signup",
            variant: "outline"
        },
    ];

    const authUser = user && [
        {
            title: user.username,
            url: "/profile",
            items: [
                {
                    title: "Settings",
                    titleMobile: user.username,
                    icon: <Settings className="size-5 shrink-0" />,
                    url: "/profile",
                    variant: "default"
                },
                {
                    title: "Logout",
                    titleMobile: "Logout",
                    icon: <LogOut className="size-5 shrink-0" />,
                    url: "/login",
                    isButton: true,
                    function: logout,
                    variant: "outline"
                },
            ],
        }
    ];

    return (<>
        {error && <div className='absolute z-20'>
            <DisappearingAlert title="Error" time="5s" variant="destructive" color="red-500">{error}</DisappearingAlert>
        </div>}
        <NavBarComponent logo={logo} menu={menu} authButtons={authUser || authAnonymous} />
    </>);
}

export default NavBar