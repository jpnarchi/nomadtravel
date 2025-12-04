import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Trips from './pages/Trips';
import SoldTrips from './pages/SoldTrips';
import SoldTripDetail from './pages/SoldTripDetail';
import Suppliers from './pages/Suppliers';
import SupplierDetail from './pages/SupplierDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clients": Clients,
    "Trips": Trips,
    "SoldTrips": SoldTrips,
    "SoldTripDetail": SoldTripDetail,
    "Suppliers": Suppliers,
    "SupplierDetail": SupplierDetail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};