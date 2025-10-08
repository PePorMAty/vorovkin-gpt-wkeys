import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';

export const DataInspector: React.FC = () => {
  const { data, loading, error } = useSelector((state: RootState) => state.gpt);
  
  return (
    <div style={{
      position: 'fixed',
      top: 10,
      right: 10,
      background: 'rgba(0,0,0,0.9)',
      color: 'white',
      padding: 15,
      fontSize: 12,
      zIndex: 10000,
      maxWidth: '400px',
      maxHeight: '300px',
      overflow: 'auto'
    }}>
      <h4>🔍 Data Inspector</h4>
      <div>Loading: {loading ? '✅' : '❌'}</div>
      <div>Error: {error ? '✅' : '❌'}</div>
      <div>Data exists: {data ? '✅' : '❌'}</div>
      <div>Nodes count: {data?.nodes?.length || 0}</div>
      
      {data?.nodes?.map((node, index) => (
        <div key={index} style={{ marginTop: '10px', borderTop: '1px solid #555', paddingTop: '5px' }}>
          <div>Node {index}:</div>
          <div>ID: {node["Id узла"]}</div>
          <div>Type: {node["Тип"]}</div>
          <div>Name: {node["Название"]}</div>
          <div>Inputs: {node["Входы"]?.join(', ') || 'none'}</div>
          <div>Outputs: {node["Выходы"]?.join(', ') || 'none'}</div>
        </div>
      ))}
    </div>
  );
};