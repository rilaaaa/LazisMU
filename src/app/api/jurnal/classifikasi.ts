/**
 * Author: TODO
 * Commnet:
 */

export type KeyValue = {
    [key: string]: string | number | boolean | null;
}

export class DonationClassifier {
    preprocess_data(input: KeyValue[]) {
        const column_must_not_null = ['nama', 'zis', 'nominal', 'tanggal'];
        const data = [];
        for (let i = 0; i < input.length; i++) {
            const row = input[i];
            let is_valid = true;

            for (let j = 0; j < column_must_not_null.length; j++) {
                const field = column_must_not_null[j];
                if (!Object.keys(row).includes(field)) {
                    is_valid = false;
                    break;
                }
            }

            if (is_valid) {
                data.push(row);
            }
        }

        // drop duplicate data
        const unique_data = [];
        const unique_data_map: { [key: string]: boolean } = {};
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const key = `${row['nama'] ?? ''}${row['zis'] ?? ''}${row['nominal'] ?? ''}${row['tanggal'] ?? ''}`;
            if (!unique_data_map[key]) {
                unique_data.push(row);
                unique_data_map[key] = true;
            }
        }

        // add new kategori where zis == 'zakat' else 'infaq'
        for (let i = 0; i < unique_data.length; i++) {
            const row = unique_data[i];
            if (row['zis'] == 'Zakat') {
                row['kategori'] = 'Zakat';
            } else {
                row['kategori'] = 'Infaq';
            }
        }

        return unique_data;
    }

    kategori_muzaki(row: KeyValue): string {
        if (row['kategori'] === 'Zakat') {
            const nominal = row['nominal'];
            if (typeof nominal === 'number' && nominal !== null) {
                return nominal >= 1000000 ? 'Besar' : 'Kecil';
            }
            return 'Tidak Diketahui';
        } else if (row['kategori'] === 'Infaq') {
            const nominal = row['nominal'];
            if (typeof nominal === 'number' && nominal !== null) {
                return nominal >= 500000 ? 'Besar' : 'Kecil';
            }
            return 'Tidak Diketahui';
        }
        else {
            return 'Tidak Diketahui';
        }
    }

    classify_frequency(data: KeyValue[]): KeyValue[] {
        data.forEach(row => {
            row['c2'] = 'Jarang';
            const date = row['tanggal'] ? new Date(row['tanggal'] as string | number) : new Date();
            row['month'] = date.getMonth() + 1;
            row['year'] = date.getFullYear();
        });

        const donation_counts: { [key: string]: number } = {};
        data.forEach(row => {
            const key = `${row['nama']}-${row['kategori']}-${row['month']}-${row['year']}`;
            if (!donation_counts[key]) {
                donation_counts[key] = 0;
            }
            donation_counts[key]++;
        });

        data.forEach(row => {
            const key = `${row['nama']}-${row['kategori']}-${row['month']}-${row['year']}`;
            row['count'] = donation_counts[key];
        });

        data.forEach(row => {
            if (row['kategori'] === 'Infaq' && typeof row['count'] === 'number' && row['count'] >= 3) {
                row['c2'] = 'Sering';
            }
        });

        const yearly_counts: { [key: string]: number } = {};
        data.forEach(row => {
            const key = `${row['nama']}-${row['kategori']}-${row['year']}`;
            if (!yearly_counts[key]) {
                yearly_counts[key] = 0;
            }
            yearly_counts[key]++;
        });

        data.forEach(row => {
            const key = `${row['nama']}-${row['kategori']}-${row['year']}`;
            row['yearlyCount'] = yearly_counts[key];
        });

        data.forEach(row => {
            row['c1'] = this.kategori_muzaki(row);

            if (row['kategori'] === 'Zakat' && typeof row['yearlyCount'] === 'number' && row['yearlyCount'] >= 3) {
                row['c2'] = 'Sering';
            }

            row['jenis_donatur'] = row['c1'] + ' ' + row['c2'];
        });

        return data;
    }

    classify(data: KeyValue[]): KeyValue[] {
        data = this.preprocess_data(data);
        data = this.classify_frequency(data);

        return data;
    }
}