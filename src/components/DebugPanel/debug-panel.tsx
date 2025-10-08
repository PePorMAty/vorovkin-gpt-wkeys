import React from 'react';
import { Panel } from '@xyflow/react';
import type { CustomNode, CustomEdge,ApiResponse } from '../../types';

interface DebugPanelProps {
  nodes: CustomNode[];
  edges: CustomEdge[];
  apiData?: ApiResponse | null;
  flowKey: number;
  dataProcessed: boolean;
  initialLoad: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  nodes,
  edges,
  apiData,
  flowKey,
  dataProcessed,
  initialLoad
}) => {
  return (
    <Panel position="top-left">
      <div style={{ 
        background: 'white', 
        padding: '8px', 
        borderRadius: '4px', 
        fontSize: '12px',
        border: '1px solid #ccc',
        minWidth: '250px'
      }}>
        <div><strong>Отладка React Flow</strong></div>
        <div>Узлы в RF: <span style={{color: nodes.length > 0 ? 'green' : 'red'}}>{nodes.length}</span></div>
        <div>Связи в RF: <span style={{color: edges.length > 0 ? 'green' : 'red'}}>{edges.length}</span></div>
        <div>API узлов: <span style={{color: apiData?.nodes && apiData.nodes.length > 0 ? 'green' : 'red'}}>{apiData?.nodes?.length || 0}</span></div>
        <div>Ключ: {flowKey}</div>
        <div>Обработано: {dataProcessed ? '✓' : '✗'}</div>
        <div>Первая загрузка: {initialLoad ? '✓' : '✗'}</div>
        <div>API Data: {apiData ? '✓' : '✗'}</div>
        <div>Nodes in API: {apiData?.nodes?.length || 0}</div>
      </div>
    </Panel>
  );
};