import { Sequelize, DataTypes } from 'sequelize';

export const Database = new Sequelize('lazismu', 'postgres', '2200016063', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false,
});

// --- MODEL YANG SUDAH ADA (TIDAK DIUBAH) ---
export const Jurnal = Database.define('jurnals', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    jenisJurnal: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

export const JurnalData = Database.define('JurnalData', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    jurnal_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Jurnal,
            key: 'id'
        }
    },
    nama: {
        type: DataTypes.STRING,
        allowNull: false
    },
    no_hp: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tanggal: {
        type: DataTypes.DATE,
        allowNull: false
    },
    tahun: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    zis: {
        type: DataTypes.STRING,
        allowNull: false
    },
    via: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sumber_dana: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nominal: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    jenis_donatur: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

export const JurnalDataCleaning = Database.define('JurnalDataCleanings', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    jurnal_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Jurnal,
            key: 'id'
        }
    },
    nama: {
        type: DataTypes.STRING,
        allowNull: false
    },
    no_hp: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tanggal: {
        type: DataTypes.DATE,
        allowNull: false
    },
    tahun: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    zis: {
        type: DataTypes.STRING,
        allowNull: false
    },
    via: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sumber_dana: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nominal: {
        type: DataTypes.FLOAT, 
        allowNull: false
    },
    jenis_donatur: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// ==========================================================
// ===== MODEL BARU UNTUK PENYALURAN (BAGIAN TAMBAHAN) ======
// ==========================================================
export const JurnalDataPenyaluran = Database.define('JurnalDataPenyalurans', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    jurnal_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Jurnal,
            key: 'id'
        }
    },
    sumber_dana: {
        type: DataTypes.STRING,
        allowNull: false
    },
    jenis_penyaluran: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nominal: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
});
// ==========================================================


// --- HUBUNGAN ANTAR TABEL (DILENGKAPI) ---
Jurnal.hasMany(JurnalData, { 
    foreignKey: 'jurnal_id', 
    onDelete: 'CASCADE'
});
JurnalData.belongsTo(Jurnal, { foreignKey: 'jurnal_id' });

Jurnal.hasMany(JurnalDataCleaning, { 
    foreignKey: 'jurnal_id',
    onDelete: 'CASCADE'
});
JurnalDataCleaning.belongsTo(Jurnal, { foreignKey: 'jurnal_id' });

// =======================================================================
// ===== RELASI BARU UNTUK PENYALURAN (BAGIAN TAMBAHAN) ====================
// =======================================================================
Jurnal.hasMany(JurnalDataPenyaluran, { 
    foreignKey: 'jurnal_id', 
    onDelete: 'CASCADE' 
});
JurnalDataPenyaluran.belongsTo(Jurnal, { foreignKey: 'jurnal_id' });
// =======================================================================


// --- EKSPOR DAN SINKRONISASI (TIDAK DIUBAH) ---
export { Sequelize, DataTypes };

export default Database;

Database.sync({ alter: true })
    .then(() => {
        console.log('Database connected and synced (Penyaluran model included).');
    })
    .catch((err) => {
        console.error('Error syncing database:', err);
    });