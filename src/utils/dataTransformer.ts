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

  console.log('🔍 transformApiDataToFlow called with:', apiData);
  
  if (!apiData || !apiData.nodes || !Array.isArray(apiData.nodes)) {
    console.warn('❌ Invalid API data structure:', apiData);
    return { nodes, edges };
  }

  console.log(`📊 Processing ${apiData.nodes.length} nodes from API`);

  // Создаем узлы - ИСПРАВЛЕННАЯ ВЕРСИЯ
  apiData.nodes.forEach((item, index) => {
    console.log(`🔄 Processing node ${index}:`, item);
    
    // ПРОВЕРЯЕМ РАЗНЫЕ ВАРИАНТЫ КЛЮЧЕЙ
    const nodeId = item["Id узла"] || item.id || `node-${index}`;
    const nodeType = item["Тип"] || item.type || '';
    const nodeName = item["Название"] || item.name || `Node ${index}`;
    const nodeDescription = item["Описание"] || item.description || "";
    
    console.log(`📝 Extracted fields:`, { nodeId, nodeType, nodeName, nodeDescription });

    if (!nodeId || !nodeType || !nodeName) {
      console.warn('❌ Skipping node - missing required fields:', { nodeId, nodeType, nodeName });
      return;
    }

    const isTransformation = String(nodeType).toLowerCase().includes("преобразование");
    const finalNodeType = isTransformation ? "transformation" : "product";

    console.log(`✅ Creating ${finalNodeType} node:`, nodeName);

    // ГАРАНТИРУЕМ что description будет строкой
    const nodeData: CustomNodeData = {
      label: String(nodeName),
      description: String(nodeDescription), // Явное преобразование в строку
      originalData: item,
    };

    const node: CustomNode = {
      id: String(nodeId),
      type: finalNodeType,
      position: { x: 0, y: index * 100 },
      data: nodeData,
      draggable: true,
    };

    nodes.push(node);
    console.log(`✅ Added node to array:`, node);
  });

  console.log(`✅ Created ${nodes.length} flow nodes:`, nodes);

  // Создаем связи - ТОЛЬКО ЕСЛИ ЕСТЬ УЗЛЫ
  if (nodes.length === 0) {
    console.warn('⚠️ No nodes created, skipping edge creation');
    return { nodes, edges };
  }

  apiData.nodes.forEach((item) => {
    const nodeId = item["Id узла"] || item.id;
    if (!nodeId) return;

    console.log(`🔗 Processing connections for node: ${nodeId}`);

    // Входные связи
    const inputs = item["Входы"] || item.inputs || [];
    if (inputs && Array.isArray(inputs)) {
      console.log(`📥 Inputs for ${nodeId}:`, inputs);
      
      inputs.forEach((inputId, index) => {
        const sourceId = String(inputId);
        const targetId = String(nodeId);

        const sourceExists = nodes.some(n => n.id === sourceId);
        const targetExists = nodes.some(n => n.id === targetId);

        console.log(`🔗 Input connection ${sourceId} -> ${targetId}:`, {
          sourceExists,
          targetExists,
          allNodeIds: nodes.map(n => n.id) // ДЛЯ ОТЛАДКИ
        });

        if (sourceExists && targetExists) {
          const edge: CustomEdge = {
            id: `${sourceId}-${targetId}-input-${index}`,
            source: sourceId,
            target: targetId,
            type: "smoothstep",
            animated: false,
            label: undefined,
            style: { stroke: "#b1b1b7", strokeWidth: 2 },
          };
          edges.push(edge);
          console.log(`✅ Created input edge: ${edge.id}`);
        } else {
          console.warn(`❌ Skipping input edge - nodes not found: ${sourceId} -> ${targetId}`);
        }
      });
    }

    // Выходные связи
    const outputs = item["Выходы"] || item.outputs || [];
    if (outputs && Array.isArray(outputs)) {
      console.log(`📤 Outputs for ${nodeId}:`, outputs);
      
      outputs.forEach((outputId, index) => {
        const sourceId = String(nodeId);
        const targetId = String(outputId);

        const sourceExists = nodes.some(n => n.id === sourceId);
        const targetExists = nodes.some(n => n.id === targetId);

        console.log(`🔗 Output connection ${sourceId} -> ${targetId}:`, {
          sourceExists,
          targetExists,
          allNodeIds: nodes.map(n => n.id) // ДЛЯ ОТЛАДКИ
        });

        if (sourceExists && targetExists) {
          const edge: CustomEdge = {
            id: `${sourceId}-${targetId}-output-${index}`,
            source: sourceId,
            target: targetId,
            type: "smoothstep",
            animated: false,
            label: undefined,
            style: { stroke: "#b1b1b7", strokeWidth: 2 },
          };
          edges.push(edge);
          console.log(`✅ Created output edge: ${edge.id}`);
        } else {
          console.warn(`❌ Skipping output edge - nodes not found: ${sourceId} -> ${targetId}`);
        }
      });
    }
  });

  console.log(`🎉 Transformation complete: ${nodes.length} nodes, ${edges.length} edges`);
  console.log('📋 Final nodes:', nodes.map(n => ({ id: n.id, type: n.type, label: n.data.label })));
  console.log('🔗 Final edges:', edges.map(e => ({ id: e.id, source: e.source, target: e.target })));

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