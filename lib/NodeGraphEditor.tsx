import {
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  ReactFlow,
  ReactFlowProps,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
  useStoreApi,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useNodeTypes } from './hooks/config'
import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  JSX,
  CSSProperties,
  useEffect,
  useCallback,
} from 'react'
import { defaultEdgeTypes } from './edge-types'
import { GraphConfig } from './config'
import { useSocketConnect } from './hooks/connect'
import { useHotkeys } from 'react-hotkeys-hook'
import { ClipboardItem } from './clipboard'
import { LayoutEngine, useLayoutEngine } from './layout/layout'
import {
  GraphProvider,
  useGraphApi,
  useGraphStore,
} from './context/GraphContext.tsx'
import { DeserializeFunc, GraphStore, SerializeFunc } from './types/store.ts'
import { GraphSlots } from './types/slots.ts'
import './tailwind.css'
import { Graph } from './types/general.ts'

type NodeGraphEditorProps = Omit<FlowProps, 'edges' | 'nodes'> & {
  onSave?: (data: any) => void
  config: GraphConfig
  slots?: Partial<GraphSlots>
  defaultNodes?: Graph.Node[]
  defaultEdges?: Graph.Edge[]
}

export const NodeGraphEditor = forwardRef<
  NodeGraphHandle,
  NodeGraphEditorProps
>(
  (
    { defaultNodes, defaultEdges, slots, ...props }: NodeGraphEditorProps,
    ref,
  ): JSX.Element => {
    return (
      <GraphProvider
        config={props.config}
        initialNodes={defaultNodes}
        initialEdges={defaultEdges}
        slots={slots}
      >
        <ReactFlowProvider>
          <Flow {...props} ref={ref} />
        </ReactFlowProvider>
      </GraphProvider>
    )
  },
)

type FlowProps = ReactFlowProps<Node, Edge> & {
  backgroundStyles?: CSSProperties
  /**
   * The default layout engine to use when nodes are provided without positions.
   */
  layoutEngine?: LayoutEngine
}
export type NodeGraphHandle = {
  layout: (engine?: LayoutEngine) => void
  serialize: SerializeFunc
  deserialize: DeserializeFunc
  addNode: (node: Node) => void
  removeNode: (node: Node) => void
  updateNode: (node: Partial<Node> & { id: string }) => void
  updateNodeData: (nodeId: string, data: Record<string, any>) => void
  getNode: (nodeId: string) => Node | undefined
  addEdge: (edge: Edge) => void
  removeEdge: (edge: Edge) => void
  updateEdge: (edge: Partial<Edge> & { id: string }) => void
  getEdge: (edgeId: string) => Edge | undefined
  subscribe: (
    listener: (state: GraphStore, prevState: GraphStore) => void,
  ) => () => void
}

const Flow = forwardRef<NodeGraphHandle, FlowProps>(
  ({ backgroundStyles, layoutEngine, ...props }: FlowProps, ref) => {
    const nodeTypes = useNodeTypes()
    const edgeTypes = useMemo(() => defaultEdgeTypes, [])
    const onConnect = useSocketConnect()
    const config = useGraphStore((store) => store.config)
    const { getState } = useStoreApi()
    const { setNodes, setEdges } = useReactFlow()

    // Handle clipboard events
    useHotkeys(
      config.keybindings.copy,
      async () => await ClipboardItem.copyNodesAndEdges(getState()),
    )
    useHotkeys(
      config.keybindings.paste,
      async () => await ClipboardItem.tryReadClipboard(setNodes, setEdges),
    )

    // Provide methods to parent components
    const layout = useLayoutEngine()
    const serialize = useGraphStore((store) => store.serialize)
    const deserialize = useGraphStore((store) => store.deserialize)
    const addNode = useGraphStore((store) => store.addNode)
    const removeNode = useGraphStore((store) => store.removeNode)
    const addEdge = useGraphStore((store) => store.addEdge)
    const removeEdge = useGraphStore((store) => store.removeEdge)
    const updateNode = useGraphStore((store) => store.updateNode)
    const updateEdge = useGraphStore((store) => store.updateEdge)
    const updateNodeData = useGraphStore((store) => store.updateNodeData)
    const getNode = useGraphStore((store) => store.getNode)
    const getEdge = useGraphStore((store) => store.getEdge)
    const subscribe = useGraphApi().subscribe

    useImperativeHandle(
      ref,
      () => ({
        layout,
        serialize,
        deserialize,
        addNode,
        removeNode,
        getNode,
        updateNode,
        updateNodeData,
        addEdge,
        removeEdge,
        updateEdge,
        getEdge,
        subscribe,
      }),
      [
        layout,
        serialize,
        deserialize,
        addNode,
        removeNode,
        getNode,
        updateNode,
        updateNodeData,
        addEdge,
        removeEdge,
        updateEdge,
        getEdge,
        subscribe,
      ],
    )

    const { nodes, edges, graphNodesChange, graphEdgesChange } = useGraphStore(
      (store) => ({
        nodes: store.nodes,
        edges: store.edges,
        graphNodesChange: store.onNodesChange,
        graphEdgesChange: store.onEdgesChange,
      }),
    )

    const handleNodesChange = useCallback(
      (nodes: NodeChange<Node>[]) => {
        graphNodesChange(nodes as NodeChange<Graph.Node>[])
        if (props.onNodesChange) props.onNodesChange(nodes)
      },
      [graphNodesChange, props.onNodesChange],
    )

    const handleEdgesChange = useCallback(
      (edges: EdgeChange<Edge>[]) => {
        graphEdgesChange(edges as EdgeChange<Graph.Edge>[])
        if (props.onEdgesChange) props.onEdgesChange(edges)
      },
      [graphEdgesChange, props.onEdgesChange],
    )

    const initialized = useNodesInitialized()
    useEffect(() => {
      const shouldLayout = !!getState().nodes.find(
        (node) => node.position == undefined,
      )
      if (initialized && shouldLayout && layoutEngine) {
        layout(layoutEngine)
      }
    }, [initialized, layoutEngine])

    return (
      <div
        className="bg-neutral-900"
        style={{
          width: '100%',
          height: '100%',
          ...backgroundStyles,
        }}
      >
        <ReactFlow
          {...props}
          colorMode={props.colorMode ?? 'dark'}
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          deleteKeyCode={config.keybindings.delete}
        >
          {props.children}
        </ReactFlow>
      </div>
    )
  },
)
