import { memo, useCallback } from 'react'
import type { NodeInputConfig, ValueTypeConfig } from '../config'
import { useNodeFieldValue } from '../hooks/node'
import type { BaseInputProps } from '../components/inputs'
import { Checkbox } from '../aria/Checkbox'

type NodeCheckboxFieldProps = BaseInputProps & NodeInputConfig & ValueTypeConfig

export const NodeCheckboxField = memo(
  ({ isConstant, name, onFocus, onBlur, slots, ...props }: NodeCheckboxFieldProps) => {
    const Handle = slots?.Handle
    const [value, setValue] = useNodeFieldValue(props.id, props.defaultValue)

    const handleChange = useCallback(
      (checked) => setValue(checked),
      [setValue],
    )

    return (
      <div
        style={{
          margin: '4px 0',
          padding: '0 12px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {isConstant || !Handle ? null : <Handle />}
        
        <Checkbox
          value={value}
          onBlur={onBlur}
          onChange={handleChange}
          onFocus={onFocus}
          onFocusChange={() => {}}
          onHoverChange={() => {}}
          onHoverEnd={() => {}}
          onHoverStart={() => {}}
          onKeyDown={() => {}}
          onKeyUp={() => {}}
        >
          {name}
        </Checkbox>
      </div>
    )
  },
)
