import { type ApiConfig } from './config';

export interface ApiSelectorProps {
  apis: ApiConfig[];
  selectedApi: ApiConfig | null;
  onSelect: (api: ApiConfig | null) => void;
}

export interface CompanyIdInputProps {
  companyId: string;
  onChange: (value: string) => void;
}

export interface JsonEditorProps {
  data: string;
  onChange?: (value: string) => void;
  options?: any;
  readOnly?: boolean;
}

export interface RequestBodyEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export interface ResponseViewerProps {
  response: string | null;
  options?: Record<string, any>;
}

export interface RequestParams {
  source: string;
  selectedApi: ApiConfig;
  companyId?: string;
  requestBody: string;
}
