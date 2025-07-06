const API_HOST = process.env.NEXT_PUBLIC_API_HOST || '';

export type MuzzakiJurnalUploadData = {
  attachment_name: string;
  attachment_base64: string;
  jenisJurnal: string;
};

export type PenyaluranData = {
  id?: number;
  number: string;
  jenis_penyaluran: string;
  nominal: number;
  jurnal_id: number;
  jemsJurnal?: string;
};

export interface DashboardPenyaluranData {
  id: number;
  tanggal: Date;
  sumber_dana: string;
  jenis_penyaluran: string;
  program: string;
  penerima_manfaat: string;
  nominal: number;
}

export type PenyaluranUploadData = {
  attachment_name: string;
  attachment_base64: string;
  jenisJurnal?: string; 
};

async function fetchData(endpoint: string, errorMessage: string) {
  try {
    const res = await fetch(`${API_HOST}${endpoint}`, { cache: 'no-store' }); 
    if (!res.ok) throw new Error(errorMessage);
    const data = await res.json();
    if (data.status === 'success') {
      return data.data;
    }
    return [];
  } catch (err) {
    console.error(`Error fetching from ${endpoint}:`, err);
    return [];
  }
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
    if (!res.ok) throw new Error('Failed to delete jurnal data');
    const data = await res.json();
    return data.status === 'success';
  } catch (err) {
    console.error(err);
    return false;
  }
}

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

    return resData.status === 'success';
  } catch (err) {
    console.error('Upload error:', err);
    return false;
  }
}

export async function getAllJurnalCleaning() {
  return await fetchData('/api/jurnal?cleaning_only=true', 'Failed to fetch all cleaning data');
}

export async function getAllPenyaluran(): Promise<DashboardPenyaluranData[]> {
  try {
    const response = await fetch('/api/penyaluran', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Gagal mengambil data penyaluran: ${response.statusText}`);
    }

    const result = await response.json();
    if (result.status === 'success') {
      return result.data.map((item: any) => ({
        ...item,
        tanggal: new Date(item.tanggal), 
      }));
    } else {
      throw new Error(result.message || 'Gagal mengambil data dari server.');
    }
  } catch (error) {
    console.error("Error in getAllPenyaluran:", error);
    throw error;
  }
}

export async function getPenyaluranById(id: number): Promise<PenyaluranData | null> {
  const data = await fetchData(`/api/penyaluran?id=${id}`, 'Failed to fetch penyaluran data');
  return Array.isArray(data) && data.length > 0 ? data[0] : null;
}

export async function getPenyaluranByJurnalId(jurnal_id: number): Promise<PenyaluranData[]> {
  return await fetchData(
    `/api/penyaluran?jurnal_id=${jurnal_id}`,
    'Failed to fetch penyaluran data by jurnal ID'
  );
}

export async function uploadPenyaluran(data: PenyaluranUploadData): Promise<{
  error: string;success: boolean, id?: number, count?: number
}> {
  try {
    const res = await fetch(`${API_HOST}/api/penyaluran`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'Failed to upload penyaluran data');
    }

    const resData = await res.json();
    return {
      error: '',
      success: resData.status === 'success',
      id: resData.data?.id,
      count: resData.data?.count
    };
  } catch (err) {
    console.error('Upload penyaluran error:', err);
    return { error: '', success: false };
  }
}

export async function createPenyaluran(data: Omit<PenyaluranData, 'id'>): Promise<boolean> {
  try {
    const res = await fetch(`${API_HOST}/api/penyaluran`, {
      method: 'POST', 
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to create penyaluran data');
    const resData = await res.json();
    return resData.status === 'success';
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function updatePenyaluran(id: number, data: Partial<PenyaluranData>): Promise<boolean> {
  try {
    const res = await fetch(`${API_HOST}/api/penyaluran?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('Failed to update penyaluran data');
    const resData = await res.json();
    return resData.status === 'success';
  } catch (err) {
    console.error(err);
    return false;
  }
}

export async function deletePenyaluran(id: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_HOST}/api/penyaluran?id=${id}`, {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error('Failed to delete penyaluran data');
    const resData = await res.json();
    return resData.status === 'success';
  } catch (err) {
    console.error(err);
    return false;
  }
}