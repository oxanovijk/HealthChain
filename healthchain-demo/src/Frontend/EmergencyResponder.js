import React, { useState } from 'react';
import { ethers } from 'ethers';
import { getContract } from './HealthChainConnector'; // Memastikan koneksi
// Fungsi emergencyOverride harus ditambahkan ke HealthChainConnector.js

const EmergencyResponder = () => {
    const [patientId, setPatientId] = useState('');
    const [doctorAddress, setDoctorAddress] = useState(''); // Alamat Dokter yang sedang terhubung
    const [providedNIK, setProvidedNIK] = useState(''); // Input NIK dari form
    const [reason, setReason] = useState('');
    const [status, setStatus] = useState('');

    const DUMMY_NIK_HASH = ethers.id(providedNIK); // Gunakan ethers.id sebagai simulasi hash NIK

    const handleEmergencyOverride = async () => {
        setStatus("Memicu Protokol Darurat...");
        
        try {
            // Asumsi Dokter sudah terhubung via MetaMask (signer)
            const contract = await getContract();
            const doctorSignerAddress = await contract.signer.getAddress(); // Alamat Dokter saat ini
            
            // Panggilan Smart Contract: emergencyOverride
            const tx = await contract.emergencyOverride(
                ethers.getAddress(patientId),
                doctorSignerAddress, // Alamat Dokter yang memicu
                DUMMY_NIK_HASH, // NIK yang di-hash
                reason
            );

            await tx.wait();
            setStatus(`✅ AKSES DARURAT BERHASIL. Izin 24 jam diberikan. TX: ${tx.hash}`);

        } catch (error) {
            console.error("Gagal mengaktifkan Protokol Darurat:", error);
            setStatus(`❌ Gagal: ${error.reason || error.message}`);
        }
    };

    return (
        <div style={{ padding: '20px', border: '1px solid red' }}>
            <h2>⚠️ Protokol Akses Darurat (Dokter)</h2>
            <p>Digunakan saat pasien tidak responsif. Membutuhkan verifikasi kredensial Dokter.</p>
            <input 
                placeholder="ID Wallet Pasien (0x...)" 
                value={patientId} 
                onChange={(e) => setPatientId(e.target.value)} 
            />
            <input 
                placeholder="Masukkan NIK/Kredensial Darurat" 
                value={providedNIK} 
                onChange={(e) => setProvidedNIK(e.target.value)} 
            />
            <textarea 
                placeholder="Alasan Kedaruratan (Wajib dicatat)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
            />
            <button onClick={handleEmergencyOverride} style={{ backgroundColor: 'red', color: 'white' }}>
                Aktivasi Override Darurat
            </button>
            <p>Status: {status}</p>
        </div>
    );
};

export default EmergencyResponder;