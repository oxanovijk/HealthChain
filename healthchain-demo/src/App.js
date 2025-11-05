import React from 'react';
import HospitalDashboard from './HospitalDashboard'; // Kode sebelumnya
import PatientConsent from './PatientConsent';     // Kode sebelumnya
import EmergencyResponder from './EmergencyResponder'; // Kode baru
import AuditLogViewer from './AuditLogViewer';     // Kode baru
import './App.css'; 

function App() {
  return (
    <div className="App" style={{ fontFamily: 'Arial' }}>
      <h1>HealthChain Prototipe DApp</h1>
      <p>Pastikan MetaMask terhubung ke Sepolia Testnet dan Anda memiliki ETH Testnet!</p>
      <hr/>

      {/* Simulasi Peran 1: Rumah Sakit & Dokter */}
      <HospitalDashboard />
      <div style={{ height: '20px' }}></div>
      <EmergencyResponder />

      <hr style={{ marginTop: '30px', marginBottom: '30px' }}/>

      {/* Simulasi Peran 2: Pasien */}
      <PatientConsent />

      <hr style={{ marginTop: '30px', marginBottom: '30px' }}/>

      {/* Simulasi Peran 3: Auditor */}
      <AuditLogViewer />
    </div>
  );
}

export default App;