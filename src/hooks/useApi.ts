import { useState } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { type RequestParams } from '../types/types';
import { ApiService } from '../services/apiService';

export const useApi = () => {
  const [requestInProgress, setRequestInProgress] = useState(false);

  const makeRequest = async ({
    source,
    selectedApi,
    companyId,
    requestBody,
  }: RequestParams): Promise<string> => {
    setRequestInProgress(true);
    try {
      const bodyJson = JSON.parse(requestBody);
      let updatedApi = { ...selectedApi };
      let command = "";
      // Добавляем companyId только для Credinform API
      if (ApiService.isCredinformSource(source.name)) {
        command = "make_credinform_request";
        if (ApiService.needsCompanyId(source, selectedApi)) {
          updatedApi.body = {
            ...bodyJson,
            companyId,
            language: "Russian",
          };
        }
      } else {
        updatedApi.body = bodyJson;
        command = "make_request";
      }

      return await invoke<string>(command, {
        source: source.name,
        api: updatedApi,
      });
    } finally {
      setRequestInProgress(false);
    }
  };

  return { makeRequest, requestInProgress };
};
