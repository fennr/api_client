import { useEffect, useRef } from 'react';
import JSONEditor from 'jsoneditor';
import { JsonEditorProps } from '../types/types';

export const JsonEditor: React.FC<JsonEditorProps> = ({ 
  data, 
  onChange, 
  options = {},
  readOnly = false 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const jsonEditorRef = useRef<JSONEditor | null>(null);

  useEffect(() => {
    if (editorRef.current && !jsonEditorRef.current) {
      const defaultOptions = {
        mode: readOnly ? 'view' : 'code',
        mainMenuBar: false,
        navigationBar: false,
        statusBar: false,
        onChange: () => {
          if (onChange && jsonEditorRef.current) {
            try {
              const json = jsonEditorRef.current.get();
              onChange(JSON.stringify(json));
            } catch (e) {
              // Ignore invalid JSON while editing
            }
          }
        }
      };

      jsonEditorRef.current = new JSONEditor(
        editorRef.current, 
        { ...defaultOptions, ...options }
      );
    }

    return () => {
      if (jsonEditorRef.current) {
        jsonEditorRef.current.destroy();
        jsonEditorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (jsonEditorRef.current && data) {
      try {
        const jsonData = JSON.parse(data);
        jsonEditorRef.current.set(jsonData);
      } catch {
        jsonEditorRef.current.set({});
      }
    }
  }, [data]);

  return <div ref={editorRef} style={{ height: '100%' }} />;
};
