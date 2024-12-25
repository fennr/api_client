import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { type Config, type ApiConfig, type Source } from "./types/config";
import { JsonEditor } from './components/JsonEditor';
import { ResponseViewer } from './components/ResponseViewer';
import { useApi } from './hooks/useApi';
import { ApiService } from './services/apiService';
import { DEFAULT_COMPANY_ID } from './constants/api';
import "./App.css";
import 'jsoneditor/dist/jsoneditor.css';

function App() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [selectedApi, setSelectedApi] = useState<ApiConfig | null>(null);
  const [companyId, setCompanyId] = useState<string>(DEFAULT_COMPANY_ID);
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
    if (!isValidRequest()) return;

    try {
      const result = await makeRequest({
        source: selectedSource!.name,
        selectedApi: selectedApi!,
        companyId,
        requestBody,
      });
      setResponse(result);
    } catch (error) {
      handleRequestError(error);
    }
  };

  const isValidRequest = (): boolean => {
    if (!selectedSource || !selectedApi || !requestBody) return false;
    
    if (ApiService.needsCompanyId(selectedSource, selectedApi) && !companyId) {
      return false;
    }

    return true;
  };

  const handleRequestError = (error: any) => {
    console.error('Error making request:', error);
    setResponse(`Error: ${error}`);
  };

  const renderSourceSelector = () => (
    <div className="input-group">
      <label>Select Source:</label>
      <select value={selectedSource?.name || ""} onChange={handleSourceSelect}>
        <option value="">Choose Source...</option>
        {sources.map(source => (
          <option key={source.name} value={source.name}>{source.name}</option>
        ))}
      </select>
    </div>
  );

  const renderApiSelector = () => selectedSource && (
    <div className="input-group">
      <label>Select API:</label>
      <select value={selectedApi?.name || ""} onChange={handleApiSelect}>
        <option value="">Choose API...</option>
        {selectedSource.endpoints.map(api => (
          <option key={api.name} value={api.name}>{api.name}</option>
        ))}
      </select>
    </div>
  );

  const renderCompanyIdInput = () => (
    selectedSource && 
    selectedApi && 
    ApiService.needsCompanyId(selectedSource, selectedApi) && (
      <div className="input-group">
        <label>Company ID:</label>
        <input
          type="text"
          value={companyId}
          onChange={(e) => setCompanyId(e.target.value)}
          placeholder="Enter Company ID..."
        />
      </div>
    )
  );

  return (
    <main className="container">
      <h1>API Client</h1>
      <div className="api-form">
        {renderSourceSelector()}
        {renderApiSelector()}
        {renderCompanyIdInput()}
        
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
          disabled={!isValidRequest() || requestInProgress}
        >
          {requestInProgress ? 'Sending...' : 'Send Request'}
        </button>

        <ResponseViewer response={response} />
      </div>
    </main>
  );
}

export default App;
