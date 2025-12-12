import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Trips from './pages/Trips';
import SoldTrips from './pages/SoldTrips';
import SoldTripDetail from './pages/SoldTripDetail';
import Suppliers from './pages/Suppliers';
import SupplierDetail from './pages/SupplierDetail';
import Commissions from './pages/Commissions';
import ClientDetail from './pages/ClientDetail';
import TripRequestPublic from './pages/TripRequestPublic';
import TripDetail from './pages/TripDetail';
import Statistics from './pages/Statistics';
import Reviews from './pages/Reviews';
import Credentials from './pages/Credentials';
import InternalCommissions from './pages/InternalCommissions';
import InternalPayments from './pages/InternalPayments';
import AdminDashboard from './pages/AdminDashboard';
import AdminClients from './pages/AdminClients';
import AdminTrips from './pages/AdminTrips';
import AdminSoldTrips from './pages/AdminSoldTrips';
import PersonalCredentials from './pages/PersonalCredentials';
import Attendance from './pages/Attendance';
import FamTrips from './pages/FamTrips';
import IndustryFairs from './pages/IndustryFairs';
import InternalClientPayments from './pages/InternalClientPayments';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clients": Clients,
    "Trips": Trips,
    "SoldTrips": SoldTrips,
    "SoldTripDetail": SoldTripDetail,
    "Suppliers": Suppliers,
    "SupplierDetail": SupplierDetail,
    "Commissions": Commissions,
    "ClientDetail": ClientDetail,
    "TripRequestPublic": TripRequestPublic,
    "TripDetail": TripDetail,
    "Statistics": Statistics,
    "Reviews": Reviews,
    "Credentials": Credentials,
    "InternalCommissions": InternalCommissions,
    "InternalPayments": InternalPayments,
    "AdminDashboard": AdminDashboard,
    "AdminClients": AdminClients,
    "AdminTrips": AdminTrips,
    "AdminSoldTrips": AdminSoldTrips,
    "PersonalCredentials": PersonalCredentials,
    "Attendance": Attendance,
    "FamTrips": FamTrips,
    "IndustryFairs": IndustryFairs,
    "InternalClientPayments": InternalClientPayments,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};