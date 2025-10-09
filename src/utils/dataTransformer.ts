// src/utils/dataTransformer.ts
import dagre from "@dagrejs/dagre";
import { Position } from "@xyflow/react";
import {
  type CustomNode,
  type CustomEdge,
  type CustomNodeData,
  type ApiResponse,
} from "../types";

export function transformApiDataToFlow(apiData: ApiResponse): {
  nodes: CustomNode[];
  edges: CustomEdge[];
} {
  const nodes: CustomNode[] = [];
  const edges: CustomEdge[] = [];

  if (!apiData?.nodes || !Array.isArray(apiData.nodes)) {
    console.warn("Invalid API data structure");
    return { nodes, edges };
  }

  // Создаем узлы
  apiData.nodes.forEach((item, index) => {
    const nodeId = item["Id узла"];
    const nodeType = item["Тип"];
    const nodeName = item["Название"];
    const nodeDescription = item["Описание"] || "";

    if (!nodeId || !nodeType || !nodeName) {
      console.warn("Skipping node - missing required fields");
      return;
    }

    // Определяем тип узла для React Flow
    const flowNodeType = nodeType.toLowerCase().includes("преобразование")
      ? "transformation"
      : "product";

    const nodeData: CustomNodeData = {
      label: String(nodeName),
      description: String(nodeDescription),
      originalData: item,
    };

    const node: CustomNode = {
      id: String(nodeId),
      type: flowNodeType,
      position: { x: 0, y: index * 100 },
      data: nodeData,
      draggable: true,
    };

    nodes.push(node);
  });

  // Создаем связи на основе входов и выходов
  apiData.nodes.forEach((item) => {
    const nodeId = item["Id узла"];

    // Обрабатываем входные связи
    const inputs = item["Входы"] || [];
    if (Array.isArray(inputs)) {
      inputs.forEach((inputId, index) => {
        const sourceId = String(inputId);
        const targetId = String(nodeId);

        const sourceExists = nodes.some((n) => n.id === sourceId);
        const targetExists = nodes.some((n) => n.id === targetId);

        if (sourceExists && targetExists) {
          const edge: CustomEdge = {
            id: `${sourceId}-${targetId}-${index}`,
            source: sourceId,
            target: targetId,
            type: "smoothstep",
            animated: false,
            style: { stroke: "#b1b1b7", strokeWidth: 2 },
          };
          edges.push(edge);
        }
      });
    }

    // Обрабатываем выходные связи
    const outputs = item["Выходы"] || [];
    if (Array.isArray(outputs)) {
      outputs.forEach((outputId, index) => {
        const sourceId = String(nodeId);
        const targetId = String(outputId);

        const sourceExists = nodes.some((n) => n.id === sourceId);
        const targetExists = nodes.some((n) => n.id === targetId);

        if (sourceExists && targetExists) {
          const edge: CustomEdge = {
            id: `${sourceId}-${targetId}-${index}`,
            source: sourceId,
            target: targetId,
            type: "smoothstep",
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

export function applyLayout(
  nodes: CustomNode[],
  edges: CustomEdge[],
  direction: "TB" | "LR" = "TB"
): { nodes: CustomNode[]; edges: CustomEdge[] } {
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
