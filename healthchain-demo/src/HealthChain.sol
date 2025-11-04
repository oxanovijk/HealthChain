// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title HealthChain
 * @dev Smart Contract Inti untuk HealthChain: Mengelola metadata rekam medis, 
 * persetujuan pasien, dan protokol akses darurat.
 * * CATATAN: Data medis sensitif TIDAK disimpan di sini; hanya hash, pointer, dan consent.
 */
contract HealthChain {
    // --- 1. STRUKTUR DATA ---

    // Struktur untuk mencatat metadata data medis off-chain
    struct RecordMetadata {
        address patientId;       // Alamat pemilik data (Pasien)
        bytes32 dataHash;        // Hash kriptografi dari data terenkripsi (Bukti integritas)
        string storagePointer;   // Lokasi penyimpanan off-chain
        uint256 timestamp;       // Waktu pencatatan
        bool isLatest;           // Tanda bahwa ini adalah versi rekam medis terbaru
    }

    // Struktur untuk mencatat detail persetujuan akses
    struct AccessConsent {
        address patientId;       // Pasien yang memberikan persetujuan
        address requesterId;     // Institusi/Dokter yang meminta akses
        uint256 expirationTime;  // Waktu kadaluarsa persetujuan
        string purpose;          // Tujuan permintaan akses
    }

    // Struktur untuk mencatat informasi dasar Dokter (diperlukan untuk Emergency)
    struct DoctorProfile {
        string NIKHash;          // Hash dari NIK dokter (untuk verifikasi)
        string name;
        address walletAddress;
    }

    // --- 2. PEMETAAN DATA (STORAGE) ---

    // [DATA UTAMA] Mencatat metadata data medis berdasarkan Hash unik
    mapping(bytes32 => RecordMetadata) public records;
    
    // [LOG AKSES DARURAT] Mencatat detail override: Hash Data => {Dokter, Waktu}
    mapping(bytes32 => address) public emergencyAccessLog;

    // [REGISTRY] Institusi terdaftar
    mapping(address => bool) public isInstitution;

    // [REGISTRY] Profil Dokter terdaftar
    mapping(address => DoctorProfile) public doctorRegistry;

    // [CONSENT] Persetujuan aktif: Pasien => Requester => Consent Detail
    mapping(address => mapping(address => AccessConsent)) public activeConsents;
    
    // [LATEST RECORD] Mencatat hash dari rekam medis terbaru pasien
    mapping(address => bytes32) public latestRecordHash;


    // --- 3. EVENTS (Untuk notifikasi dan audit off-chain) ---

    event RecordAdded(bytes32 indexed dataHash, address indexed patientId, string storagePointer);
    event ConsentGranted(address indexed patientId, address indexed requesterId, uint256 expirationTime);
    event EmergencyOverride(address indexed doctorAddress, bytes32 indexed recordHash, string reason);
    event DoctorRegistered(address indexed doctorAddress, string name);


    // --- 4. MODIFIER & KONSTRUKTOR ---

    address public contractOwner;

    constructor() {
        contractOwner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Hanya pemilik kontrak yang diizinkan.");
        _;
    }

    modifier onlyInstitution() {
        require(isInstitution[msg.sender], "Hanya Institusi terdaftar yang diizinkan.");
        _;
    }

    // --- 5. FUNGSI REGISTRASI (Oleh Admin Konsorsium) ---
    
    function registerInstitution(address _institutionAddress) public onlyOwner {
        isInstitution[_institutionAddress] = true;
    }

    /**
     * @dev Registrasi Dokter: Admin Konsorsium mendaftarkan Dokter yang terverifikasi.
     * NIK di-hash dan tidak disimpan langsung untuk privasi.
     */
    function registerDoctor(address _doctorAddress, string memory _name, string memory _nikHash) public onlyOwner {
        doctorRegistry[_doctorAddress] = DoctorProfile({
            NIKHash: _nikHash,
            name: _name,
            walletAddress: _doctorAddress
        });
        emit DoctorRegistered(_doctorAddress, _name);
    }

    // --- 6. SIMULASI PIHAK RUMAH SAKIT MENAMBAHKAN DATA (SIMULASI UPDATE) ---

    /**
     * @dev [Simulasi Pihak RS Menambahkan Data & Update] Mencatat metadata data baru.
     * Ini juga mencatat update data Pasien, menggantikan hash sebelumnya.
     * @param _patientId ID pasien (alamat wallet)
     * @param _newDataHash Hash kriptografi dari data terenkripsi off-chain
     * @param _storagePointer Lokasi penyimpanan off-chain
     */
    function addRecordMetadata(
        address _patientId,
        bytes32 _newDataHash,
        string memory _storagePointer
    ) public onlyInstitution {
        // 1. Catat Hash data baru
        records[_newDataHash] = RecordMetadata({
            patientId: _patientId,
            dataHash: _newDataHash,
            storagePointer: _storagePointer,
            timestamp: block.timestamp,
            isLatest: true
        });

        // 2. Tandai data sebelumnya sebagai BUKAN yang terbaru (jika ada)
        bytes32 oldHash = latestRecordHash[_patientId];
        if (records[oldHash].patientId != address(0)) {
            records[oldHash].isLatest = false;
        }

        // 3. Update pointer ke hash terbaru
        latestRecordHash[_patientId] = _newDataHash;
        
        emit RecordAdded(_newDataHash, _patientId, _storagePointer);
    }
    
    // --- 7. PROTOKOL PERSYARATAN PASIEN & DOKTER ---

    /**
     * @dev [Pasien Akses Data Sendiri] Pasien dapat memeriksa hash data terbarunya.
     * TIDAK ada biaya gas (view function).
     * @param _patientId ID pasien (msg.sender)
     * @return dataHash, storagePointer, isLatest
     */
    function accessOwnLatestRecord(address _patientId) public view returns (bytes32, string memory, bool) {
        require(msg.sender == _patientId, "Akses hanya untuk diri sendiri.");
        
        bytes32 currentHash = latestRecordHash[_patientId];
        RecordMetadata storage record = records[currentHash];
        
        if (record.patientId == address(0)) {
            return (0, "No record found.", false);
        }
        
        // Asumsi kunci dekripsi pasien ada pada aplikasi off-chain
        return (record.dataHash, record.storagePointer, record.isLatest);
    }
    
    /**
     * @dev Pasien memberikan persetujuan akses kepada Institusi/Dokter (memerlukan Private Key Pasien).
     */
    function grantAccessConsent(
        address _requesterId,
        uint256 _durationSeconds,
        string memory _purpose
    ) public {
        address patientAddress = msg.sender;
        require(isInstitution[_requesterId], "Requester harus Institusi terdaftar.");
        
        uint256 expirationTime = block.timestamp + _durationSeconds;

        activeConsents[patientAddress][_requesterId] = AccessConsent({
            patientId: patientAddress,
            requesterId: _requesterId,
            expirationTime: expirationTime,
            purpose: _purpose
        });

        emit ConsentGranted(patientAddress, _requesterId, expirationTime);
    }
    
    // --- 8. EMERGENCY PROTOCOL (Akses Data Pasien Unresponsive) ---

    /**
     * @dev [Emergency Protocol] Dokter mengakses data pasien yang tidak responsif.
     * Menggantikan otorisasi pasien dengan verifikasi kredensial Dokter (SEED PHRASE + NIK).
     * @param _patientId ID pasien yang tidak responsif
     * @param _doctorAddress Alamat wallet Dokter
     * @param _providedNIKHash Hash NIK yang dimasukkan Dokter off-chain
     */
    function emergencyOverride(
        address _patientId, 
        address _doctorAddress, 
        string memory _providedNIKHash,
        string memory _emergencyReason
    ) public onlyInstitution {
        // 1. Verifikasi Kredensial Dokter On-Chain (Mencocokkan Hash NIK)
        DoctorProfile storage doctor = doctorRegistry[_doctorAddress];
        require(doctor.walletAddress == _doctorAddress, "Dokter tidak terdaftar.");
        require(keccak256(abi.encodePacked(doctor.NIKHash)) == keccak256(abi.encodePacked(_providedNIKHash)), "Kredensial NIK/Seed tidak cocok.");
        
        // 2. Memastikan adanya rekam medis terbaru
        bytes32 latestHash = latestRecordHash[_patientId];
        require(records[latestHash].patientId == _patientId, "Pasien tidak memiliki rekam medis.");
        
        // 3. Memberikan akses 24 jam dan mencatat override
        uint256 expirationTime = block.timestamp + 1 days;
        
        activeConsents[_patientId][_doctorAddress] = AccessConsent({
            patientId: _patientId,
            requesterId: _doctorAddress,
            expirationTime: expirationTime,
            purpose: _emergencyReason
        });
        
        // 4. Catat kejadian di log audit darurat
        emergencyAccessLog[latestHash] = _doctorAddress;
        
        emit EmergencyOverride(_doctorAddress, latestHash, _emergencyReason);
    }
    
    // --- 9. FUNGSI VERIFIKASI AKSES UMUM ---

    /**
     * @dev Memeriksa apakah Institusi memiliki persetujuan yang valid untuk mengakses data.
     */
    function checkAccess(
        address _patientId,
        address _requesterId
    ) public view returns (bool, bytes32, string memory, string memory) {
        AccessConsent storage consent = activeConsents[_patientId][_requesterId];

        if (consent.expirationTime > block.timestamp && consent.patientId != address(0)) {
            // Persetujuan valid. Ambil data pointer terbaru.
            bytes32 currentHash = latestRecordHash[_patientId];
            RecordMetadata storage record = records[currentHash];

            return (true, currentHash, record.storagePointer, consent.purpose);
        }

        // Persetujuan tidak ditemukan atau kadaluarsa
        return (false, 0, "", "");
    }
}