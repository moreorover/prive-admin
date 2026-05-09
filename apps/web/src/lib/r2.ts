import { S3Client } from "@aws-sdk/client-s3"
import { env } from "@prive-admin-tanstack/env/server"

export const r2 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT ?? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  // MinIO and other S3-compatible local stores require path-style addressing.
  forcePathStyle: env.R2_ENDPOINT !== undefined,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
})

export const bucketName = env.R2_BUCKET_NAME
