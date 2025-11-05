import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Menggunakan Provider Ethers.js dasar untuk membaca data event
const SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY'; // Ganti dengan URL RPC Anda
const CONTRACT_ADDRESS = "0xYourDeployedHealthChainContractAddress"; 
const CONTRACT_ABI = [
    // Pastikan ABI Anda memiliki event-event ini
    "event RecordAdded(bytes32 indexed dataHash, address indexed patientId, string storagePointer)",
    "event ConsentGranted(address indexed patientId, address indexed requesterId, uint256 expirationTime)",
    "event EmergencyOverride(address indexed doctorAddress, bytes32 indexed recordHash, string reason)",
];


const AuditLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            // Menggunakan Provider standar (read-only)
            const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

            // Mendapatkan filter untuk semua Event log dari Smart Contract
            const filter = {
                address: CONTRACT_ADDRESS,
                topics: [
                    // Ini akan mengambil log untuk semua event yang didefinisikan
                    contract.interface.getEventTopic('RecordAdded'),
                    contract.interface.getEventTopic('ConsentGranted'),
                    contract.interface.getEventTopic('EmergencyOverride'),
                ],
                // Cari log dari block terbaru hingga 100 block ke belakang (contoh)
                fromBlock: await provider.getBlockNumber() - 100, 
                toBlock: 'latest'
            };

            const events = await provider.getLogs(filter);
            
            // Decode data log menjadi format yang dapat dibaca
            const parsedLogs = events.map(log => {
                const parsed = contract.interface.parseLog(log);
                return {
                    name: parsed.name,
                    args: JSON.stringify(parsed.args),
                    transactionHash: log.transactionHash
                };
            });

            setLogs(parsedLogs.reverse()); // Tampilkan yang terbaru di atas

        } catch (error) {
            console.error("Gagal mengambil log audit:", error);
            setLogs([{ name: "ERROR", args: error.message }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f0f0f0' }}>
            <h2>🔍 Dasbor Auditor: Jejak Akses (On-Chain)</h2>
            <button onClick={fetchAuditLogs} disabled={loading}>
                {loading ? 'Memuat...' : 'Refresh Log Audit'}
            </button>
            <table style={{ width: '100%', marginTop: '15px', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#ccc' }}>
                        <th style={{ border: '1px solid #aaa', padding: '8px' }}>Event Tipe</th>
                        <th style={{ border: '1px solid #aaa', padding: '8px' }}>Detail Args</th>
                        <th style={{ border: '1px solid #aaa', padding: '8px' }}>Transaction Hash</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.length > 0 ? logs.map((log, index) => (
                        <tr key={index}>
                            <td style={{ border: '1px solid #aaa', padding: '8px' }}>{log.name}</td>
                            <td style={{ border: '1px solid #aaa', padding: '8px', fontSize: '10px' }}>{log.args}</td>
                            <td style={{ border: '1px solid #aaa', padding: '8px', fontSize: '10px' }}>{log.transactionHash.substring(0, 10)}...</td>
                        </tr>
                    )) : <tr><td colSpan="3">Tidak ada log transaksi ditemukan.</td></tr>}
                </tbody>
            </table>
        </div>
    );
};

export default AuditLogViewer;