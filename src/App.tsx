import { useState, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { type Config, type ApiConfig } from "./types/config";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [selectedApi, setSelectedApi] = useState<ApiConfig | null>(null);
  const [response, setResponse] = useState<string>("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

  const handleRequest = async () => {
    if (!selectedApi) return;
    try {
      const result = await invoke<string>("make_request", { api: selectedApi });
      setResponse(result);
    } catch (error) {
      console.error('Error making request:', error);
      setResponse(`Error: ${error}`);
    }
  };

  const formatResponse = (response: string) => {
    try {
      const jsonData = JSON.parse(response);
      return JSON.stringify(jsonData, null, 2);
    } catch {
      return response;
    }
  };

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await invoke<Config>("read_config");
        console.log('Loaded configuration:', config);  // добавляем лог
        setApis(config.api);
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };

    loadConfig();
  }, []);

  return (
    <main className="container">
      <h1>Welcome to Tauri + React</h1>

      <div className="row">
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo vite" alt="Vite logo" />
        </a>
        <a href="https://tauri.app" target="_blank">
          <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <p>Click on the Tauri, Vite, and React logos to learn more.</p>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          greet();
        }}
      >
        <input
          id="greet-input"
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Enter a name..."
        />
        <button type="submit">Greet</button>
      </form>
      <p>{greetMsg}</p>

      <div className="api-selector">
        <div className="api-select-row">
          <select 
            className="api-select"
            value={selectedApi?.name || ""} 
            onChange={(e) => {
              const selected = apis.find(api => api.name === e.target.value);
              setSelectedApi(selected || null);
              setResponse(""); // Clear previous response
            }}
          >
            <option value="">Выберите API</option>
            {apis.map(api => (
              <option key={api.name} value={api.name}>
                {api.name}
              </option>
            ))}
          </select>
          <button type="submit"
            onClick={handleRequest}
            disabled={!selectedApi}
          >
            Request
          </button>
        </div>
        
        {selectedApi && (
          <div className="api-info">
            <p>URL: {selectedApi.url}</p>
            <p>Headers: {JSON.stringify(selectedApi.headers, null, 2)}</p>
            <p>Params: {JSON.stringify(selectedApi.params, null, 2)}</p>
            <p>Body: {JSON.stringify(selectedApi.body, null, 2)}</p>
          </div>
        )}

        {response && (
          <div className="api-response">
            <h3>Response:</h3>
            <pre>{formatResponse(response)}</pre>
          </div>
        )}
      </div>
    </main>
  );
}

export default App;
