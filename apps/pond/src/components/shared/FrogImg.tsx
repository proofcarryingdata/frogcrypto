import { logger, type IFrogData } from "@frogcrypto/shared";
import React, { forwardRef, Suspense } from "react";
import Loader from "./Loader";

class IDCache {
  db: IDBDatabase | null = null;
  version = 1;
  assets = {};
  initPromise: Promise<void> | null = null;

  constructor(props: {
    version: number;
    assets?: object;
    db?: IDBDatabase | null;
  }) {
    this.version = props.version || 1;
    this.assets = {};
    this.db = null;
  }

  init() {
    if (this.initPromise) {
      return this.initPromise;
    }
    return (this.initPromise = new Promise<void>((resolve) => {
      const request = indexedDB.open("INDEXED.image.cache", this.version);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        (event.target as IDBOpenDBRequest).result.createObjectStore("cache");
      };

      request.onsuccess = () => {
        this.db = request.result;

        this.db.onerror = () => {
          logger.error("Error creating/accessing db");
        };
        resolve();
      };
    }));
  }

  putImage(key: string, url: string) {
    return new Promise<string>((resolve, reject) => {
      if (!this.db) {
        reject("DB not initialized. Call the init method");
        return;
      }

      const db = this.db;

      void fetch(url)
        .then((res) => res.blob())
        .then((blob) => {
          const transaction = db.transaction(["cache"], "readwrite");
          transaction.objectStore("cache").put(blob, key);
          resolve(URL.createObjectURL(blob));
        });
    });
  }

  putBlob(key: string, blob: Blob) {
    return new Promise<void>((resolve, reject) => {
      if (!this.db) {
        reject("DB not initialized. Call the init method");
        return;
      }

      const db = this.db;

      const transaction = db.transaction(["cache"], "readwrite");
      transaction.objectStore("cache").put(blob, key);
      resolve();
    });
  }

  getImage(key: string): Promise<string | null> {
    return new Promise<string | null>((resolve) => {
      const transaction = this.db?.transaction(["cache"], "readwrite");
      if (!transaction) {
        resolve(null);
        return;
      }
      transaction.objectStore("cache").get(key).onsuccess = (event) => {
        const blob = (event.target as IDBRequest<Blob>).result;
        if (!blob) {
          resolve(null);
          return;
        }
        resolve(URL.createObjectURL(blob));
      };
    });
  }

  async clearImage(key: string) {
    if (!key) {
      return;
    }
    const image = await this.getImage(key);
    if (image) {
      const db = this.db;
      const transaction = db?.transaction(["cache"], "readwrite");
      transaction?.objectStore("cache").delete(key);
    }
  }

  clearAll() {
    const db = this.db;
    const transaction = db?.transaction(["cache"], "readwrite");
    transaction?.objectStore("cache").clear();
  }
}
const idCache = new IDCache({ version: 1 });

const imgCache = {
  __cache: {} as Record<string, string | Promise<void>>,
  read(src: string) {
    if (!this.__cache[src]) {
      this.__cache[src] = idCache.init().then(() =>
        idCache
          .getImage(src)
          .then((blob) => blob ?? idCache.putImage(src, src))
          .then((blob) => {
            this.__cache[src] = blob;
          })
      );
    }
    const cached = this.__cache[src];
    if (cached instanceof Promise) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- React Suspense expects a promise
      throw cached;
    }
    return cached;
  },
};

function SuspenseImg({
  src,
  alt,
  className,
  ...rest
}: { src: string; alt: string } & React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img src={imgCache.read(src)} alt={alt} className={className} {...rest} />
  );
}

function FrogImg({
  frog,
  className,
  ...rest
}: {
  frog: Pick<IFrogData, "imageUrl" | "name">;
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <Suspense fallback={<Loader className={className} />}>
      <SuspenseImg
        src={frog.imageUrl}
        alt={frog.name}
        draggable={false}
        className={className ?? "w-full h-auto object-cover"}
        {...rest}
      />
    </Suspense>
  );
}

export default FrogImg;
