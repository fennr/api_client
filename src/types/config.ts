export interface ApiConfig {
    name: string;
    url: string;
    headers: Record<string, string>;
    params: Record<string, string>;
    body: any;
}

export interface Config {
    api: ApiConfig[];
}
