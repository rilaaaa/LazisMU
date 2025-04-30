const API_HOST = '';

export async function getMuzakki() {
    try {
        // Ganti nek wes di deploy
        const res = await fetch(API_HOST + '/api/muzzaki');
        if (!res.ok) throw new Error('Failed to fetch muzzaki data');
        const data = await res.json();
        return data.data;
    } catch (err) {
        console.error(err);
        return [];
    }
}

export async function getJurnal() {
    try {
        // Ganti nek wes di deploy
        const res = await fetch(API_HOST + '/api/jurnal');
        if (!res.ok) throw new Error('Failed to fetch jurnal data');
        const data = await res.json();
        return data.data;
    }
    catch (err) {
        console.error(err);
        return [];
    }
}

export async function getJurnalDataById(id: number) {
    try {
        const res = await fetch(API_HOST + '/api/jurnal?id=' + id);
        if (!res.ok) throw new Error('Failed to fetch jurnal data');
        const data = await res.json();
        return data.data;
    } catch (err) {
        console.error(err);
        return [];
    }
}

export async function deleteJurnal(id: number) {
    try {
        const res = await fetch(API_HOST + '/api/jurnal?id=' + id, {
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
}

export async function uploadJurnal(data: MuzzakiJurnalUploadData): Promise<boolean> {
    try {
        const res = await fetch(API_HOST + '/api/jurnal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const res_data = await res.json();

        if (res_data.status === 'success') {
            return true;
        }

        return false;
    } catch (err) {
        console.error(err);

        return false;
    }
}