// archiver@8 is ESM and ships no type declarations; @types/archiver is still on v6/v7
// and describes a different (callable) API. We import the package as a namespace and
// cast it to the ZipArchive shape we use; this shim only exists to satisfy module
// resolution.
declare module "archiver"
