export interface FilesystemWriteMetadata {
  readonly path: string;
  readonly content: string;
}

export interface FilesystemRenameMetadata {
  readonly source: string;
  readonly destination: string;
}

export interface FilesystemMoveMetadata {
  readonly source: string;
  readonly destination: string;
}