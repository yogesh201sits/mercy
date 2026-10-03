import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { MercyError } from "@mercy/shared";
import type { SnapshotStorage } from "./storage";

export class LocalSnapshotStorage implements SnapshotStorage {
  constructor(
    private readonly rootDirectory: string
  ) {}

  async put(
    key: string,
    data: Uint8Array
  ): Promise<void> {
    const filePath = this.getPath(key);

    await mkdir(dirname(filePath), {
      recursive: true
    });

    await writeFile(filePath, data);
  }

  async get(
    key: string
  ): Promise<Uint8Array> {
    const filePath = this.getPath(key);

    try {
      return await readFile(filePath);
    } catch (error) {
      throw new MercyError(
        "SNAPSHOT_NOT_FOUND",
        `Snapshot not found: ${key}`,
        { cause: error }
      );
    }
  }

  async delete(
    key: string
  ): Promise<void> {
    const filePath = this.getPath(key);

    await rm(filePath, {
      force: true
    });
  }

  async exists(
    key: string
  ): Promise<boolean> {
    try {
      await readFile(this.getPath(key));
      return true;
    } catch {
      return false;
    }
  }

  private getPath(key: string): string {
    return resolve(this.rootDirectory, key);
  }
}