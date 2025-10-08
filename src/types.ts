import { type Node, type Edge, type NodeProps } from "@xyflow/react";

// Типы для входных данных на основе вашей структуры
export interface InputNode {
  "Id узла": string;
  Тип: string;
  Название: string;
  Описание?: string;
  "Является природным сырьём"?: boolean;
  Входы?: string[];
  Выходы?: string[];
  [key: string]: unknown;
}

export interface ApiResponse {
  nodes: InputNode[];
  has_more?: boolean;
}

export interface CustomNodeData {
  label: string;
  description?: string;
  originalData?: unknown;
  [key: string]: unknown;
}

export interface InitialStateI {
  loading: boolean;
  data: ApiResponse | null; // Убедитесь, что тип правильный
  error: boolean;
}

export type CustomNode = Node<CustomNodeData>;
export type CustomEdge = Edge;

// Добавьте типы для пропсов компонентов узлов
export type ProductNodeProps = NodeProps<CustomNode>;
export type TransformationNodeProps = NodeProps<CustomNode>;

export interface NewNodeData {
  type: 'product' | 'transformation';
  label: string;
  description?: string;
  parentId?: string;
}