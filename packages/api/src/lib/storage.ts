import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Singleton S3 client for Cloudflare R2
let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('R2 credentials are not properly configured');
    }

    s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return s3Client;
}

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'qualyit-uploads';

export interface PresignedUploadResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

/**
 * Generate a presigned URL for uploading a file to R2
 */
export async function getPresignedUploadUrl(
  tenantId: string,
  path: string,
  filename: string,
  contentType: string,
  expiresIn = 3600
): Promise<PresignedUploadResult> {
  const client = getS3Client();
  const key = `${tenantId}/${path}/${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return {
    uploadUrl,
    key,
    publicUrl,
  };
}

/**
 * Generate a presigned URL for downloading a file from R2
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete a file from R2
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getS3Client();

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await client.send(command);
}

/**
 * Get the public URL for a file
 */
export function getPublicUrl(key: string): string {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
