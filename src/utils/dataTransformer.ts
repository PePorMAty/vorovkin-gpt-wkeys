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

  if (!apiData || !apiData.nodes || !Array.isArray(apiData.nodes)) {
    return { nodes, edges };
  }

  apiData.nodes.forEach((item, index) => {
    if (!item["Id узла"] || !item["Тип"] || !item["Название"]) {
      return;
    }

    const isTransformation = item["Тип"].toLowerCase().includes("преобразование");
    const nodeType = isTransformation ? "transformation" : "product";

    const nodeData: CustomNodeData = {
      label: item["Название"],
      description: item["Описание"] || "",
      originalData: item,
    };

    const node: CustomNode = {
      id: item["Id узла"],
      type: nodeType,
      position: { x: 0, y: index * 100 },
      data: nodeData,
      draggable: true,
    };

    nodes.push(node);
  });

  apiData.nodes.forEach((item) => {
    if (!item["Id узла"]) return;

    if (item["Входы"] && Array.isArray(item["Входы"])) {
      item["Входы"].forEach((inputId, index) => {
        if (!inputId || typeof inputId !== 'string') {
          return;
        }

        const sourceNodeExists = nodes.some((node) => node.id === inputId);
        const targetNodeExists = nodes.some((node) => node.id === item["Id узла"]);

        if (sourceNodeExists && targetNodeExists) {
          const edge: CustomEdge = {
            id: `${inputId}-${item["Id узла"]}-input-${index}`,
            source: inputId,
            target: item["Id узла"],
            type: "smoothstep",
            animated: false,
            label: undefined,
            style: {
              stroke: "#b1b1b7",
              strokeWidth: 2,
            },
          };
          edges.push(edge);
        }
      });
    }

    if (item["Выходы"] && Array.isArray(item["Выходы"])) {
      item["Выходы"].forEach((outputId, index) => {
        if (!outputId || typeof outputId !== 'string') {
          return;
        }

        const sourceNodeExists = nodes.some((node) => node.id === item["Id узла"]);
        const targetNodeExists = nodes.some((node) => node.id === outputId);

        if (sourceNodeExists && targetNodeExists) {
          const edge: CustomEdge = {
            id: `${item["Id узла"]}-${outputId}-output-${index}`,
            source: item["Id узла"],
            target: outputId,
            type: "smoothstep",
            animated: false,
            label: undefined,
            style: {
              stroke: "#b1b1b7",
              strokeWidth: 2,
            },
          };
          edges.push(edge);
        }
      });
    }
  });

  return { nodes, edges };
}

export function applyLayoutToNodes(
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