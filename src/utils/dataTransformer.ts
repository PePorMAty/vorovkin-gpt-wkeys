// src/utils/dataTransformer.ts
import dagre from "@dagrejs/dagre";
import { Position } from "@xyflow/react";
import {
  type CustomNode,
  type CustomEdge,
  type ApiResponse,
  type InputNode,
} from "../types";

// src/utils/dataTransformer.ts
export function transformApiDataToFlow(apiData: ApiResponse): {
  nodes: CustomNode[];
  edges: CustomEdge[];
} {
  const nodes: CustomNode[] = [];
  const edges: CustomEdge[] = [];

  if (!apiData?.nodes || !Array.isArray(apiData.nodes)) {
    return { nodes, edges };
  }

  // Создаем узлы
  apiData.nodes.forEach((item, index) => {
    const nodeId = item["Id узла"] || item.id;
    const nodeType = item["Тип"] || item.type;
    const nodeName = item["Название"] || item.name;

    if (!nodeId) return;

    const flowNodeType = String(nodeType)
      .toLowerCase()
      .includes("преобразование")
      ? "transformation"
      : "product";

    const node: CustomNode = {
      id: String(nodeId),
      type: flowNodeType,
      position: { x: 0, y: index * 100 },
      data: {
        label: String(nodeName),
        description: String(item["Описание"] || item.description || ""),
        originalData: item,
      },
      draggable: true,
    };

    nodes.push(node);
  });

  // Создаем связи
  apiData.nodes.forEach((item) => {
    const nodeId = item["Id узла"] || item.id;
    if (!nodeId) return;

    // Входные связи
    const inputs = item["Входы"] || [];
    if (Array.isArray(inputs)) {
      inputs.forEach((inputId, index) => {
        const sourceId = String(inputId);
        const targetId = String(nodeId);

        const sourceExists = nodes.some((n) => n.id === sourceId);
        const targetExists = nodes.some((n) => n.id === targetId);

        if (sourceExists && targetExists) {
          const edge: CustomEdge = {
            id: `edge-${sourceId}-${targetId}-input-${index}`,
            source: sourceId,
            target: targetId,
            type: "smoothstep" as const,
            animated: false,
            style: { stroke: "#b1b1b7", strokeWidth: 2 },
          };
          edges.push(edge);
        }
      });
    }

    // Выходные связи
    const outputs = item["Выходы"] || [];
    if (Array.isArray(outputs)) {
      outputs.forEach((outputId, index) => {
        const sourceId = String(nodeId);
        const targetId = String(outputId);

        const sourceExists = nodes.some((n) => n.id === sourceId);
        const targetExists = nodes.some((n) => n.id === targetId);

        if (sourceExists && targetExists) {
          const edge: CustomEdge = {
            id: `edge-${sourceId}-${targetId}-output-${index}`,
            source: sourceId,
            target: targetId,
            type: "smoothstep" as const,
            animated: false,
            style: { stroke: "#b1b1b7", strokeWidth: 2 },
          };
          edges.push(edge);
        }
      });
    }
  });

  return { nodes, edges };
}

// Альтернативная функция если вышеописанная не работает
export function transformApiDataToFlowAlternative(apiData: ApiResponse): {
  nodes: CustomNode[];
  edges: CustomEdge[];
} {
  const nodes: CustomNode[] = [];
  const edges: CustomEdge[] = [];

  if (!apiData?.nodes) return { nodes, edges };

  // Создаем узлы
  apiData.nodes.forEach((item: InputNode, index: number) => {
    const nodeId = item["Id узла"] || item.id || `node-${index}`;
    const nodeType = item["Тип"] || item.type || "";
    const nodeName = item["Название"] || item.name || `Node ${index}`;

    const flowNodeType = String(nodeType)
      .toLowerCase()
      .includes("преобразование")
      ? "transformation"
      : "product";

    const node: CustomNode = {
      id: String(nodeId),
      type: flowNodeType,
      position: { x: 0, y: index * 100 },
      data: {
        label: String(nodeName),
        description: String(item["Описание"] || item.description || ""),
        originalData: item,
      },
      draggable: true,
    };

    nodes.push(node);
  });

  // Простой способ создания связей - проверяем все возможные комбинации
  apiData.nodes.forEach((item: InputNode) => {
    const nodeId = String(item["Id узла"] || item.id);

    // Проверяем все возможные варианты ключей для связей
    const connectionFields = [
      item["Входы"],
      item["Выходы"],
      item.inputs,
      item.outputs,
      item.Входы,
      item.Выходы,
    ];

    connectionFields.forEach((connections, fieldIndex) => {
      if (Array.isArray(connections)) {
        connections.forEach((targetId: string | number) => {
          const sourceId = fieldIndex % 2 === 0 ? String(targetId) : nodeId;
          const actualTargetId =
            fieldIndex % 2 === 0 ? nodeId : String(targetId);

          const sourceExists = nodes.some((n) => n.id === sourceId);
          const targetExists = nodes.some((n) => n.id === actualTargetId);

          if (sourceExists && targetExists) {
            const edgeExists = edges.some(
              (e) => e.source === sourceId && e.target === actualTargetId
            );

            if (!edgeExists) {
              edges.push({
                id: `edge-${sourceId}-${actualTargetId}-${Date.now()}-${Math.random()}`,
                source: sourceId,
                target: actualTargetId,
                type: "smoothstep",
                animated: false,
                style: { stroke: "#b1b1b7", strokeWidth: 2 },
              });
            }
          }
        });
      }
    });
  });

  return { nodes, edges };
}

export function applyLayout(
  nodes: CustomNode[],
  edges: CustomEdge[],
  direction: "TB" | "LR" = "TB"
): { nodes: CustomNode[]; edges: CustomEdge[] } {
  if (nodes.length === 0) return { nodes, edges };

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 200;
  const nodeHeight = 80;
  const isHorizontal = direction === "LR";

  dagreGraph.setGraph({
    rankdir: direction,
    ranksep: 100,
    nodesep: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
