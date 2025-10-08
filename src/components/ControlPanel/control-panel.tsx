import React from 'react';
import { Panel } from '@xyflow/react';

interface ControlPanelProps {
  onRefreshView: () => void;
  onVerticalLayout: () => void;
  onHorizontalLayout: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onRefreshView,
  onVerticalLayout,
  onHorizontalLayout
}) => {
  const buttonStyle = {
    background: "#007bff",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    margin: "4px",
    fontSize: "14px"
  };

  const refreshButtonStyle = {
    ...buttonStyle,
    background: "#28a745"
  };

  return (
    <Panel position="top-right">
      <button 
        onClick={onRefreshView}
        style={refreshButtonStyle}
      >
        Обновить вид
      </button>
      <button 
        onClick={onVerticalLayout}
        style={buttonStyle}
      >
        Вертикальный layout
      </button>
      <button 
        onClick={onHorizontalLayout}
        style={buttonStyle}
      >
        Горизонтальный layout
      </button>
    </Panel>
  );
};