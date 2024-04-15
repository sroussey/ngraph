import { Edge, Node, Position } from '@xyflow/react'
import { layout, graphlib } from 'dagre'
import { LayoutEngine } from './layout'

export class DagreLayoutEngine extends LayoutEngine {
  name() {
    return 'dagre'
  }

  apply(nodes: Node[], edges: Edge[]): Node[] {
    const g = new graphlib.Graph()
    g.setDefaultEdgeLabel(() => ({}))
    g.setGraph({ rankdir: 'LR' })

    nodes.forEach((node) => {
      g.setNode(node.id, {
        width: node.measured?.width,
        height: node.measured?.height,
      })
    })

    edges.forEach((edge) => {
      g.setEdge(edge.source, edge.target)
    })

    layout(g)

    return nodes.map((node) => {
      const nodeWithPosition = g.node(node.id)
      node.targetPosition = Position.Left
      node.sourcePosition = Position.Right

      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the React Flow node anchor point (top left).
      if (node.measured?.width && node.measured?.height) {
        node.position = {
          x: nodeWithPosition.x - node.measured?.width / 2 + 70,
          y: nodeWithPosition.y - node.measured?.height / 2 + 50,
        }
      }
      return node
    })
  }
}
