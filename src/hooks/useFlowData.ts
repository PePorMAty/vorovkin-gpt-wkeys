import { useCallback, useEffect, useRef, useState } from 'react';
import { useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import { applyLayout, transformApiDataToFlow } from '../utils/dataTransformer';
import { fallbackTransform } from '../utils/fallback';
import type { CustomNode, CustomEdge, ApiResponse } from '../types';

const edgeStyles = {
  stroke: "#b1b1b7",
  strokeWidth: 2,
};

export const useFlowData = (apiData?: ApiResponse | null) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdge>([]);
  const { fitView } = useReactFlow();
  
  const dataProcessedRef = useRef(false);
  const initialLoadRef = useRef(true);
  const [flowKey, setFlowKey] = useState(0);

  // Функция для обработки данных и установки в React Flow
  const processData = useCallback(() => {
    if (!apiData?.nodes || apiData.nodes.length === 0) {
      console.log('❌ No data to process');
      return false;
    }

    try {
      console.log('🔄 Processing API data:', apiData);
      
      let flowData;
      try {
        flowData = transformApiDataToFlow(apiData);
      } catch (error) {
        console.error('❌ Main transformer failed, using fallback:', error);
        flowData = fallbackTransform(apiData);
      }

      // Если основной трансформер вернул пустые узлы, используем fallback
      if (flowData.nodes.length === 0) {
        console.warn('⚠️ Main transformer returned empty nodes, using fallback');
        flowData = fallbackTransform(apiData);
      }

      console.log('✅ transformApiDataToFlow result:', { 
        nodes: flowData.nodes.length, 
        edges: flowData.edges.length 
      });

      const improvedEdges = flowData.edges.map((edge) => ({
        ...edge,
        label: undefined,
        style: edgeStyles,
        type: "smoothstep",
        animated: false,
      }));

      console.log('🎨 Applying layout...');
      const { nodes: layoutedNodes, edges: layoutedEdges } = applyLayout(
        flowData.nodes, 
        improvedEdges, 
        "TB"
      );

      console.log('🚀 Setting nodes and edges:', {
        nodes: layoutedNodes.length,
        edges: layoutedEdges.length
      });

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      
      dataProcessedRef.current = true;
      initialLoadRef.current = false;

      // Принудительный ререндер
      setFlowKey(prev => prev + 1);

      console.log('🎯 Data processing completed successfully');

      // Несколько попыток fitView с задержками
      setTimeout(() => {
        console.log('🔍 First fitView attempt');
        fitView({ duration: 800, padding: 0.2 });
      }, 100);

      setTimeout(() => {
        console.log('🔍 Second fitView attempt');
        fitView({ duration: 800, padding: 0.2 });
      }, 500);

      return true;
    } catch (error) {
      console.error('💥 Error in processData:', error);
      dataProcessedRef.current = false;
      return false;
    }
  }, [apiData, setNodes, setEdges, fitView]);

  // Функция для принудительного обновления
  const handleRefreshView = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    
    dataProcessedRef.current = false;
    initialLoadRef.current = true;
    
    const success = processData();
    
    if (!success && apiData?.nodes && apiData.nodes.length > 0) {
      // Если processData не сработал, но данные есть - принудительно установим через fallback
      console.log('🔄 Forcing data refresh with fallback');
      const flowData = fallbackTransform(apiData);
      setNodes(flowData.nodes);
      setEdges(flowData.edges);
      
      setTimeout(() => {
        fitView({ duration: 800, padding: 0.2 });
      }, 100);
    }
    
    return success;
  }, [apiData, processData, setNodes, setEdges, fitView]);

  // Применение layout
  const applyFlowLayout = useCallback((direction: "TB" | "LR") => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = applyLayout(nodes, edges, direction);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
  }, [nodes, edges, setNodes, setEdges, fitView]);

  // Основной эффект загрузки данных
  useEffect(() => {
    console.log('📦 API Data changed:', apiData);
    console.log('📊 apiData nodes count:', apiData?.nodes?.length);
    
    if (apiData?.nodes && apiData.nodes.length > 0) {
      console.log('🎯 Data available, processing...');
      
      // Проверяем, изменились ли данные
      const dataChanged = JSON.stringify(apiData) !== JSON.stringify(prevApiDataRef.current);
      
      if (dataChanged || !dataProcessedRef.current) {
        console.log('🔄 Data changed or not processed, calling processData');
        processData();
        prevApiDataRef.current = apiData;
      } else {
        console.log('⚡ Data unchanged, skipping processing');
      }
    } else {
      console.log('⚠️ No data or empty data, resetting');
      setNodes([]);
      setEdges([]);
      dataProcessedRef.current = false;
    }
  }, [apiData, processData, setNodes, setEdges]);

  // Ref для отслеживания предыдущих данных
  const prevApiDataRef = useRef<ApiResponse | null>(null);

  // Эффект для принудительного ререндера после установки данных
  useEffect(() => {
    if (nodes.length > 0 && initialLoadRef.current) {
      console.log('🎉 First load with nodes, triggering re-render');
      setFlowKey(prev => prev + 1);
      initialLoadRef.current = false;
    }
  }, [nodes.length]);

  return {
    // Данные
    nodes,
    edges,
    
    // Обработчики изменений
    onNodesChange,
    onEdgesChange,
    
    // Сеттеры
    setNodes,
    setEdges,
    
    // Функции управления
    handleRefreshView,
    applyFlowLayout,
    
    // Состояния
    dataProcessed: dataProcessedRef.current,
    initialLoad: initialLoadRef.current,
    flowKey,
  };
};