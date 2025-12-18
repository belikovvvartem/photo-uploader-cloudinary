import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const client = new S3Client({
  region: 'auto', // обов'язково для Cloudflare R2
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const config = {
  api: {
    bodyParser: false, // важливо, бо ми не парсимо тело тут
  },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed — use GET' });
  }

  const { filename, contentType } = req.query;

  if (!filename || !contentType) {
    return res.status(400).json({ error: 'Missing filename or contentType' });
  }

  // Унікальне ім'я файлу, щоб уникнути конфліктів
  const extension = filename.split('.').pop();
  const key = `uploads/${uuidv4()}.${extension}`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
      // ACL: 'public-read' — не потрібен, бо бакет публічний через r2.dev
    });

    const signedUrl = await getSignedUrl(client, command, { expiresIn: 600 }); // 10 хвилин

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    res.status(200).json({
      signedUrl,
      url: publicUrl,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
}