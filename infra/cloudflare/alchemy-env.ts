const defaultStage = process.env.GITHUB_REF_NAME === "main" ? "prod" : "dev"

export function getAlchemyStage(): string {
  return process.env.ALCHEMY_STAGE ?? process.env.STAGE ?? defaultStage
}

export function requireEnv(name: string): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(`${name} is required`)
  }

  return value
}
