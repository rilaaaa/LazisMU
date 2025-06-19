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
    if (!res.ok) throw new Error('Failed to delete jurnal data');
    const data = await res.json();
    return data.status === 'success';
  } catch (err) {
    console.error(err);
    return false;
  }
}

export type MuzzakiJurnalUploadData = {
  attachment_name: string;
  attachment_base64: string;
  jenisJurnal: string;
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

    return resData.status === 'success';
  } catch (err) {
    console.error('Upload error:', err);
    return false;
  }
}

// Helper function
async function fetchData(endpoint: string, errorMessage: string) {
  try {
    const res = await fetch(`${API_HOST}${endpoint}`);
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Fetch error: ${res.status} ${res.statusText}`);
      console.error(`Response body: ${errorText}`);
      throw new Error(errorMessage);
    }
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.error('fetchData catch block:', err);
    return [];
  }
}
