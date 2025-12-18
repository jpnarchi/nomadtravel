import AdminClients from './pages/AdminClients';
import AdminDashboard from './pages/AdminDashboard';
import AdminSoldTrips from './pages/AdminSoldTrips';
import AdminTrips from './pages/AdminTrips';
import Attendance from './pages/Attendance';
import ClientDetail from './pages/ClientDetail';
import Clients from './pages/Clients';
import Commissions from './pages/Commissions';
import Credentials from './pages/Credentials';
import Dashboard from './pages/Dashboard';
import FamTrips from './pages/FamTrips';
import Home from './pages/Home';
import IndustryFairs from './pages/IndustryFairs';
import InternalClientPayments from './pages/InternalClientPayments';
import InternalCommissions from './pages/InternalCommissions';
import InternalPayments from './pages/InternalPayments';
import PersonalCredentials from './pages/PersonalCredentials';
import Reviews from './pages/Reviews';
import SoldTripDetail from './pages/SoldTripDetail';
import SoldTrips from './pages/SoldTrips';
import Statistics from './pages/Statistics';
import SupplierDetail from './pages/SupplierDetail';
import Suppliers from './pages/Suppliers';
import TripDetail from './pages/TripDetail';
import TripRequestPublic from './pages/TripRequestPublic';
import Trips from './pages/Trips';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminClients": AdminClients,
    "AdminDashboard": AdminDashboard,
    "AdminSoldTrips": AdminSoldTrips,
    "AdminTrips": AdminTrips,
    "Attendance": Attendance,
    "ClientDetail": ClientDetail,
    "Clients": Clients,
    "Commissions": Commissions,
    "Credentials": Credentials,
    "Dashboard": Dashboard,
    "FamTrips": FamTrips,
    "Home": Home,
    "IndustryFairs": IndustryFairs,
    "InternalClientPayments": InternalClientPayments,
    "InternalCommissions": InternalCommissions,
    "InternalPayments": InternalPayments,
    "PersonalCredentials": PersonalCredentials,
    "Reviews": Reviews,
    "SoldTripDetail": SoldTripDetail,
    "SoldTrips": SoldTrips,
    "Statistics": Statistics,
    "SupplierDetail": SupplierDetail,
    "Suppliers": Suppliers,
    "TripDetail": TripDetail,
    "TripRequestPublic": TripRequestPublic,
    "Trips": Trips,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};