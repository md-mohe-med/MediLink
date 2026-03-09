import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DarkModeProvider } from './contexts/DarkModeContext';
import Login from './Components/Auth/Login/login';
import Register from './Components/Auth/Register/register';
import ProtectedRoute from './Components/ProtectedRoute';
import Dashboard from './Components/Pages/Admin/Dashbaord/dashboard';
import AdminUsers from './Components/Pages/Admin/users/users';
import AdminSettings from './Components/Pages/Admin/settings/settings';
import UserProfileDetails from './Components/Pages/Admin/user-id/user-id';
import PatientDashboard from './Components/Pages/patient/dashboard/dashboard';
import PatientSettings from './Components/Pages/patient/settings/settings';
import PatientMessages from './Components/Pages/patient/messages/messages';
import PatientAppointments from './Components/Pages/patient/appointments/appointments';
import PatientMedicalRecords from './Components/Pages/patient/records/records';
import DoctorDashboard from './Components/Pages/Doctor/dashboard/dashboard';
import DoctorScanQr from './Components/Pages/Doctor/scan-qr/scan-qr-code';
import DoctorPatientProfile from './Components/Pages/Doctor/patient/patientprofile';
import DoctorMessages from './Components/Pages/Doctor/messages/messages';
import DoctorSettings from './Components/Pages/Doctor/settings/settings';
import LabDashboard from './Components/Pages/Lab/dashboard/dashboard';
import LabUpload from './Components/Pages/Lab/upload/uploaddocument';
import LabSettings from './Components/Pages/Lab/settings/settings';
import HomePage from './Components/Pages/home-page';

function App() {
  return (
    <DarkModeProvider>
      <BrowserRouter>
        <Routes>
        {/* Public home / marketing page */}
        <Route path="/" element={<HomePage />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin Routes — protected */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRole="admin">
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute allowedRole="admin">
            <AdminUsers />
          </ProtectedRoute>
        } />
        <Route path="/admin/users/:userId" element={
          <ProtectedRoute allowedRole="admin">
            <UserProfileDetails />
          </ProtectedRoute>
        } />
        <Route path="/admin/settings" element={
          <ProtectedRoute allowedRole="admin">
            <AdminSettings />
          </ProtectedRoute>
        } />

        {/* Patient Routes — protected */}
        <Route path="/patient/dashboard" element={
          <ProtectedRoute allowedRole="patient">
            <PatientDashboard />
          </ProtectedRoute>
        } />
        <Route path="/patient/settings" element={
          <ProtectedRoute allowedRole="patient">
            <PatientSettings />
          </ProtectedRoute>
        } />
        <Route path="/patient/messages" element={
          <ProtectedRoute allowedRole="patient">
            <PatientMessages />
          </ProtectedRoute>
        } />
        <Route path="/patient/appointments" element={
          <ProtectedRoute allowedRole="patient">
            <PatientAppointments />
          </ProtectedRoute>
        } />
        <Route path="/patient/records" element={
          <ProtectedRoute allowedRole="patient">
            <PatientMedicalRecords />
          </ProtectedRoute>
        } />

        {/* Doctor Routes — protected */}
        <Route path="/doctor/dashboard" element={
          <ProtectedRoute allowedRole="doctor">
            <DoctorDashboard />
          </ProtectedRoute>
        } />
        <Route path="/doctor/scan-qr" element={
          <ProtectedRoute allowedRole="doctor">
            <DoctorScanQr />
          </ProtectedRoute>
        } />
        <Route path="/doctor/patient/:id" element={
          <ProtectedRoute allowedRole="doctor">
            <DoctorPatientProfile />
          </ProtectedRoute>
        } />
        <Route path="/doctor/messages" element={
          <ProtectedRoute allowedRole="doctor">
            <DoctorMessages />
          </ProtectedRoute>
        } />
        <Route path="/doctor/settings" element={
          <ProtectedRoute allowedRole="doctor">
            <DoctorSettings />
          </ProtectedRoute>
        } />

        {/* Lab Routes — protected */}
        <Route path="/lab/dashboard" element={
          <ProtectedRoute allowedRole="lab">
            <LabDashboard />
          </ProtectedRoute>
        } />
        <Route path="/lab/upload" element={
          <ProtectedRoute allowedRole="lab">
            <LabUpload />
          </ProtectedRoute>
        } />
        <Route path="/lab/settings" element={
          <ProtectedRoute allowedRole="lab">
            <LabSettings />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
  
      </Routes>
      </BrowserRouter>
    </DarkModeProvider>
  );
}

export default App;
