const API_HOST = process.env.NEXT_PUBLIC_API_HOST || '';

export async function askAI() {
  return await fetchData('/api/chatbot', 'Failed to connect AI');
}

export async function getMuzakki() {
  return await fetchData('/api/muzzaki', 'Failed to fetch muzzaki data');
}

export async function getJurnal() {
  return await fetchData('/api/jurnal', 'Failed to fetch jurnal data');
}

export async function getJurnalDataById(id: number) {
  return await fetchData(`/api/jurnal?id=${id}`, 'Failed to fetch jurnal data');
}

export async function getJurnalDataCleaningById(id: number) {
  return await fetchData(`/api/jurnal?cleaning_only=true&id=${id}`, 'Failed to fetch jurnal data');
}

export async function deleteJurnal(id: number) {
  try {
    const res = await fetch(`${API_HOST}/api/jurnal?id=${id}`, {
      method: 'DELETE',
    });

    const resText = await res.text();

    if (!res.ok) {
      console.error('❌ Failed to delete jurnal data:', resText);
      throw new Error(`Failed to delete jurnal data: ${resText}`);
    }

    const resData = JSON.parse(resText);
    return resData.status === 'success';
  } catch (err) {
    console.error('❌ Error in deleteJurnal:', err);
    return false;
  }
}

export type MuzzakiJurnalUploadData = {
  attachment_name: string;
  attachment_base64: string;
  jenisJurnal: string;
  data?: {
    nama: string;
    hp: string;
    jumlah: number;
    kategori: string;
  }[];
};

export async function uploadJurnal(data: MuzzakiJurnalUploadData): Promise<boolean> {
  try {
    const res = await fetch(`${API_HOST}/api/jurnal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const resText = await res.text();
    const resData = JSON.parse(resText);

    if (!res.ok) {
      console.error('❌ Upload failed:', resData);
      return false;
    }

    return resData.status === 'success';
  } catch (err) {
    console.error('❌ Upload error:', err);
    return false;
  }
}

// ✅ Helper function untuk fetch data dari API
async function fetchData(endpoint: string, errorMessage: string) {
  try {
    const fullUrl = `${API_HOST}${endpoint}`;
    console.log('📡 Fetching:', fullUrl);

    const res = await fetch(fullUrl);
    const text = await res.text();

    if (!res.ok) {
      console.error(`❌ ${errorMessage}:`, text);
      throw new Error(`${errorMessage}: ${text}`);
    }

    const data = JSON.parse(text);
    return data.data ?? data;
  } catch (err) {
    console.error('❌ fetchData error:', err);
    return [];
  }
}
