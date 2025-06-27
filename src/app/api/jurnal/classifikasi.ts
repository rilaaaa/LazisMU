export type KeyValue = {
  [key: string]: string | number | boolean | null;
};

export class DonationClassifier {
  preprocess_data(input: KeyValue[]) {
    const column_must_not_null = ['nama', 'sumber_dana', 'nominal', 'tanggal'];
    const data: KeyValue[] = [];

    for (const row of input) {
      let is_valid = true;
      for (const field of column_must_not_null) {
        if (!row.hasOwnProperty(field) || row[field] == null) {
          is_valid = false;
          break;
        }
      }
      if (is_valid) {
        data.push(row);
      }
    }

    // Remove duplicates
    const unique_data: KeyValue[] = [];
    const unique_data_map: { [key: string]: boolean } = {};
    for (const row of data) {
      const key = `${row['nama']}-${row['sumber_dana']}-${row['nominal']}-${row['tanggal']}`;
      if (!unique_data_map[key]) {
        unique_data.push(row);
        unique_data_map[key] = true;
      }
    }

    // Determine category
    for (const row of unique_data) {
      const sumber = (row['sumber_dana'] as string).toLowerCase().trim();
      if (sumber.includes('zakat')) {
        row['kategori'] = 'Zakat';
      } else if (sumber.includes('infaq')) {
        row['kategori'] = 'Infaq';
      } else {
        row['kategori'] = 'Momentum';
      }
    }

    return unique_data;
  }

  kategori_muzaki(row: KeyValue): string {
    const nominal = row['nominal'];
    if (typeof nominal !== 'number') return 'Tidak Diketahui';

    switch (row['kategori']) {
      case 'Zakat':
        return nominal >= 1_000_000 ? 'Besar' : 'Kecil';
      case 'Infaq':
        return nominal >= 500_000 ? 'Besar' : 'Kecil';
      default:
        return 'Tidak Diketahui';
    }
  }

  classify_frequency(data: KeyValue[]): KeyValue[] {
    const namaCount: Record<string, number> = {};

    for (const row of data) {
      const nama = row['nama'] as string;
      namaCount[nama] = (namaCount[nama] || 0) + 1;
    }

    data.forEach(row => {
      const date = new Date(row['tanggal'] as string);
      row['month'] = date.getMonth() + 1;
      row['year'] = date.getFullYear();
    });

    const donation_counts: Record<string, number> = {};
    const yearly_counts: Record<string, number> = {};

    for (const row of data) {
      const nama = row['nama'] as string;
      const kategori = row['kategori'] as string;
      const key = `${nama}-${kategori}-${row['month']}-${row['year']}`;
      donation_counts[key] = (donation_counts[key] || 0) + 1;

      const yearKey = `${nama}-${kategori}-${row['year']}`;
      yearly_counts[yearKey] = (yearly_counts[yearKey] || 0) + 1;
    }

    for (const row of data) {
      const nama = row['nama'] as string;
      const kategori = row['kategori'] as string;
      const monthKey = `${nama}-${kategori}-${row['month']}-${row['year']}`;
      const yearKey = `${nama}-${kategori}-${row['year']}`;

      row['count'] = donation_counts[monthKey];
      row['yearlyCount'] = yearly_counts[yearKey];

      if (kategori === 'Momentum') {
        row['c1'] = '-';
        row['c2'] = '-';
        row['jenis_donatur'] = 'Momentum';
      } else {
        row['c1'] = this.kategori_muzaki(row);
        row['c2'] =
          (kategori === 'Zakat' && row['yearlyCount'] >= 3) ||
          (kategori === 'Infaq' && row['count'] >= 3)
            ? 'Sering'
            : 'Jarang';

        row['jenis_donatur'] =
          namaCount[nama] === 1 ? 'Calon' : `${row['c1']} ${row['c2']}`;
      }
    }

    return data;
  }

  classify(data: KeyValue[]): KeyValue[] {
    const preprocessed = this.preprocess_data(data);
    return this.classify_frequency(preprocessed);
  }
}
