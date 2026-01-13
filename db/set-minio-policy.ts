import * as Minio from 'minio';
import dotenv from 'dotenv';

dotenv.config();

const client = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || ''
});

async function run() {
  const bucketName = process.env.MINIO_BUCKET || 't-news';
  try {
    const bucketExists = await client.bucketExists(bucketName);
    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      await client.makeBucket(bucketName);
    }

    console.log(`Setting public policy for bucket: ${bucketName}`);
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetBucketLocation', 's3:ListBucket'],
          Resource: [`arn:aws:s3:::${bucketName}`]
        },
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${bucketName}/*`]
        }
      ]
    };
    await client.setBucketPolicy(bucketName, JSON.stringify(policy));
    console.log('Public policy set successfully');
  } catch (err) {
    console.error('Error setting policy:', err);
  }
}

run();
