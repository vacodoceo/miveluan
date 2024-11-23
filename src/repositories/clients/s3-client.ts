import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Repository {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.bucketName = process.env.AWS_S3_BUCKET || '';
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async uploadFile(
    key: string,
    body: Buffer,
    contentType?: string
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    try {
      await this.s3Client.send(command);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to upload file to S3: ${error.message}`);
      }
      throw new Error('Failed to upload file to S3: Unknown error');
    }
  }

  async getFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      const response = await this.s3Client.send(command);
      if (!response.Body) {
        throw new Error('No file content received from S3');
      }
      return Buffer.from(await response.Body.transformToByteArray());
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to get file from S3: ${error.message}`);
      }
      throw new Error('Failed to get file from S3: Unknown error');
    }
  }

  async generatePresignedUrl(
    bucketName: string,
    key: string,
    expiresIn: number = 3600
  ): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    try {
      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate presigned URL: ${error.message}`);
      }
      throw new Error('Failed to generate presigned URL: Unknown error');
    }
  }
}