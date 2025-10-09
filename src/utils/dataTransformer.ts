// src/utils/dataTransformer.ts
import dagre from "@dagrejs/dagre";
import { Position } from "@xyflow/react";
import {
  type CustomNode,
  type CustomEdge,
  type CustomNodeData,
  type ApiResponse,
  type InputNode,
} from "../types";

export function transformApiDataToFlow(apiData: ApiResponse): {
  nodes: CustomNode[];
  edges: CustomEdge[];
} {
  const nodes: CustomNode[] = [];
  const edges: CustomEdge[] = [];

  console.log("🔍 transformApiDataToFlow called with:", apiData);

  if (!apiData?.nodes || !Array.isArray(apiData.nodes)) {
    console.warn("❌ Invalid API data structure");
    return { nodes, edges };
  }

  console.log(`📊 Processing ${apiData.nodes.length} nodes from API`);

  // Создаем lookup map для быстрого поиска узлов по ID
  const nodeIdMap = new Map<string, boolean>();

  // Создаем узлы
  apiData.nodes.forEach((item: InputNode, index: number) => {
    // Используем разные варианты ключей для большей надежности
    const nodeId = item["Id узла"] || item.id || `node-${index}`;
    const nodeType = item["Тип"] || item.type || "";
    const nodeName =
      item["Название"] || item.name || item.label || `Node ${index}`;
    const nodeDescription = item["Описание"] || item.description || "";

    console.log(`📝 Node ${index}:`, { nodeId, nodeType, nodeName });

    if (!nodeId) {
      console.warn("❌ Skipping node - missing node ID");
      return;
    }

    // Определяем тип узла для React Flow
    const flowNodeType = String(nodeType)
      .toLowerCase()
      .includes("преобразование")
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
    nodeIdMap.set(String(nodeId), true);
  });

  console.log(`✅ Created ${nodes.length} flow nodes`);
  console.log("📋 Node IDs:", Array.from(nodeIdMap.keys()));

  // Создаем связи - УЛУЧШЕННАЯ ВЕРСИЯ
  let edgesCreated = 0;

  apiData.nodes.forEach((item: InputNode) => {
    const nodeId = item["Id узла"] || item.id;
    if (!nodeId) return;

    // Получаем входы и выходы разными способами
    const inputs = item["Входы"] || item.inputs || item.Входы || [];
    const outputs = item["Выходы"] || item.outputs || item.Выходы || [];

    console.log(`🔗 Node ${nodeId}:`, { inputs, outputs });

    // Обрабатываем входные связи (другие узлы -> этот узел)
    if (Array.isArray(inputs)) {
      inputs.forEach((inputId: string | number, index: number) => {
        const sourceId = String(inputId);
        const targetId = String(nodeId);

        const sourceExists = nodeIdMap.has(sourceId);
        const targetExists = nodeIdMap.has(targetId);

        if (sourceExists && targetExists) {
          const edge: CustomEdge = {
            id: `edge-${sourceId}-${targetId}-input-${index}-${Date.now()}`,
            source: sourceId,
            target: targetId,
            type: "smoothstep",
            animated: false,
            style: { stroke: "#b1b1b7", strokeWidth: 2 },
          };

          // Проверяем, нет ли уже такой связи
          const edgeExists = edges.some(
            (e) => e.source === sourceId && e.target === targetId
          );

          if (!edgeExists) {
            edges.push(edge);
            edgesCreated++;
            console.log(`✅ Created input edge: ${sourceId} -> ${targetId}`);
          }
        } else {
          console.warn(
            `❌ Skipping input edge - nodes not found: ${sourceId} -> ${targetId}`
          );
        }
      });
    }

    // Обрабатываем выходные связи (этот узел -> другие узлы)
    if (Array.isArray(outputs)) {
      outputs.forEach((outputId: string | number, index: number) => {
        const sourceId = String(nodeId);
        const targetId = String(outputId);

        const sourceExists = nodeIdMap.has(sourceId);
        const targetExists = nodeIdMap.has(targetId);

        if (sourceExists && targetExists) {
          const edge: CustomEdge = {
            id: `edge-${sourceId}-${targetId}-output-${index}-${Date.now()}`,
            source: sourceId,
            target: targetId,
            type: "smoothstep",
            animated: false,
            style: { stroke: "#b1b1b7", strokeWidth: 2 },
          };

          // Проверяем, нет ли уже такой связи
          const edgeExists = edges.some(
            (e) => e.source === sourceId && e.target === targetId
          );

          if (!edgeExists) {
            edges.push(edge);
            edgesCreated++;
            console.log(`✅ Created output edge: ${sourceId} -> ${targetId}`);
          }
        } else {
          console.warn(
            `❌ Skipping output edge - nodes not found: ${sourceId} -> ${targetId}`
          );
        }
      });
    }
  });

  console.log(
    `🎉 Transformation complete: ${nodes.length} nodes, ${edgesCreated} edges created`
  );
  console.log(
    "🔗 Final edges:",
    edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))
  );

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
