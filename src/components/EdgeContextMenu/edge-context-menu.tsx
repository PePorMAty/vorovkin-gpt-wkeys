import React from 'react';

interface EdgeContextMenuProps {
  edgeMenu: {
    id: string;
    top: number;
    left: number;
    sourceId: string;
    targetId: string;
  };
  onDeleteEdge: () => void;
  onClose: () => void;
}

export const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  edgeMenu,
  onDeleteEdge,
  onClose
}) => {
  const menuStyle: React.CSSProperties = {
    position: "fixed",
    top: edgeMenu.top,
    left: edgeMenu.left,
    background: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "16px",
    zIndex: 1000,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    minWidth: "150px",
  };

  return (
    <div style={menuStyle}>
      <div style={{ marginBottom: "12px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#333" }}>
          Связь
        </h3>
        <p style={{ margin: "0", fontSize: "12px", color: "#666" }}>
          ID: {edgeMenu.id}
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button
          onClick={onClose}
          style={{
            background: "#f5f5f5",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Закрыть
        </button>
        <button
          onClick={onDeleteEdge}
          style={{
            background: "#ff3b30",
            border: "none",
            borderRadius: "4px",
            padding: "6px 12px",
            cursor: "pointer",
            color: "white",
            fontSize: "14px",
          }}
        >
          Удалить связь
        </button>
      </div>
    </div>
  );
};