import React from 'react';

interface NewNodeModalProps {
  newNodeModal: {
    parentId: string;
    parentType: 'product' | 'transformation';
    newNodeType: 'product' | 'transformation';
  };
  newNodeData: {
    label: string;
    description: string;
  };
  onDataChange: (data: { label: string; description: string }) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const NewNodeModal: React.FC<NewNodeModalProps> = ({
  newNodeModal,
  newNodeData,
  onDataChange,
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
        Добавить новый узел
      </h3>
      
      <div style={{ marginBottom: "16px" }}>
        <p style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#666" }}>
          Тип нового узла: <strong>{newNodeModal.newNodeType === 'product' ? 'Продукт' : 'Преобразование'}</strong>
        </p>
        <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#888" }}>
          {newNodeModal.parentType === 'product' 
            ? 'Продукт может быть связан только с Преобразованием' 
            : 'Преобразование может быть связано только с Продуктом'}
        </p>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "bold" }}>
          Название:
        </label>
        <input
          type="text"
          value={newNodeData.label}
          onChange={(e) => onDataChange({...newNodeData, label: e.target.value})}
          placeholder="Введите название узла"
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
          Описание (необязательно):
        </label>
        <textarea
          value={newNodeData.description}
          onChange={(e) => onDataChange({...newNodeData, description: e.target.value})}
          placeholder="Введите описание узла"
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
          disabled={!newNodeData.label.trim()}
          style={{
            background: "#28a745",
            border: "none",
            borderRadius: "4px",
            padding: "8px 16px",
            cursor: newNodeData.label.trim() ? "pointer" : "not-allowed",
            color: "white",
            fontSize: "14px",
            opacity: newNodeData.label.trim() ? 1 : 0.6,
          }}
        >
          Добавить узел
        </button>
      </div>
    </div>
  );
};