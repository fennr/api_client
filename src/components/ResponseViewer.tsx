import { FC } from 'react';
import { ResponseViewerProps } from '../types/types';
import { JsonEditor } from './JsonEditor';

export const ResponseViewer: FC<ResponseViewerProps> = ({ response, options }) => {
  if (!response) return null;

  const defaultOptions = {
    mode: 'tree',
    modes: ['tree', 'code'],
    mainMenuBar: true,
    navigationBar: true,
    search: true,
  };

  return (
    <div className="input-group">
      <label>Response:</label>
      <div style={{ height: '600px' }}>
        <JsonEditor
          data={response}
          readOnly
          options={{ ...defaultOptions, ...options }}
        />
      </div>
    </div>
  );
};
