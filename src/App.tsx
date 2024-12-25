import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { type Config, type ApiConfig } from "./types/config";
import "./App.css";
import JSONEditor from 'jsoneditor';
import 'jsoneditor/dist/jsoneditor.css';

function App() {
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [selectedApi, setSelectedApi] = useState<ApiConfig | null>(null);
  const [companyId, setCompanyId] = useState<string>("b6a174fb-4f1d-4791-800c-c6b86711ad57");
  const [requestBody, setRequestBody] = useState<string>("");
  const [response, setResponse] = useState<string>("");

  const editorRef = useRef<HTMLDivElement>(null);
  const jsonEditorRef = useRef<JSONEditor | null>(null);
  const requestBodyEditorRef = useRef<HTMLDivElement>(null);
  const requestBodyJsonEditorRef = useRef<JSONEditor | null>(null);

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

  useEffect(() => {
    if (editorRef.current && response) {
      if (!jsonEditorRef.current) {
        jsonEditorRef.current = new JSONEditor(editorRef.current, {
          modes: ['tree', 'code'],
          mode: 'tree',
          mainMenuBar: true,
          navigationBar: true,
          search: true,
          // expandAll: true,
          // onLoad: function () {
          //   this.expandAll();
          // }
        });
      }
      try {
        const jsonData = JSON.parse(response);
        jsonEditorRef.current.set(jsonData);
        jsonEditorRef.current.expandAll(); // разворачиваем после установки данных
      } catch {
        jsonEditorRef.current.set({ error: response });
      }
    }

    return () => {
      if (jsonEditorRef.current) {
        jsonEditorRef.current.destroy();
        jsonEditorRef.current = null;
      }
    };
  }, [response]);

  useEffect(() => {
    if (requestBodyEditorRef.current) {
      if (!requestBodyJsonEditorRef.current) {
        requestBodyJsonEditorRef.current = new JSONEditor(requestBodyEditorRef.current, {
          mode: 'code',
          mainMenuBar: false,
          navigationBar: false,
          search: false,
          onChange: function() {
            try {
              const json = requestBodyJsonEditorRef.current?.get();
              setRequestBody(JSON.stringify(json));
            } catch (e) {
              // Ignore invalid JSON while editing
            }
          }
        });
      }
      try {
        const jsonData = JSON.parse(requestBody);
        requestBodyJsonEditorRef.current.set(jsonData);
      } catch {
        requestBodyJsonEditorRef.current.set({});
      }
    }

    return () => {
      if (requestBodyJsonEditorRef.current) {
        requestBodyJsonEditorRef.current.destroy();
        requestBodyJsonEditorRef.current = null;
      }
    };
  }, [selectedApi]);

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
  const isRequestEnabled = selectedApi?.name === "Search Company" ||
    selectedApi && companyId.trim() && requestBody.trim();

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
          <div ref={requestBodyEditorRef} />
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
            <div ref={editorRef} style={{ height: '600px' }} />
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
