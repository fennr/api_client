import { ApiConfig, Source } from '../types/config';
import { API_SOURCES, API_ENDPOINTS } from '../constants/api';

export class ApiService {
  static isCredinformSource(sourceName: string): boolean {
    return sourceName === API_SOURCES.CREDINFORM;
  }

  static needsCompanyId(source: Source, api: ApiConfig): boolean {
    return this.isCredinformSource(source.name) && api.name !== API_ENDPOINTS.SEARCH_COMPANY;
  }

  static prepareRequestBody(source: Source, api: ApiConfig, body: any, companyId?: string): any {
    if (this.isCredinformSource(source.name) && companyId) {
      return {
        ...body,
        companyId,
        language: "Russian",
      };
    }
    return body;
  }

  static validateRequest(source: Source | null, api: ApiConfig | null, requestBody: string): boolean {
    if (!source || !api || !requestBody.trim()) return false;

    try {
      JSON.parse(requestBody);
      return true;
    } catch {
      return false;
    }
  }
}
