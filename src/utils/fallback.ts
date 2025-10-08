import type { CustomNode, CustomEdge, ApiResponse, CustomNodeData } from "../types";

export const fallbackTransform = (apiData: ApiResponse): { nodes: CustomNode[]; edges: CustomEdge[] } => {
  console.warn('🆘 USING FALLBACK TRANSFORMER');
  console.log('Fallback input data:', apiData);
  
  const nodes: CustomNode[] = [];
  const edges: CustomEdge[] = [];

  if (!apiData?.nodes) {
    console.warn('No nodes in fallback data');
    return { nodes, edges };
  }

  // Простая логика создания узлов
  apiData.nodes.forEach((item, index: number) => {
    if (!item) return;

    // Пробуем разные варианты ключей
    const id = item["Id узла"] || item.id || item.nodeId || `node-${index}`;
    const typeRaw = item["Тип"] || item.type || 'product';
    const name = item["Название"] || item.name || item.label || `Node ${index}`;
    const description = item["Описание"] || item.description || "";
    
    const isTransformation = String(typeRaw).toLowerCase().includes("преобразование");
    const nodeType = isTransformation ? "transformation" : "product";

    console.log(`Fallback creating node:`, { id, nodeType, name });

    const nodeData: CustomNodeData = {
      label: String(name),
      description: String(description), // Явное преобразование в строку
      originalData: item,
    };

    nodes.push({
      id: String(id),
      type: nodeType,
      position: { x: index * 200, y: 0 },
      data: nodeData,
      draggable: true,
    });
  });

  console.log(`Fallback created ${nodes.length} nodes`);
  return { nodes, edges };
};