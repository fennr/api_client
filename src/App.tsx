import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { type Config, type ApiConfig, type Source } from "./types/config";
import { JsonEditor } from './components/JsonEditor';
import { ResponseViewer } from './components/ResponseViewer';
import { useApi } from './hooks/useApi';
import "./App.css";
import 'jsoneditor/dist/jsoneditor.css';

function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [selectedApi, setSelectedApi] = useState<ApiConfig | null>(null);
  const [companyId, setCompanyId] = useState<string>("b6a174fb-4f1d-4791-800c-c6b86711ad57");
  const [requestBody, setRequestBody] = useState<string>("");
  const [response, setResponse] = useState<string>("");

  const { makeRequest, requestInProgress } = useApi();

  useEffect(() => {
    invoke<Config>("read_config")
      .then(config => setSources(config.sources))
      .catch(error => console.error('Error loading config:', error));
  }, []);

  const handleSourceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = sources.find(source => source.name === e.target.value);
    setSelectedSource(selected || null);
    setSelectedApi(null);
    setRequestBody("");
    setResponse("");
  };

  const handleApiSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!selectedSource) return;
    const selected = selectedSource.endpoints.find(api => api.name === e.target.value);
    setSelectedApi(selected || null);
    if (selected) {
      setRequestBody(JSON.stringify(selected.body, null, 2));
    }
    setResponse("");
  };

  const handleRequest = async () => {
    if (!selectedSource || !selectedApi || !requestBody) return;
    
    // Проверяем необходимость companyId только для Credinform
    if (selectedSource.name === 'Credinform' && !companyId && selectedApi.name !== "Search Company") {
      return;
    }

    try {
      const result = await makeRequest({
        source: selectedSource.name,
        selectedApi,
        companyId,
        requestBody,
      });
      setResponse(result);
    } catch (error) {
      console.error('Error making request:', error);
      setResponse(`Error: ${error}`);
    }
  };

  const isRequestEnabled = selectedApi && (
    selectedApi.name === "Search Company" ||
    selectedSource?.name !== 'Credinform' ||
    companyId.trim()
  ) && requestBody.trim();

  return (
    <main className="container">
      <h1>API Client</h1>
      <div className="api-form">
        {/* Source Selector */}
        <div className="input-group">
          <label>Select Source:</label>
          <select value={selectedSource?.name || ""} onChange={handleSourceSelect}>
            <option value="">Choose Source...</option>
            {sources.map(source => (
              <option key={source.name} value={source.name}>{source.name}</option>
            ))}
          </select>
        </div>

        {/* API Selector */}
        {selectedSource && (
          <div className="input-group">
            <label>Select API:</label>
            <select value={selectedApi?.name || ""} onChange={handleApiSelect}>
              <option value="">Choose API...</option>
              {selectedSource.endpoints.map(api => (
                <option key={api.name} value={api.name}>{api.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Company ID Input - показываем только для Credinform */}
        {selectedSource?.name === 'Credinform' && selectedApi?.name !== "Search Company" && (
          <div className="input-group">
            <label>Company ID:</label>
            <input
              type="text"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              placeholder="Enter Company ID..."
            />
          </div>
        )}

        {/* Request Body Editor */}
        <div className="input-group">
          <label>Request Body:</label>
          <div style={{ height: '150px' }}>
            <JsonEditor
              data={requestBody}
              onChange={setRequestBody}
              options={{ mode: 'code' }}
            />
          </div>
        </div>

        <button
          onClick={handleRequest}
          disabled={!isRequestEnabled || requestInProgress}
        >
          {requestInProgress ? 'Sending...' : 'Send Request'}
        </button>

        <ResponseViewer response={response} />
      </div>
    </main>
  );
}

export default App;
