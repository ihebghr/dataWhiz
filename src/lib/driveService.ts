
export async function uploadToGoogleDrive(fileName: string, content: string, mimeType: string, customToken?: string) {
  const token = customToken || sessionStorage.getItem('google_drive_token');
  if (!token) {
    throw new Error('Google Drive session expired or missing. Please log in again.');
  }

  // 1. Check if "DataWhiz AI" folder exists
  let folderId = sessionStorage.getItem('datawhiz_folder_id');
  
  if (!folderId) {
    const listResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='DataWhiz AI' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    const list = await listResponse.json();
    
    if (list.files && list.files.length > 0) {
      folderId = list.files[0].id;
    } else {
      // Create it
      const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'DataWhiz AI',
          mimeType: 'application/vnd.google-apps.folder'
        })
      });
      const folder = await createFolderRes.json();
      folderId = folder.id;
    }
    if (folderId) sessionStorage.setItem('datawhiz_folder_id', folderId);
  }

  // 2. Upload the file
  const metadata = {
    name: fileName,
    parents: folderId ? [folderId] : []
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([content], { type: mimeType }));

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      sessionStorage.removeItem('google_drive_token');
      throw new Error('GOOGLE_AUTH_EXPIRED');
    }
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to upload to Google Drive');
  }

  return await response.json();
}

export function convertToCSV(data: any[]) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const val = row[header];
        if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return val;
      }).join(',')
    )
  ];
  return rows.join('\n');
}
