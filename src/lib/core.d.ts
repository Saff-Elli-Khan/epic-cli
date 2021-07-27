export interface Configuration {
    version: string;
    type: "Application";
}
export interface Transactions {
    version: string;
    data: Array<Transaction>;
}
export interface Transaction {
    command: string;
    params: Record<string, any>;
}
export declare class Core {
    static RootPath: string;
    static AppPath: string;
    static DefaultConfig: Configuration;
    static DefaultTransactions: Transactions;
    static SupportedConfigVersions: string[];
    static SupportedTransVersions: string[];
    static getConfiguration: () => Configuration;
    static setConfiguration: (data: Configuration) => void;
    static getTransactions: () => Transactions;
    static setTransactions: (data: Transactions) => void;
}
