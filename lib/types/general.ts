import { Edge as _Edge, Node as _Node } from '@xyflow/react'
import { INPUT_GROUPS_FIELD } from '../hooks/node'

export namespace Graph {
  export type NodeDataIO<
    Data extends Record<string, unknown> = Record<string, unknown>,
  > = Data & {
    [INPUT_GROUPS_FIELD]: string[]
    internalIO: NodeIO
  }

  export type Node<Data extends NodeDataIO = NodeDataIO> = _Node<Data>

  export type NodeInputOutput = {
    id: string
    name: string
    valueType: string
  }

  export type NodeIO = {
    inputs: NodeInputOutput[]
    outputs: NodeInputOutput[]
  }

  export type Edge = _Edge & {
    data?: {
      targetHandle: {
        name: string
        valueType: string
      }
    }
  }
}

export type Node<
  Data extends Record<string, unknown> = Record<string, unknown>,
> = Graph.Node<Graph.NodeDataIO<Data>>
