import { Sequelize, DataTypes } from 'sequelize';

export const Database = new Sequelize('postgres', 'postgres.qxqtzbhifvmcwsevfypf', 'lazismu', {
    host: 'aws-0-ap-southeast-1.pooler.supabase.com',
    dialect: 'postgres',
    logging: false,
    port: 6543,
});

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
    kategori: {
        type: DataTypes.STRING,
        allowNull: true
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
    kategori: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    nominal: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    jenis_donatur: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
  tableName: 'JurnalDataCleanings',
  freezeTableName: true
});


// Hubungan antar tabel
Jurnal.hasMany(JurnalData, { foreignKey: 'jurnal_id' });
JurnalData.belongsTo(Jurnal, { foreignKey: 'jurnal_id' });

// Optional kalau ingin relasi juga ke tabel cleanings
Jurnal.hasMany(JurnalDataCleaning, { foreignKey: 'jurnal_id' });
JurnalDataCleaning.belongsTo(Jurnal, { foreignKey: 'jurnal_id' });

export { Sequelize, DataTypes };

export default Database;

// Sync DB
Database.sync()
    .then(() => {
        console.log('Database connected and synced');
    })
    .catch((err) => {
        console.error('Error syncing database:', err);
    });
