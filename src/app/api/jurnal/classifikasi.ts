export type KeyValue = {
  [key: string]: string | number | boolean | null;
};

export class DonationClassifier {
  preprocess_data(input: KeyValue[]) {
    const column_must_not_null = ['nama', 'nominal', 'tanggal'];
    const data: KeyValue[] = [];

    for (const row of input) {
      // fallback kategori jika kosong, ambil dari sumber_dana
      let kategori = (row['kategori'] as string)?.trim();
      if (!kategori && row['sumber_dana']) {
        kategori = String(row['sumber_dana']).trim();
      }

      row['kategori'] = kategori || 'Momentum';

      let is_valid = true;
      for (const field of column_must_not_null.concat(['kategori'])) {
        if (!row.hasOwnProperty(field) || row[field] == null || row[field] === '') {
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
      const key = `${row['nama']}-${row['kategori']}-${row['nominal']}-${row['tanggal']}`;
      if (!unique_data_map[key]) {
        unique_data.push(row);
        unique_data_map[key] = true;
      }
    }

    return unique_data;
  }

  kategori_muzaki(row: KeyValue): string {
    const nominal = row['nominal'];
    const kategori = (row['kategori'] as string)?.toLowerCase();

    if (typeof nominal !== 'number') return 'Tidak Diketahui';

    if (kategori === 'zakat') {
      return nominal >= 1_000_000 ? 'Besar' : 'Kecil';
    } else if (kategori === 'infaq') {
      return nominal >= 500_000 ? 'Besar' : 'Kecil';
    } else {
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
      const kategoriAsli = (row['kategori'] as string || '').trim().toLowerCase();
      const normalizedKategori = kategoriAsli === 'zakat' || kategoriAsli === 'infaq'
        ? kategoriAsli.charAt(0).toUpperCase() + kategoriAsli.slice(1)
        : 'Momentum';

      const key = `${nama}-${normalizedKategori}-${row['month']}-${row['year']}`;
      const yearKey = `${nama}-${normalizedKategori}-${row['year']}`;
      donation_counts[key] = (donation_counts[key] || 0) + 1;
      yearly_counts[yearKey] = (yearly_counts[yearKey] || 0) + 1;
    }

    for (const row of data) {
      const nama = row['nama'] as string;
      const kategoriAsli = (row['kategori'] as string || '').trim().toLowerCase();
      const normalizedKategori = kategoriAsli === 'zakat' || kategoriAsli === 'infaq'
        ? kategoriAsli.charAt(0).toUpperCase() + kategoriAsli.slice(1)
        : 'Momentum';

      const monthKey = `${nama}-${normalizedKategori}-${row['month']}-${row['year']}`;
      const yearKey = `${nama}-${normalizedKategori}-${row['year']}`;

      row['count'] = donation_counts[monthKey] || 0;
      row['yearlyCount'] = yearly_counts[yearKey] || 0;

      // deteksi apakah SEMUA jenis kategori user ini hanya mengandung kata program/dskl/donasi
      const isPureMomentum = kategoriAsli.includes('donasi') || kategoriAsli.includes('program') || kategoriAsli.includes('dskl');
      const isSingleAndMomentum = namaCount[nama] === 1 && isPureMomentum;

      if (isSingleAndMomentum) {
        row['jenis_donatur'] = 'Momentum';
        row['c1'] = '-';
        row['c2'] = '-';
      } else if ((normalizedKategori === 'Zakat' || normalizedKategori === 'Infaq') && namaCount[nama] === 1) {
        row['jenis_donatur'] = 'Calon';
        row['c1'] = '-';
        row['c2'] = '-';
      } else if (normalizedKategori === 'Momentum') {
        row['jenis_donatur'] = 'Momentum';
        row['c1'] = '-';
        row['c2'] = '-';
      } else {
        row['c1'] = this.kategori_muzaki({ ...row, kategori: normalizedKategori });
        row['c2'] =
          (normalizedKategori === 'Zakat' && row['yearlyCount'] >= 3) ||
          (normalizedKategori === 'Infaq' && row['count'] >= 3)
            ? 'Sering'
            : 'Jarang';

        row['jenis_donatur'] = `${row['c1']} ${row['c2']}`;
      }
    }

    return data;
  }

  classify(data: KeyValue[]): KeyValue[] {
    const preprocessed = this.preprocess_data(data);
    return this.classify_frequency(preprocessed);
  }
}