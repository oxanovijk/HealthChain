import React, { useState } from 'react';
import { grantConsent, checkAccessStatus } from './HealthChainConnector'; // Pastikan path benar

const PatientConsent = () => {
    const [requesterId, setRequesterId] = useState('');
    const [accessPurpose, setAccessPurpose] = useState('Diagnosis Darurat');
    const [consentStatus, setConsentStatus] = useState('');
    const [checkResult, setCheckResult] = useState(null);

    // Pasien harus terhubung ke MetaMask untuk mendapatkan ID mereka (msg.sender)
    
    const handleGrantConsent = async () => {
        setConsentStatus("Meminta tanda tangan MetaMask untuk Izin...");
        
        // Durasi 1 jam (3600 detik)
        const duration = 3600; 
        
        const result = await grantConsent(requesterId, duration, accessPurpose);

        if (result.success) {
            setConsentStatus(`✅ Izin Berhasil Diberikan ke ${requesterId}. TX: ${result.hash}`);
        } else {
            setConsentStatus(`❌ Gagal Memberi Izin: ${result.error}`);
        }
    };

    const handleCheckAccess = async () => {
        // Untuk Check Access, Pasien dan Requester harus diisi. 
        // Anda harus tahu alamat Pasien yang terhubung (signer.getAddress() di getContract)
        // Untuk demo, kita asumsikan alamat pasien adalah requesterId (akses sendiri)
        const patientAddress = '0xYourConnectedPatientAddress'; // Dapatkan dari Ethers.js signer

        const result = await checkAccessStatus(patientAddress, requesterId);

        if (result.isAllowed) {
            setCheckResult(`✅ AKSES DIIZINKAN! Hash Data: ${result.dataHash}. Tujuan: ${result.purpose}`);
            // Di sini Anda akan menambahkan logika untuk Dekripsi Data dari StoragePointer.
        } else {
            setCheckResult(`❌ Akses DITOLAK atau Izin Sudah Kadaluarsa.`);
        }
    };

    return (
        <div>
            <h2>Portal Pasien: Manajemen Izin</h2>
            <input 
                placeholder="Alamat Rumah Sakit/Requester (0x...)" 
                value={requesterId} 
                onChange={(e) => setRequesterId(e.target.value)} 
            />
            <button onClick={handleGrantConsent}>Beri Izin Akses (1 Jam)</button>
            <p>Izin Status: {consentStatus}</p>

            <hr/>

            <h3>Tes Akses (Simulasi Akses Sendiri)</h3>
            <button onClick={handleCheckAccess}>Cek Status Akses Data</button>
            {checkResult && <p style={{marginTop: '10px'}}>Hasil Cek: {checkResult}</p>}
        </div>
    );
};

export default PatientConsent;