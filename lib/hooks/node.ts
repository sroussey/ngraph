import { useCallback, useMemo, useState } from 'react'
import {
  Edge,
  Node,
  useNodeId,
  useNodesData,
  useReactFlow,
  useStore,
} from '@xyflow/react'
import { shallow } from 'zustand/shallow'
import { Draft, produce } from 'immer'
import { Graph } from '../types'

export const INPUT_GROUPS_FIELD = '__inputGroupsExpanded'

/**
 * A drop-in replacement for the useState hook that stores whether an input group is expanded
 * or not in the node's data object. It shares the same underlying array of expanded groups
 * with other hooks that use the same node ID.
 * @param inputGroup
 */
export function useNodeInputGroupState(
  inputGroup: string,
): [boolean, (newState: boolean) => void] {
  const nodeId = useNodeId()
  return useToggleNodeArrayProperty(nodeId!, INPUT_GROUPS_FIELD, inputGroup)
}

/**
 * Toggles a boolean property in the node's data object where the boolean is determined
 * by the presence of the key in property (an array of strings). It is an alternative to
 * just using a boolean property on the root and is useful because it reduces the possibility
 * of collisions with other user-defined properties.
 *
 * @example
 * {
 *     data: {
 *         __inputGroupsExpanded: ['group1', 'group2']
 *     }
 * }
 *
 * @param nodeId
 * @param property
 * @param key
 */
function useToggleNodeArrayProperty(
  nodeId: string,
  property: string,
  key: string,
): [boolean, (newState: boolean) => void] {
  const { updateNodeData } = useReactFlow<Graph.Node>()
  const datainfo = useNodesData<Graph.Node>(nodeId)
  const data = datainfo!.data
  const [isEnabled, setIsEnabled] = useState(
    data![INPUT_GROUPS_FIELD]?.includes(key) ?? false,
  )
  const toggleProperty = useCallback(
    (newState: React.SetStateAction<boolean>) => {
      setIsEnabled(newState)

      updateNodeData(nodeId, (node: Graph.Node) => {
        const currentArray: string[] = (node.data[property] || []) as string[]
        let updatedArray

        if (newState) {
          // Add the property to the array if not already present
          updatedArray = currentArray.includes(key)
            ? currentArray
            : [...currentArray, key]
        } else {
          // Remove the property from the array
          updatedArray = currentArray.filter((item) => item !== key)
        }

        return { ...node.data, [property]: updatedArray } as Graph.NodeDataIO
      })
    },
    [nodeId, property],
  )

  return [isEnabled, toggleProperty]
}

export function useNodeFieldValue<T>(
  field: string,
  defaultValue?: T,
): [T, (value: T) => void] {
  const nodeId = useNodeId()
  const { setNodes } = useReactFlow()
  const datainfo = useNodesData<any>(nodeId!)
  const data = datainfo!.data
  const value = useMemo(
    () => (data ? data[field] : defaultValue) ?? defaultValue,
    [data, defaultValue],
  )
  const updateValue = useCallback(
    (value: T) => {
      setNodes((nodes) =>
        nodes.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, [field]: value } } : n,
        ),
      )
    },
    [nodeId, field],
  )
  return [value, updateValue]
}

export type UpdateNode = (
  id: string,
  dataUpdate:
    | Partial<Graph.Node>
    | ((node: Partial<Graph.Node>) => Partial<Graph.Node>),
  options?: { replace: boolean },
) => void

export type UpdateNodeData<T extends object> = (
  id: string,
  dataUpdate: T | ((node: Node) => T),
  options?: { replace: boolean },
) => void

export function useNodesEdges(nodeId: string): Edge[] {
  return useStore(
    useCallback(
      (s) => {
        return s.edges.filter((e) => e.source === nodeId || e.target === nodeId)
      },
      [nodeId],
    ),
    shallow,
  )
}

const COLLAPSED_FIELD_NAME = '__collapsed'

export function useNodeCollapsed(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useNodeFieldValue(
    COLLAPSED_FIELD_NAME,
    false,
  )
  const toggle = useCallback(
    () => setCollapsed(!collapsed),
    [collapsed, setCollapsed],
  )
  return [collapsed, toggle]
}

type UseNodeInternals = {
  inputs: Graph.NodeIO['inputs']
  outputs: Graph.NodeIO['outputs']
  addOutput: (output: Graph.NodeInputOutput) => void
}

export function useNodeInternalIO(nodeId?: string): UseNodeInternals {
  const currentNodeId = useNodeId()
  if (!nodeId) {
    if (!currentNodeId) {
      throw new Error('useNodeInternalIO must be used inside a node')
    }
    nodeId = currentNodeId
  }

  const { updateNodeData } = useReactFlow<Graph.Node>()

  // Helper function to accept an immer recipe and update the node data accordingly
  const updateInternal = useCallback(
    (recipe: (draft: Draft<Graph.Node>) => void | Graph.NodeDataIO) => {
      updateNodeData(nodeId!, produce(recipe))
    },
    [nodeId, updateNodeData],
  )

  const addOutput = useCallback(
    (output: Graph.NodeInputOutput) => {
      updateInternal((draft) => {
        draft.data.internalIO.outputs.push(output)
      })
    },
    [updateInternal],
  )

  const datainfo = useNodesData<Graph.Node>(nodeId)

  return useMemo(
    () => ({
      inputs: datainfo!.data.internalIO.inputs,
      outputs: datainfo!.data!.internalIO.outputs,
      addOutput,
    }),
    [datainfo, addOutput],
  )
}
