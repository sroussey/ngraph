import { Edge as _Edge, Node as _Node } from '@xyflow/react'

export namespace Graph {
  export type NodeData<
    Data extends Record<string, unknown> = Record<string, unknown>,
  > = Data & {
    internal: NodeInternals
  }

  export type Node<Data extends NodeData = NodeData> = _Node<Data> & {
    data: NodeData<Data>
  }
  export type NodeInputOutput = {
    id: string
    name: string
    valueType: string
  }

  export type NodeInternals = {
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
> = Graph.Node<Graph.NodeData<Data>>
