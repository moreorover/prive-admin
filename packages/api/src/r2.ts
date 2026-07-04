import { S3Client } from "@aws-sdk/client-s3"
import { env } from "@prive-admin-tanstack/env/server"

export const r2 = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  forcePathStyle: env.R2_FORCE_PATH_STYLE,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
})

export const bucketName = env.R2_BUCKET_NAME
