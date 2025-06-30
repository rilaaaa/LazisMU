export type KeyValue = {
  [key: string]: string | number | boolean | null;
};

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

    // drop duplicate
    const unique_data: KeyValue[] = [];
    const unique_data_map: { [key: string]: boolean } = {};
    for (const row of data) {
      const key = `${row['nama']}-${row['zis']}-${row['nominal']}-${row['tanggal']}`;
      if (!unique_data_map[key]) {
        unique_data.push(row);
        unique_data_map[key] = true;
      }
    }

    // Add kategori field
    for (const row of unique_data) {
      row['kategori'] = row['zis'] === 'Zakat' ? 'Zakat' : 'Infaq';
    }

    return unique_data;
  }

  kategori_muzaki(row: KeyValue): string {
    const nominal = row['nominal'];
    if (row['kategori'] === 'Zakat') {
      if (typeof nominal === 'number') return nominal >= 1000000 ? 'Besar' : 'Kecil';
    } else if (row['kategori'] === 'Infaq') {
      if (typeof nominal === 'number') return nominal >= 500000 ? 'Besar' : 'Kecil';
    }
    return 'Tidak Diketahui';
  }

  classify_frequency(data: KeyValue[]): KeyValue[] {
    const namaCount: Record<string, number> = {};

    // Tambah count berdasarkan nama
    for (const row of data) {
      const nama = row['nama'] as string;
      if (!namaCount[nama]) namaCount[nama] = 0;
      namaCount[nama]++;
    }

    data.forEach(row => {
      row['month'] = new Date(row['tanggal'] as string).getMonth() + 1;
      row['year'] = new Date(row['tanggal'] as string).getFullYear();
    });

    const donation_counts: Record<string, number> = {};
    const yearly_counts: Record<string, number> = {};

    data.forEach(row => {
      const key = `${row['nama']}-${row['kategori']}-${row['month']}-${row['year']}`;
      donation_counts[key] = (donation_counts[key] || 0) + 1;

      const yearKey = `${row['nama']}-${row['kategori']}-${row['year']}`;
      yearly_counts[yearKey] = (yearly_counts[yearKey] || 0) + 1;
    });

    data.forEach(row => {
      const yearKey = `${row['nama']}-${row['kategori']}-${row['year']}`;
      row['count'] = donation_counts[`${row['nama']}-${row['kategori']}-${row['month']}-${row['year']}`];
      row['yearlyCount'] = yearly_counts[yearKey];

      row['c1'] = this.kategori_muzaki(row);
      row['c2'] = (row['kategori'] === 'Zakat' && row['yearlyCount'] >= 3) || 
                  (row['kategori'] === 'Infaq' && row['count'] >= 3)
                  ? 'Sering' : 'Jarang';

      row['jenis_donatur'] =
        namaCount[row['nama'] as string] === 1 ? 'Calon' : `${row['c1']} ${row['c2']}`;
    });

    return data;
  }

  classify(data: KeyValue[]): KeyValue[] {
    const preprocessed = this.preprocess_data(data);
    return this.classify_frequency(preprocessed);
  }
}
