// src/hooks/useFlowData.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useNodesState, useEdgesState, useReactFlow } from "@xyflow/react";
import {
  applyLayout,
  transformApiDataToFlow,
  transformApiDataToFlowAlternative,
} from "../utils/dataTransformer";
import type { CustomNode, CustomEdge, ApiResponse } from "../types";

const edgeStyles = {
  stroke: "#b1b1b7",
  strokeWidth: 2,
};

export const useFlowData = (apiData?: ApiResponse | null) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdge>([]);
  const { fitView, getNodes, getEdges } = useReactFlow();

  const dataProcessedRef = useRef(false);
  const initialLoadRef = useRef(true);
  const [flowKey, setFlowKey] = useState(0);
  const prevApiDataRef = useRef<ApiResponse | null>(null);

  // Функция для обработки данных и установки в React Flow
  const processData = useCallback(() => {
    if (!apiData?.nodes || apiData.nodes.length === 0) {
      console.log("❌ No data to process");
      return false;
    }

    try {
      console.log("🔄 Processing API data:", apiData);

      let flowData;
      let transformerUsed = "main";

      try {
        flowData = transformApiDataToFlow(apiData);

        // Если основной трансформер вернул узлы но нет связей, пробуем альтернативный
        if (flowData.nodes.length > 0 && flowData.edges.length === 0) {
          console.warn(
            "⚠️ Main transformer returned nodes but no edges, trying alternative"
          );
          const altFlowData = transformApiDataToFlowAlternative(apiData);
          if (altFlowData.edges.length > 0) {
            flowData = altFlowData;
            transformerUsed = "alternative";
          }
        }
      } catch (error) {
        console.error("❌ Main transformer failed, using alternative:", error);
        flowData = transformApiDataToFlowAlternative(apiData);
        transformerUsed = "alternative";
      }

      console.log(`✅ ${transformerUsed} transformer result:`, {
        nodes: flowData.nodes.length,
        edges: flowData.edges.length,
      });

      // Если все еще нет узлов, создаем базовые узлы из API данных
      if (flowData.nodes.length === 0) {
        console.warn("⚠️ No nodes created, creating basic nodes from API data");
        flowData.nodes = apiData.nodes.map((item, index) => {
          const nodeId = item["Id узла"] || item.id || `node-${index}`;
          const nodeType = item["Тип"] || item.type || "";
          const nodeName = item["Название"] || item.name || `Node ${index}`;

          const flowNodeType = String(nodeType)
            .toLowerCase()
            .includes("преобразование")
            ? "transformation"
            : "product";

          return {
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
        });
      }

      const improvedEdges = flowData.edges.map((edge: CustomEdge) => ({
        ...edge,
        label: undefined,
        style: edgeStyles,
        type: "smoothstep",
        animated: false,
      }));

      console.log("🎨 Applying layout...");
      const { nodes: layoutedNodes, edges: layoutedEdges } = applyLayout(
        flowData.nodes,
        improvedEdges,
        "TB"
      );

      console.log("🚀 Setting nodes and edges:", {
        nodes: layoutedNodes.length,
        edges: layoutedEdges.length,
      });

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      dataProcessedRef.current = true;
      initialLoadRef.current = false;

      // Принудительный ререндер
      setFlowKey((prev) => prev + 1);

      console.log("🎯 Data processing completed successfully");

      // Несколько попыток fitView с задержками
      setTimeout(() => {
        console.log("🔍 First fitView attempt");
        fitView({ duration: 800, padding: 0.2 });
      }, 100);

      setTimeout(() => {
        console.log("🔍 Second fitView attempt");
        fitView({ duration: 800, padding: 0.2 });
      }, 500);

      return true;
    } catch (error) {
      console.error("💥 Error in processData:", error);
      dataProcessedRef.current = false;
      return false;
    }
  }, [apiData, setNodes, setEdges, fitView]);

  // Функция для принудительного обновления
  const handleRefreshView = useCallback(() => {
    console.log("🔄 Manual refresh triggered");

    dataProcessedRef.current = false;
    initialLoadRef.current = true;

    const success = processData();

    if (!success && apiData?.nodes && apiData.nodes.length > 0) {
      // Если processData не сработал, но данные есть - принудительно установим через альтернативный трансформер
      console.log("🔄 Forcing data refresh with alternative transformer");
      const flowData = transformApiDataToFlowAlternative(apiData);
      setNodes(flowData.nodes);
      setEdges(flowData.edges);

      setTimeout(() => {
        fitView({ duration: 800, padding: 0.2 });
      }, 100);

      return true;
    }

    return success;
  }, [apiData, processData, setNodes, setEdges, fitView]);

  // Применение layout
  const applyFlowLayout = useCallback(
    (direction: "TB" | "LR" = "TB") => {
      const currentNodes = getNodes() as CustomNode[];
      const currentEdges = getEdges() as CustomEdge[];

      if (currentNodes.length === 0) {
        console.warn("⚠️ No nodes to layout");
        return;
      }

      console.log(
        `🎨 Applying ${direction} layout to ${currentNodes.length} nodes and ${currentEdges.length} edges...`
      );

      const { nodes: layoutedNodes, edges: layoutedEdges } = applyLayout(
        currentNodes,
        currentEdges,
        direction
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      setTimeout(() => {
        fitView({ duration: 800, padding: 0.2 });
        console.log("✅ Layout applied and view fitted");
      }, 100);
    },
    [getNodes, getEdges, setNodes, setEdges, fitView]
  );

  // Основной эффект загрузки данных
  useEffect(() => {
    console.log("📦 API Data changed:", {
      hasData: !!apiData,
      nodesCount: apiData?.nodes?.length,
      prevNodesCount: prevApiDataRef.current?.nodes?.length,
    });

    if (apiData?.nodes && apiData.nodes.length > 0) {
      console.log("🎯 Data available, processing...");

      // Проверяем, изменились ли данные
      const dataChanged =
        JSON.stringify(apiData) !== JSON.stringify(prevApiDataRef.current);

      if (dataChanged || !dataProcessedRef.current) {
        console.log("🔄 Data changed or not processed, calling processData");
        const success = processData();

        if (success) {
          prevApiDataRef.current = apiData;
        } else {
          console.error("❌ processData failed, data not cached");
        }
      } else {
        console.log("⚡ Data unchanged, skipping processing");
      }
    } else if (
      apiData === null ||
      (apiData?.nodes && apiData.nodes.length === 0)
    ) {
      console.log("⚠️ No data or empty data, resetting");
      setNodes([]);
      setEdges([]);
      dataProcessedRef.current = false;
      prevApiDataRef.current = null;
    }
  }, [apiData, processData, setNodes, setEdges]);

  // Эффект для принудительного ререндера после установки данных
  useEffect(() => {
    if (nodes.length > 0 && initialLoadRef.current) {
      console.log("🎉 First load with nodes, triggering re-render");
      setFlowKey((prev) => prev + 1);
      initialLoadRef.current = false;
    }
  }, [nodes.length]);

  // Функция для ручного обновления edges (для контекстного меню)
  const setEdgesManual = useCallback(
    (edges: CustomEdge[] | ((edges: CustomEdge[]) => CustomEdge[])) => {
      if (typeof edges === "function") {
        setEdges(edges);
      } else {
        setEdges(edges);
      }
    },
    [setEdges]
  );

  const forceUpdateNodes = useCallback(() => {
    if (apiData) {
      const flowData = transformApiDataToFlow(apiData);
      setNodes(flowData.nodes);
      setEdges(flowData.edges);
    }
  }, [apiData, setNodes, setEdges]);

  return {
    // Данные
    nodes,
    edges,

    // Обработчики изменений
    onNodesChange,
    onEdgesChange,

    // Сеттеры
    setNodes,
    setEdges: setEdgesManual,

    // Функции управления
    handleRefreshView,
    applyFlowLayout,
    forceUpdateNodes,

    // Состояния
    dataProcessed: dataProcessedRef.current,
    initialLoad: initialLoadRef.current,
    flowKey,

    // Дополнительные утилиты
    reprocessData: processData,
  };
};
