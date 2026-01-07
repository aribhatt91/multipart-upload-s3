import Logger from "../logger";

/* eslint-disable @typescript-eslint/no-explicit-any */
class LocalDBHelper {
    private static instance: LocalDBHelper;
    private dbName: string = "AppDatabase";
    private dbVersion: number = 1;
    private db: IDBDatabase | null = null;

    private constructor() {}

    public static getInstance(): LocalDBHelper {
        if (!LocalDBHelper.instance) {
            LocalDBHelper.instance = new LocalDBHelper();
        }
        return LocalDBHelper.instance;
    }

    // Initialize/Open the Database
    private async connect(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            // Handle schema updates (Creating tables/stores)
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains("uploads")) {
                    db.createObjectStore("uploads", { keyPath: "uploadId" });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(request.result);
            };

            request.onerror = () => reject("IndexedDB failed to open");
        });
    }

    // SAVE (Create/Update)
    public async save(storeName: string, data: any): Promise<void> {
        const db = await this.connect();
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        Logger.log('LocalDBHelper:save::', data);
        store.put(data); // 'put' updates if key exists, creates if not
    }

    // RETRIEVE (Read)
    public async get(storeName: string, id: string): Promise<any> {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.get(id); store.getAll()
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Failed to retrieve data");
        });
    }

    // RETRIEVE (Read)
    public async getAll(storeName: string): Promise<any> {
        const db = await this.connect();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, "readonly");
            const store = transaction.objectStore(storeName);
            const request = store.getAll()
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Failed to retrieve data");
        });
    }

    // DELETE
    public async delete(storeName: string, id: string): Promise<void> {
        const db = await this.connect();
        const transaction = db.transaction(storeName, "readwrite");
        transaction.objectStore(storeName).delete(id);
    }
}

export default LocalDBHelper;