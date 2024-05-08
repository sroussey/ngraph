import { useCallback } from 'react'
import { Edge, Node, useReactFlow } from '@xyflow/react'

export abstract class LayoutEngine {
  abstract name(): string
  abstract apply(nodes: Node[], edges: Edge[]): Node[]
  constructor() {
    registerLayoutEngine(this)
  }
}

export function useLayoutEngine() {
  const { getNodes, getEdges, setNodes } = useReactFlow()
  return useCallback((engine?: LayoutEngine) => {
    if (!engine) return
    setNodes(computeLayout(engine, getNodes, getEdges))
  }, [])
}

function computeLayout(
  engine: LayoutEngine,
  getNodes: any,
  getEdges: any,
): Node[] {
  const layoutEngine = getLayoutEngine(engine.name())
  if (!layoutEngine) throw new Error(`Unknown layout engine ${engine}`)
  return layoutEngine.apply(getNodes(), getEdges())
}

const layoutEngineRegistry: { [key: string]: LayoutEngine } = {}

function registerLayoutEngine(engine: LayoutEngine) {
  layoutEngineRegistry[engine.name()] = engine
}

export function getLayoutEngine(
  name: keyof typeof layoutEngineRegistry,
): LayoutEngine {
  const engine = layoutEngineRegistry[name]
  if (!engine) {
    throw new Error(`Layout engine '${name}' not found`)
  }
  return engine
}
