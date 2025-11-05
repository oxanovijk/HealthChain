import React, { useState } from 'react';
import { recordNewData } from './HealthChainConnector'; // Pastikan path benar

const HospitalDashboard = () => {
    const [patientId, setPatientId] = useState('');
    const [medicalData, setMedicalData] = useState('');
    const [status, setStatus] = useState('');

    // --- CATATAN PENTING ---
    // Di aplikasi nyata, Anda harus:
    // 1. Mengenkripsi 'medicalData'
    // 2. Mengunggah ke IPFS (mendapatkan storagePointer)
    // 3. Menghitung Hash Kriptografi dari data terenkripsi.
    // Di sini kita hanya mensimulasikan nilai-nilai tersebut.
    const DUMMY_HASH = "0x9f86d081884c7d659a2feaa0c55ad015a3c310c1f6050b1d3d6118d00344b1c8";
    const DUMMY_POINTER = "ipfs://QmYfg33F9Xz..."; 
    // --- AKHIR CATATAN ---

    const handleSubmit = async () => {
        setStatus("Mengirim transaksi ke Blockchain...");
        
        // Asumsi patientId adalah alamat wallet pasien (e.g., dari input form)

        const result = await recordNewData(patientId, DUMMY_HASH, DUMMY_POINTER);

        if (result.success) {
            setStatus(`✅ Sukses! Data (Hash) dicatat di TX: ${result.hash}`);
        } else {
            setStatus(`❌ Gagal mencatat: ${result.error}`);
        }
    };

    return (
        <div>
            <h2>Portal Rumah Sakit: Catat Data Baru</h2>
            <input 
                placeholder="Alamat Pasien (0x...)" 
                value={patientId} 
                onChange={(e) => setPatientId(e.target.value)} 
            />
            <textarea 
                placeholder="Data Medis Mentah (Simulasi)"
                value={medicalData}
                onChange={(e) => setMedicalData(e.target.value)}
            />
            <button onClick={handleSubmit}>Catat Hash Data ke HealthChain</button>
            <p>Status: {status}</p>
        </div>
    );
};

export default HospitalDashboard;