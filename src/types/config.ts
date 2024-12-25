export interface Config {
  sources: Source[];
}

export interface Source {
  name: string;
  base_url: string;
  username: string;
  password: string;
  endpoints: ApiConfig[];
}

export interface ApiConfig {
  name: string;
  url: string;
  headers: Record<string, string>;
  params: Record<string, string>;
  body: any;
}
