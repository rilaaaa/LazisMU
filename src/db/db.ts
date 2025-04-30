import Sequelize from 'sequelize';

export const Database = new Sequelize.Sequelize({
    dialect: 'sqlite',
    storage: './test/db.sqlite3',
    logging: false,
});

export const Jurnal = Database.define('Jurnal', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

export const JurnalData = Database.define('JurnalData', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    jurnal_id: {
        type: Sequelize.INTEGER,
        references: {
            model: Jurnal,
            key: 'id'
        }
    },
    nama: {
        type: Sequelize.STRING,
        allowNull: false
    },
    no_hp: {
        type: Sequelize.STRING,
        allowNull: false
    },
    tanggal: {
        type: Sequelize.DATE,
        allowNull: false
    },
    tahun: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    zis: {
        type: Sequelize.STRING,
        allowNull: false
    },
    via: {
        type: Sequelize.STRING,
        allowNull: false
    },
    sumber_dana: {
        type: Sequelize.STRING,
        allowNull: false
    },
    nominal: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    jenis_donatur: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

Jurnal.hasMany(JurnalData, { foreignKey: 'jurnal_id' });
JurnalData.belongsTo(Jurnal, { foreignKey: 'jurnal_id' });

Database.sync().then(() => {});
