export type CloudflareResourceNames = {
  database: string
  serverWorker: string
  uploadsBucket: string
  webWorker: string
}

export function cloudflareResourceNames(stage: string): CloudflareResourceNames {
  const normalizedStage = stage.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase()

  return {
    database: `prive-admin-${normalizedStage}`,
    serverWorker: `prive-admin-server-${normalizedStage}`,
    uploadsBucket: `prive-admin-${normalizedStage}`,
    webWorker: `prive-admin-web-${normalizedStage}`,
  }
}
