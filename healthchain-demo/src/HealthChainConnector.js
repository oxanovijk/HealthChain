import { ethers } from 'ethers';

// --- KONFIGURASI KONTRAK ANDA ---
const CONTRACT_ADDRESS = "0xYourDeployedHealthChainContractAddress"; 

// ABI harus didapatkan dari hasil kompilasi HealthChain.sol
// Ini adalah placeholder (Ganti dengan ABI Anda!)
const CONTRACT_ABI = [
    "function addRecordMetadata(address _patientId, bytes32 _newDataHash, string memory _storagePointer) public",
    "function grantAccessConsent(address _requesterId, uint256 _durationSeconds, string memory _purpose) public",
    "function checkAccess(address _patientId, address _requesterId) public view returns (bool, bytes32, string memory, string memory)",
    // Tambahkan fungsi lain sesuai kebutuhan
];

/**
 * @dev Menginisialisasi koneksi ke MetaMask (Provider) dan Kontrak.
 */
export const getContract = async () => {
    if (!window.ethereum) {
        throw new Error("MetaMask tidak terdeteksi.");
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();

    const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    return contractInstance;
};

// --- FUNGSI A: RUMAH SAKIT MENCATAT DATA BARU ---
export const recordNewData = async (patientId, dataHash, storagePointer) => {
    const contract = await getContract();
    
    // Pastikan ID Pasien dalam format Checksum
    const patientAddress = ethers.getAddress(patientId);

    try {
        // Panggilan Smart Contract: addRecordMetadata
        const tx = await contract.addRecordMetadata(
            patientAddress, 
            dataHash, 
            storagePointer
        );
        await tx.wait(); 
        return { success: true, hash: tx.hash };
        
    } catch (error) {
        console.error("Gagal mencatat data baru:", error);
        return { success: false, error: error.message };
    }
};

// --- FUNGSI B: PASIEN MEMBERI CONSENT ---
export const grantConsent = async (requesterId, durationSeconds, purpose) => {
    const contract = await getContract();
    
    // Requester ID (Rumah Sakit/Farmasi) juga harus Checksum
    const requesterAddress = ethers.getAddress(requesterId);

    try {
        // Panggilan Smart Contract: grantAccessConsent
        const tx = await contract.grantAccessConsent(
            requesterAddress, 
            durationSeconds, 
            purpose
        );
        await tx.wait(); 
        return { success: true, hash: tx.hash };
        
    } catch (error) {
        console.error("Gagal memberikan persetujuan:", error);
        return { success: false, error: error.message };
    }
};

// --- FUNGSI C: MEMERIKSA AKSES (VIEW FUNCTION) ---
export const checkAccessStatus = async (patientId, requesterId) => {
    // Untuk fungsi view/read, kita bisa menggunakan Provider (tidak perlu signer)
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    try {
        // Panggilan Smart Contract: checkAccess (view function)
        const result = await contract.checkAccess(patientId, requesterId);

        return {
            isAllowed: result[0],
            dataHash: result[1],
            storagePointer: result[2],
            purpose: result[3]
        };
    } catch (error) {
        console.error("Gagal memeriksa akses:", error);
        return { isAllowed: false, error: error.message };
    }
};