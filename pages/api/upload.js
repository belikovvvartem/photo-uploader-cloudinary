import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Тільки GET дозволено' });
    }

    const { filename, contentType } = req.query;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Потрібно передати filename і contentType' });
    }

    // Перевіряємо змінні середовища
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET || !process.env.R2_PUBLIC_URL) {
      console.error('Відсутні змінні середовища:', {
        account: !!process.env.R2_ACCOUNT_ID,
        key: !!process.env.R2_ACCESS_KEY_ID,
        secret: !!process.env.R2_SECRET_ACCESS_KEY,
        bucket: !!process.env.R2_BUCKET,
        url: !!process.env.R2_PUBLIC_URL,
      });
      return res.status(500).json({ error: 'Сервер не налаштований (відсутні ключі)' });
    }

    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });

    const extension = filename.split('.').pop() || 'jpg';
    const key = `uploads/${uuidv4()}.${extension}`;

    const signedUrl = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 600 }
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    res.status(200).json({ signedUrl, url: publicUrl });
  } catch (error) {
    console.error('Помилка в /api/upload:', error);
    res.status(500).json({ 
      error: 'Внутрішня помилка сервера', 
      details: error.message 
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};