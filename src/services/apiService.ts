import { ApiConfig, Source } from '../types/config';
import { API_SOURCES, API_ENDPOINTS } from '../constants/api';

export class ApiService {
  static isCredinformSource(sourceName: string): boolean {
    return sourceName === API_SOURCES.CREDINFORM;
  }

  static needsCompanyId(source: Source, api: ApiConfig): boolean {
    return this.isCredinformSource(source.name) && api.name !== API_ENDPOINTS.SEARCH_COMPANY;
  }


  static validateRequest(
    source: Source | null, 
    api: ApiConfig | null, 
    requestBody: string
  ): { isValid: boolean; parsedBody?: Record<string, unknown> } {
    if (!source || !api || !requestBody.trim()) {
      return { isValid: false };
    }

    try {
      const parsedBody = JSON.parse(requestBody) as Record<string, unknown>;
      return { isValid: true, parsedBody };
    } catch {
      return { isValid: false };
    }
  }

  static formatRequestBody(body: Record<string, unknown>): string {
    return JSON.stringify(body, null, 2);
  }
}
