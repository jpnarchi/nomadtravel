import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Trips from './pages/Trips';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clients": Clients,
    "Trips": Trips,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};