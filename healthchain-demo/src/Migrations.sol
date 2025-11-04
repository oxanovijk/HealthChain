// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Migrations
 * @dev Kontrak ini digunakan oleh framework deployment (seperti Truffle/Hardhat) 
 * untuk melacak dan mengelola status deployment kontrak pada jaringan.
 */
contract Migrations {
    address public owner = msg.sender;
    uint public last_completed_migration;

    modifier restricted() {
        require(msg.sender == owner, "Hanya pemilik yang dapat memanggil fungsi ini.");
    }

    /**
     * @dev Digunakan untuk mengatur pemilik awal kontrak.
     */
    constructor() {
        // Pemilik kontrak adalah akun yang mendeploy
    }

    /**
     * @dev Memperbarui nomor migrasi terakhir yang berhasil diselesaikan.
     * Digunakan oleh skrip deployment (off-chain).
     * @param completed Nomor migrasi yang baru selesai.
     */
    function setCompleted(uint completed) public restricted {
        last_completed_migration = completed;
    }
}