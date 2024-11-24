import { GoogleDriveFile } from "@/components/google-drive";
import { upsertFileToDrive, findFile, getDriveforlderIdIfExists} from "@/lib/google-drive";
import crypto from 'crypto';

interface Vector {
  content: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

const removeLineBreaks = (content: string) => content.replace(/\n/g, '');

function generateId(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

const separator = "#@#$#$#$#@#";

function vectorsToCSV(vectors: Vector[]): string {
  // Create CSV header
  const headers = ['id', 'content', 'embedding', 'metadata'];
  const csvRows = [headers.join(separator)];

  // Add vector data
  vectors.forEach(vector => {
    const row = [
      generateId(vector.content),
      // Escape content to handle commas and quotes
      `"${removeLineBreaks(vector.content).replace(/"/g, '""')}"`,
      // Convert embedding array to string
      `"${JSON.stringify(vector.embedding)}"`,
      // Convert metadata to escaped JSON string
      `"${JSON.stringify(vector.metadata || {}).replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(separator));
  });

  return csvRows.join('\n');
}

function parseCSVToVectors(csvContent: string): Vector[] {
  const rows = csvContent.split('\n');
  const headers = rows[0].split(separator);
  
  // Validate headers
  if (!headers.includes('id') || !headers.includes('content') || 
      !headers.includes('embedding') || !headers.includes('metadata')) {
    throw new Error('Invalid CSV format: missing required headers');
  }

  return rows.slice(1).map(row => {
    // Split by comma but respect quoted values
    const values = row.split(separator);
    const rowData: { [key: string]: string } = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      // Remove quotes and unescape double quotes
      value = value.replace(/^"|"$/g, '').replace(/""/g, '"');
      rowData[header] = value;
    });

    return {
      content: rowData['content'],
      embedding: JSON.parse(rowData['embedding']),
      metadata: JSON.parse(rowData['metadata'])
    };
  });
}

export async function getVectorsFromGoogleDrive(
  fileName: string,
  folderName: string,
  accessToken: string
): Promise<Vector[]> {
  const folderId = await getDriveforlderIdIfExists(folderName, accessToken);
  if (!folderId) {
    return [];
  }

  const fileId = await findFile(fileName, folderId, accessToken);

  if (!fileId) {
    return [];
  }

  // Download the file content
  const downloadResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    }
  );

  if (!downloadResponse.ok) {
    throw new Error('Failed to download vectors file from Google Drive');
  }

  const csvContent = await downloadResponse.text();
  return parseCSVToVectors(csvContent);
}

export async function syncVectorsToGoogleDrive(
  vectors: Vector[],
  fileName: string,
  folderId: string,
  accessToken: string
): Promise<GoogleDriveFile> {
  const csvContent = vectorsToCSV(vectors);
  const file = new File(
    [csvContent], 
    `${fileName}`, 
    { type: 'text/csv' }
  );

  return await upsertFileToDrive(file, accessToken, folderId);
}
