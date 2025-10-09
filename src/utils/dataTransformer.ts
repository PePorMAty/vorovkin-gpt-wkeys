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
  const nodeIdMap = new Map();

  console.log("🔄 Starting data transformation with:", apiData);

  if (!apiData?.nodes || !Array.isArray(apiData.nodes)) {
    console.warn("❌ Invalid API data structure");
    return { nodes, edges };
  }

  // Step 1: Create all nodes first
  apiData.nodes.forEach((item, index) => {
    // Use both possible ID field names
    const nodeId = item["Id узла"] || item.Id;
    const nodeType = item["Тип"] || item.type;
    const nodeName = item["Название"] || item.name;

    if (!nodeId) {
      console.warn(`❌ Skipping node at index ${index} - missing ID`);
      return;
    }

    // Determine node type for React Flow
    const flowNodeType = String(nodeType)
      .toLowerCase()
      .includes("преобразование")
      ? "transformation"
      : "product";

    const nodeData = {
      label: String(nodeName),
      description: String(item["Описание"] || item.description || ""),
      originalData: item,
    };

    const node = {
      id: String(nodeId),
      type: flowNodeType,
      position: { x: 0, y: index * 100 }, // Temporary position
      data: nodeData,
      draggable: true,
    };

    nodes.push(node);
    nodeIdMap.set(String(nodeId), true);

    console.log(`✅ Created node: ${nodeId} (${flowNodeType})`);
  });

  console.log(`📊 Created ${nodes.length} nodes`);

  // Step 2: Create edges based on Входы and Выходы
  let edgesCreated = 0;

  apiData.nodes.forEach((item) => {
    const nodeId = item["Id узла"] || item.Id;
    if (!nodeId) return;

    const inputs = item["Входы"] || item.inputs || [];
    const outputs = item["Выходы"] || item.outputs || [];

    console.log(`🔗 Processing connections for node ${nodeId}:`, {
      inputs,
      outputs,
    });

    // Create edges from inputs (other nodes → this node)
    if (Array.isArray(inputs)) {
      inputs.forEach((inputId, index) => {
        const sourceId = String(inputId);
        const targetId = String(nodeId);

        if (nodeIdMap.has(sourceId) && nodeIdMap.has(targetId)) {
          const edgeId = `edge-${sourceId}-${targetId}-input-${index}`;
          // Check if edge already exists
          const edgeExists = edges.some((e) => e.id === edgeId);
          if (!edgeExists) {
            const edge = {
              id: edgeId,
              source: sourceId,
              target: targetId,
              type: "smoothstep",
              animated: false,
              style: { stroke: "#b1b1b7", strokeWidth: 2 },
            };
            edges.push(edge);
            edgesCreated++;
            console.log(`✅ Created input edge: ${sourceId} → ${targetId}`);
          }
        } else {
          console.warn(
            `❌ Cannot create input edge: ${sourceId} → ${targetId} (nodes not found)`
          );
        }
      });
    }

    // Create edges from outputs (this node → other nodes)
    if (Array.isArray(outputs)) {
      outputs.forEach((outputId, index) => {
        const sourceId = String(nodeId);
        const targetId = String(outputId);

        if (nodeIdMap.has(sourceId) && nodeIdMap.has(targetId)) {
          const edgeId = `edge-${sourceId}-${targetId}-output-${index}`;
          // Check if edge already exists
          const edgeExists = edges.some((e) => e.id === edgeId);
          if (!edgeExists) {
            const edge = {
              id: edgeId,
              source: sourceId,
              target: targetId,
              type: "smoothstep",
              animated: false,
              style: { stroke: "#b1b1b7", strokeWidth: 2 },
            };
            edges.push(edge);
            edgesCreated++;
            console.log(`✅ Created output edge: ${sourceId} → ${targetId}`);
          }
        } else {
          console.warn(
            `❌ Cannot create output edge: ${sourceId} → ${targetId} (nodes not found)`
          );
        }
      });
    }
  });

  console.log(
    `🎉 Transformation complete: ${nodes.length} nodes, ${edgesCreated} edges`
  );

  // Log summary of created edges for debugging
  console.log(
    "📋 Created edges:",
    edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    }))
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
