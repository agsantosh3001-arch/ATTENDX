declare module 'embedded-postgres' {
  export interface PostgresOptions {
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    persistent?: boolean;
    [key: string]: any;
  }

  export default class EmbeddedPostgres {
    constructor(options?: Partial<PostgresOptions>);
    initialise(): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    createDatabase(name: string): Promise<void>;
    dropDatabase(name: string): Promise<void>;
  }
}
