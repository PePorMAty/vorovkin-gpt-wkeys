import React, { useCallback, useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Background,
  ReactFlow,
  addEdge,
  ConnectionLineType,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
  getConnectedEdges,
  type NodeTypes,
  ConnectionMode,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";

import {
  applyLayout,
  transformApiDataToFlow,
} from "../../utils/dataTransformer";
import type { CustomNode, CustomEdge, CustomNodeData } from "../../types";
import type { RootState } from "../../store/store";
import { ProductNode } from "../../components/product-node";
import { TransformationNode } from "../../components/transformation-node";
import { updateNode, deleteNode, addConnection, removeConnection, addNode } from "../../store/slices/gpt/gpt-slice";

import { DebugPanel } from "../../components/DebugPanel/debug-panel";
import { ControlPanel } from "../../components/ControlPanel/control-panel";
import { NodeContextMenu } from "../../components/NodeContextMenu/node-context-menu";
import { EdgeContextMenu } from "../../components/EdgeContextMenu/edge-context-menu";
import { NewNodeModal } from "../../components/NewNodeModal/new-node-modal";
import { EditNodeModal } from "../../components/EditNodeModal/edit-node-modal";
import { LoadingState } from "../../components/LoadingState/loading-state";
import { ErrorState } from "../../components/ErrorState/error-state";

const nodeTypes: NodeTypes = {
  product: ProductNode,
  transformation: TransformationNode,
};

const edgeStyles = {
  stroke: "#b1b1b7",
  strokeWidth: 2,
};

export const Flow: React.FC = () => {
  const dispatch = useDispatch();
  const { data: apiData, loading, error } = useSelector(
    (state: RootState) => state.gpt
  );

  const [flowKey, setFlowKey] = useState(0);
  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdge>([]);
  const { deleteElements, getNode, fitView } = useReactFlow();
  
  const dataProcessedRef = useRef(false);
  const initialLoadRef = useRef(true);

  // Состояния для модальных окон и контекстных меню
  const [nodeMenu, setNodeMenu] = useState<{
    id: string;
    top: number;
    left: number;
    label: string;
    description?: string;
    type: string;
    nodeType: 'product' | 'transformation';
  } | null>(null);

  const [edgeMenu, setEdgeMenu] = useState<{
    id: string;
    top: number;
    left: number;
    sourceId: string;
    targetId: string;
  } | null>(null);

  const [editingNode, setEditingNode] = useState<{
    id: string;
    label: string;
    description: string;
    type: string;
  } | null>(null);

  const [newNodeModal, setNewNodeModal] = useState<{
    parentId: string;
    parentType: 'product' | 'transformation';
    newNodeType: 'product' | 'transformation';
  } | null>(null);

  const [newNodeData, setNewNodeData] = useState({
    label: '',
    description: ''
  });

  // Функция для обработки данных и установки в React Flow
  const processData = useCallback(() => {
    if (!apiData?.nodes || apiData.nodes.length === 0) {
      console.log('No data to process');
      return false;
    }

    try {
      console.log('Processing API data:', apiData);
      
      const { nodes: flowNodes, edges: flowEdges } = transformApiDataToFlow(apiData);

      const improvedEdges = flowEdges.map((edge) => ({
        ...edge,
        label: undefined,
        style: edgeStyles,
        type: "smoothstep",
        animated: false,
      }));

      const { nodes: layoutedNodes, edges: layoutedEdges } = applyLayout(
        flowNodes, 
        improvedEdges, 
        "TB"
      );

      console.log('Setting nodes and edges:', layoutedNodes.length, layoutedEdges.length);
      
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      
      dataProcessedRef.current = true;
      initialLoadRef.current = false;

      // Несколько попыток fitView с задержками
      setTimeout(() => {
        fitView({ duration: 800, padding: 0.2 });
      }, 100);

      setTimeout(() => {
        fitView({ duration: 800, padding: 0.2 });
      }, 500);

      return true;
    } catch (error) {
      console.error('Error processing data:', error);
      dataProcessedRef.current = false;
      return false;
    }
  }, [apiData, setNodes, setEdges, fitView]);

  // Основной эффект загрузки данных - УПРОЩЕННАЯ ВЕРСИЯ
  useEffect(() => {
    console.log('API Data changed:', apiData);
    
    if (apiData?.nodes && apiData.nodes.length > 0) {
      console.log('Data available, processing...');
      processData();
    } else {
      console.log('No data or empty data');
      // Сбросить состояние если данных нет
      setNodes([]);
      setEdges([]);
      dataProcessedRef.current = false;
    }
  }, [apiData, processData, setNodes, setEdges]);

  // Функция для принудительного обновления
  const handleRefreshView = useCallback(() => {
    console.log('Manual refresh triggered');
    
    // Сбрасываем флаги
    dataProcessedRef.current = false;
    initialLoadRef.current = true;
    
    // Принудительно обновляем ключ
    setFlowKey(prev => prev + 1);
    
    // Перезагружаем данные
    const success = processData();
    
    if (!success && apiData?.nodes && apiData.nodes.length > 0) {
      // Если processData не сработал, но данные есть - принудительно установим
      const { nodes: flowNodes, edges: flowEdges } = transformApiDataToFlow(apiData);
      setNodes(flowNodes);
      setEdges(flowEdges);
      
      setTimeout(() => {
        fitView({ duration: 800, padding: 0.2 });
      }, 100);
    }
    
    return success;
  }, [apiData, processData, setNodes, setEdges, fitView]);

  // Остальные функции остаются без изменений...
  const isValidConnection = useCallback(
    (edge: Connection | Edge) => {
      const connection = edge as Connection;
      
      if (!connection.source || !connection.target) return false;

      const sourceNode = getNode(connection.source);
      const targetNode = getNode(connection.target);

      if (!sourceNode || !targetNode) return false;

      const sourceType = sourceNode.type;
      const targetType = targetNode.type;

      return (
        (sourceType === 'product' && targetType === 'transformation') ||
        (sourceType === 'transformation' && targetType === 'product')
      );
    },
    [getNode]
  );

  const getAvailableNodeType = useCallback((nodeType: 'product' | 'transformation'): 'product' | 'transformation' => {
    return nodeType === 'product' ? 'transformation' : 'product';
  }, []);

  const handleAddNewNode = useCallback((parentId: string, parentType: 'product' | 'transformation') => {
    const newNodeType = getAvailableNodeType(parentType);
    setNewNodeModal({
      parentId,
      parentType,
      newNodeType
    });
    setNewNodeData({
      label: '',
      description: ''
    });
    setNodeMenu(null);
  }, [getAvailableNodeType]);

  const handleSaveNewNode = useCallback(() => {
    if (newNodeModal && newNodeData.label.trim()) {
      dispatch(addNode({
        nodeData: {
          type: newNodeModal.newNodeType,
          label: newNodeData.label,
          description: newNodeData.description
        },
        parentId: newNodeModal.parentId
      }));
      setNewNodeModal(null);
      setNewNodeData({ label: '', description: '' });
    }
  }, [newNodeModal, newNodeData, dispatch]);

  const handleCancelNewNode = useCallback(() => {
    setNewNodeModal(null);
    setNewNodeData({ label: '', description: '' });
  }, []);

  const handleEditNode = useCallback((nodeId: string) => {
    const node = getNode(nodeId);
    if (node) {
      const nodeData = node.data as CustomNodeData;
      const originalNode = apiData?.nodes?.find(n => n["Id узла"] === nodeId);
      
      setEditingNode({
        id: nodeId,
        label: nodeData.label,
        description: nodeData.description || "",
        type: originalNode?.["Тип"] || ""
      });
      setNodeMenu(null);
    }
  }, [getNode, apiData]);

  const handleSaveNode = useCallback(() => {
    if (editingNode) {
      dispatch(updateNode({
        nodeId: editingNode.id,
        updates: {
          "Название": editingNode.label,
          "Описание": editingNode.description
        }
      }));
      setEditingNode(null);
    }
  }, [editingNode, dispatch]);

  const handleCancelEdit = useCallback(() => {
    setEditingNode(null);
  }, []);

  const handleDeleteNode = useCallback((nodeId: string) => {
    const nodeToDelete = getNode(nodeId);
    if (!nodeToDelete) return;

    const connectedEdges = getConnectedEdges([nodeToDelete], edges);
    const edgeIdsToDelete = connectedEdges.map(edge => edge.id);

    dispatch(deleteNode(nodeId));
    
    deleteElements({
      nodes: [{ id: nodeId }],
      edges: edgeIdsToDelete.map(id => ({ id })),
    });
    
    setNodeMenu(null);
  }, [edges, deleteElements, getNode, dispatch]);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    const edge = edges.find(e => e.id === edgeId);
    if (edge) {
      dispatch(removeConnection({
        sourceId: edge.source,
        targetId: edge.target
      }));
      
      setEdges(eds => eds.filter(e => e.id !== edgeId));
    }
    setEdgeMenu(null);
  }, [edges, setEdges, dispatch]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!isValidConnection(params)) {
        return;
      }

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: ConnectionLineType.SmoothStep,
            animated: false,
            style: edgeStyles,
            label: undefined,
          },
          eds
        )
      );

      if (params.source && params.target) {
        dispatch(addConnection({
          sourceId: params.source,
          targetId: params.target
        }));
      }
    },
    [setEdges, dispatch, isValidConnection]
  );

  const onEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      setEdgeMenu({
        id: edge.id,
        top: event.clientY + 10,
        left: event.clientX + 10,
        sourceId: edge.source,
        targetId: edge.target,
      });
      setNodeMenu(null);
    },
    []
  );

  const onEdgesChangeCustom = useCallback(
    (changes: EdgeChange[]) => {
      changes.forEach(change => {
        if (change.type === 'remove') {
          const edge = edges.find(e => e.id === change.id);
          if (edge) {
            dispatch(removeConnection({
              sourceId: edge.source,
              targetId: edge.target
            }));
          }
        }
      });
      
      onEdgesChange(changes);
    },
    [edges, onEdgesChange, dispatch]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const nodeData = node.data as CustomNodeData;
      const originalNode = apiData?.nodes?.find(n => n["Id узла"] === node.id);

      setNodeMenu({
        id: node.id,
        top: event.clientY + 10,
        left: event.clientX + 10,
        label: nodeData.label,
        description: nodeData.description,
        type: originalNode?.["Тип"] || "",
        nodeType: node.type as 'product' | 'transformation'
      });
      setEdgeMenu(null);
    },
    [apiData]
  );

  if (loading) {
    return <LoadingState message="Загрузка данных из GPT..." />;
  }

  if (error) {
    return <ErrorState message="Ошибка при загрузке данных" />;
  }

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <DebugPanel 
        nodes={nodes}
        edges={edges}
        apiData={apiData}
        flowKey={flowKey}
        dataProcessed={dataProcessedRef.current}
        initialLoad={initialLoadRef.current}
      />

      <ReactFlow
        key={`flow-${flowKey}`}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange as (changes: NodeChange[]) => void}
        onEdgesChange={onEdgesChangeCustom as (changes: EdgeChange[]) => void}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={() => {
          setNodeMenu(null);
          setEdgeMenu(null);
        }}
        connectionLineType={ConnectionLineType.SmoothStep}
        nodesDraggable={true}
        nodeTypes={nodeTypes}
        fitView
        maxZoom={10}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: edgeStyles,
          animated: false,
          label: undefined,
        }}
        elevateEdgesOnSelect={true}
        elevateNodesOnSelect={true}
        selectNodesOnDrag={false}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode={null}
        isValidConnection={isValidConnection}
      >
        <ControlPanel 
          onRefreshView={handleRefreshView}
          onVerticalLayout={() => {
            const { nodes: layoutedNodes, edges: layoutedEdges } = applyLayout(nodes, edges, "TB");
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
            setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
          }}
          onHorizontalLayout={() => {
            const { nodes: layoutedNodes, edges: layoutedEdges } = applyLayout(nodes, edges, "LR");
            setNodes(layoutedNodes);
            setEdges(layoutedEdges);
            setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
          }}
        />
        <Background />

        {/* Модальные окна и контекстные меню */}
        {nodeMenu && (
          <NodeContextMenu
            nodeMenu={nodeMenu}
            onAddNode={handleAddNewNode}
            onEditNode={() => handleEditNode(nodeMenu.id)}
            onDeleteNode={() => handleDeleteNode(nodeMenu.id)}
            onClose={() => setNodeMenu(null)}
          />
        )}

        {edgeMenu && (
          <EdgeContextMenu
            edgeMenu={edgeMenu}
            onDeleteEdge={() => handleDeleteEdge(edgeMenu.id)}
            onClose={() => setEdgeMenu(null)}
          />
        )}

        {newNodeModal && (
          <NewNodeModal
            newNodeModal={newNodeModal}
            newNodeData={newNodeData}
            onDataChange={setNewNodeData}
            onSave={handleSaveNewNode}
            onCancel={handleCancelNewNode}
          />
        )}

        {editingNode && (
          <EditNodeModal
            editingNode={editingNode}
            onNodeChange={setEditingNode}
            onSave={handleSaveNode}
            onCancel={handleCancelEdit}
          />
        )}
      </ReactFlow>
    </div>
  );
};