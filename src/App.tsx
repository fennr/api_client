import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { type Config, type ApiConfig } from "./types/config";
import "./App.css";

function App() {
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [selectedApi, setSelectedApi] = useState<ApiConfig | null>(null);
  const [companyId, setCompanyId] = useState<string>("b6a174fb-4f1d-4791-800c-c6b86711ad57");
  const [requestBody, setRequestBody] = useState<string>("");
  const [response, setResponse] = useState<string>("");

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await invoke<Config>("read_config");
        setApis(config.api);
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };
    loadConfig();
  }, []);

  const handleApiSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = apis.find(api => api.name === e.target.value);
    setSelectedApi(selected || null);
    if (selected) {
      setRequestBody(JSON.stringify(selected.body, null, 2));
    }
    setResponse("");
  };

  const handleRequest = async () => {
    if (!selectedApi || !companyId || !requestBody) return;
    
    try {
      let bodyJson;
      try {
        bodyJson = JSON.parse(requestBody);
      } catch (e) {
        setResponse('Error: Invalid JSON in request body');
        return;
      }
      let updatedApi = {
        ...selectedApi,
        body: bodyJson,
      };

      if (selectedApi.name !== "Search Company") {
        // Создаем обновленную конфигурацию API
        updatedApi = {
          ...selectedApi,
          headers: selectedApi.headers,
          body: {
            ...bodyJson,
            companyId: companyId,
            "language": "Russian",
          },
        };
      } 
      
      console.log('Sending request with config:', updatedApi);
      const result = await invoke<string>("make_request", { api: updatedApi });
      setResponse(result);
    } catch (error) {
      console.error('Error making request:', error);
      setResponse(`Error: ${error}`);
    }
  };

  // const isRequestEnabled = selectedApi && companyId.trim() && requestBody.trim();
  const isRequestEnabled = selectedApi;

  return (
    <main className="container">
      <h1>API Client</h1>
      
      <div className="api-form">
        <div className="input-group">
          <label>Select API:</label>
          <select 
            value={selectedApi?.name || ""} 
            onChange={handleApiSelect}
          >
            <option value="">Choose API...</option>
            {apis.map(api => (
              <option key={api.name} value={api.name}>
                {api.name}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Company ID:</label>
          <input
            type="text"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder="Enter Company ID..."
          />
        </div>

        <div className="input-group">
          <label>Request Body:</label>
          <textarea
            value={requestBody}
            onChange={(e) => setRequestBody(e.target.value)}
            rows={5}  
            placeholder="Enter request body..."
          />
        </div>

        <button 
          onClick={handleRequest}
          disabled={!isRequestEnabled}
        >
          Send Request
        </button>

        {response && (
          <div className="input-group">
            <label>Response:</label>
            <textarea
              value={(() => {
                try {
                  return JSON.stringify(JSON.parse(response), null, 2);
                } catch {
                  return response;
                }
              })()}
              readOnly
              rows={20}
            />
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
