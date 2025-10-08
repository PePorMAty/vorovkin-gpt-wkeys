import React from 'react';

interface NodeContextMenuProps {
  nodeMenu: {
    id: string;
    top: number;
    left: number;
    label: string;
    description?: string;
    type: string;
    nodeType: 'product' | 'transformation';
  };
  onAddNode: (parentId: string, parentType: 'product' | 'transformation') => void;
  onEditNode: () => void;
  onDeleteNode: () => void;
  onClose: () => void;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  nodeMenu,
  onAddNode,
  onEditNode,
  onDeleteNode,
  onClose
}) => {
  const menuStyle: React.CSSProperties = {
    position: "fixed",
    top: nodeMenu.top,
    left: nodeMenu.left,
    background: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "16px",
    zIndex: 1000,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    minWidth: "200px",
    maxWidth: "300px",
  };

  const buttonStyle = {
    border: "none",
    borderRadius: "4px",
    padding: "6px 12px",
    cursor: "pointer",
    fontSize: "14px",
    margin: "2px"
  };

  return (
    <div style={menuStyle}>
      <div style={{ marginBottom: "12px" }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#333" }}>
          {nodeMenu.label}
        </h3>
        <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#888" }}>
          Тип: {nodeMenu.type}
        </p>
        {nodeMenu.description && (
          <p style={{ margin: "0", fontSize: "14px", color: "#666", lineHeight: "1.4" }}>
            {nodeMenu.description}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button
          onClick={() => onAddNode(nodeMenu.id, nodeMenu.nodeType)}
          style={{
            ...buttonStyle,
            background: "#28a745",
            color: "white",
          }}
        >
          Добавить связь {nodeMenu.nodeType === 'product' ? 'Преобразование' : 'Продукт'}
        </button>
        <button
          onClick={onEditNode}
          style={{
            ...buttonStyle,
            background: "#007bff",
            color: "white",
          }}
        >
          Редактировать
        </button>
        <button
          onClick={onClose}
          style={{
            ...buttonStyle,
            background: "#f5f5f5",
            border: "1px solid #ddd",
          }}
        >
          Закрыть
        </button>
        <button
          onClick={onDeleteNode}
          style={{
            ...buttonStyle,
            background: "#ff3b30",
            color: "white",
          }}
        >
          Удалить
        </button>
      </div>
    </div>
  );
};