import React from 'react';

interface EditNodeModalProps {
  editingNode: {
    id: string;
    label: string;
    description: string;
    type: string;
  };
  onNodeChange: (node: { id: string; label: string; description: string; type: string } | null) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const EditNodeModal: React.FC<EditNodeModalProps> = ({
  editingNode,
  onNodeChange,
  onSave,
  onCancel
}) => {
  const modalStyle: React.CSSProperties = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "white",
    border: "1px solid #ccc",
    borderRadius: "8px",
    padding: "24px",
    zIndex: 1001,
    boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
    minWidth: "400px",
    maxWidth: "500px",
  };

  return (
    <div style={modalStyle}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>
        Редактирование узла
      </h3>
      
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold" }}>
          Название:
        </label>
        <input
          type="text"
          value={editingNode.label}
          onChange={(e) => onNodeChange({...editingNode, label: e.target.value})}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold" }}>
          Описание:
        </label>
        <textarea
          value={editingNode.description}
          onChange={(e) => onNodeChange({...editingNode, description: e.target.value})}
          style={{
            width: "100%",
            padding: "8px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "14px",
            minHeight: "80px",
            resize: "vertical",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <button
          onClick={onCancel}
          style={{
            background: "#f5f5f5",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "8px 16px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          Отмена
        </button>
        <button
          onClick={onSave}
          style={{
            background: "#007bff",
            border: "none",
            borderRadius: "4px",
            padding: "8px 16px",
            cursor: "pointer",
            color: "white",
            fontSize: "14px",
          }}
        >
          Сохранить
        </button>
      </div>
    </div>
  );
};