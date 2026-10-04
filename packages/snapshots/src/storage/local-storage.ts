import {
  mkdir,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import {
  dirname,
  isAbsolute,
  relative,
  resolve
} from "node:path";

import { MercyError } from "@mercy/shared";

import type { SnapshotStorage } from "./storage";

export class LocalSnapshotStorage implements SnapshotStorage {
  private readonly rootDirectory: string;

  constructor(rootDirectory: string) {
    this.rootDirectory = resolve(rootDirectory);
  }

  async put(
    key: string,
    data: Uint8Array
  ): Promise<void> {
    const filePath = this.getSafePath(key);

    await mkdir(dirname(filePath), {
        recursive: true
    });

    await writeFile(filePath, data);
  }

  async get(
    key: string
  ): Promise<Uint8Array> {
    const filePath = this.getSafePath(key);

    try {
      return await readFile(filePath);
    } catch (error) {
      throw new MercyError(
        "SNAPSHOT_NOT_FOUND",
        `Snapshot not found: ${key}`,
        {
          cause: error
        }
      );
    }
  }

  async delete(
    key: string
  ): Promise<void> {
    const filePath = this.getSafePath(key);

    await rm(filePath, {
      force: true
    });
  }

  async exists(
    key: string
  ): Promise<boolean> {
    const filePath = this.getSafePath(key);

    try {
      await readFile(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private getSafePath(key: string): string {
    if (isAbsolute(key)) {
      throw new MercyError(
        "INVALID_INPUT",
        "Snapshot storage key must be relative"
      );
    }

    const filePath = resolve(
      this.rootDirectory,
      key
    );

    const relativePath = relative(
      this.rootDirectory,
      filePath
    );

    if (
      relativePath === "" ||
      relativePath.startsWith("..") ||
      isAbsolute(relativePath)
    ) {
      throw new MercyError(
        "INVALID_INPUT",
        "Snapshot storage key escapes the snapshot directory"
      );
    }

    return filePath;
  }

}