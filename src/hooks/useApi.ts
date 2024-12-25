import { useState } from 'react';
import { invoke } from "@tauri-apps/api/core";
import { type RequestParams } from '../types/types';

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

      // Добавляем companyId только для Credinform API
      if (source === 'Credinform' && companyId) {
        updatedApi.body = {
          ...bodyJson,
          companyId,
          language: "Russian",
        };
      } else {
        updatedApi.body = bodyJson;
      }

      return await invoke<string>("make_request", { 
        source,
        api: updatedApi,
        useAuth: true  // параметр переименован с use_auth на useAuth
      });
    } finally {
      setRequestInProgress(false);
    }
  };

  return { makeRequest, requestInProgress };
};
