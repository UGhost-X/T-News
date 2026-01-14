import * as Minio from 'minio'

let minioClient: Minio.Client | null = null

export const getMinioClient = () => {
  if (minioClient) return minioClient

  minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || ''
  })

  return minioClient
}

export const uploadToMinio = async (file: Buffer, fileName: string, contentType: string) => {
  const client = getMinioClient()
  const bucketName = process.env.MINIO_BUCKET || 't-news-avatars'

  // Ensure bucket exists
  const bucketExists = await client.bucketExists(bucketName)
  if (!bucketExists) {
    await client.makeBucket(bucketName)
    
    // Set bucket policy to public read
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
    }
    await client.setBucketPolicy(bucketName, JSON.stringify(policy))
  }

  const objectName = `${Date.now()}-${fileName}`
  await client.putObject(bucketName, objectName, file, file.length, {
    'Content-Type': contentType
  })

  const publicUrl = process.env.MINIO_PUBLIC_URL || `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${bucketName}`
  return `${publicUrl}/${objectName}`
}
