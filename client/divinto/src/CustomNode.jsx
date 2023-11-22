import React, { memo, useState, useEffect } from 'react';
import { Handle, useReactFlow, useStoreApi, Position } from 'reactflow';

const options = [
  {
    value: 'smoothstep',
    label: 'Smoothstep',
  },
  {
    value: 'step',
    label: 'Step',
  },
  {
    value: 'default',
    label: 'Bezier (default)',
  },
  {
    value: 'straight',
    label: 'Straight',
  },
];

function Select({ value, handleId, nodeId }) {
  const { setNodes } = useReactFlow();
  const store = useStoreApi();

  const onChange = (evt) => {
    const { nodeInternals } = store.getState();
    setNodes(
      Array.from(nodeInternals.values()).map((node) => {
        if (node.id === nodeId) {
          node.data = {
            ...node.data,
            selects: {
              ...node.data.selects,
              [handleId]: evt.target.value,
            },
          };
        }

        return node;
      }),
    );
  };

  return (
    <div className="custom-node__select">
      <div>Edge Type</div>
      <select className="nodrag" onChange={onChange} value={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Handle type="source" position={Position.Right} id={handleId} />
    </div>
  );
}

function CustomNode({ id, data }) {
  return (
    <>
      <div className="custom-node__header">
        This is a <strong>custom node</strong>
      </div>
      <div className="custom-node__body">
        {Object.keys(data.selects).map((handleId) => (
          <Select key={handleId} nodeId={id} value={data.selects[handleId]} handleId={handleId} />
        ))}
      </div>
    </>
  );
}

export function EditableNode({ data, id }) {
  const [isEditing, setIsEditing] = useState(false);
  const [chanege, setChange] = useState(data);

  const onChange = useEffect(() => {
    // 當 label 變化時，發送更新到服務器
    const updateNode = async () => {
      try {
        await fetch(`/card`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            _id: id,
            content: data,
          },
        });
      } catch (error) {
        console.error('Update failed', error);
      }
    };

    if (data !== data) {
      updateNode();
    }
  }, [data, id]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    // 這裡可以添加進一步的更新邏輯
  };

  return (
    <>
      <Handle type="source" position={Position.Top} />
      <div onDoubleClick={handleDoubleClick}>
        {isEditing ? (
          <input type="text" value={data} onChange={onChange} onBlur={handleBlur} autoFocus />
        ) : (
          <div>{data}</div>
        )}
      </div>
      <Handle type="target" position={Position.Buttom} />
    </>
  );
}

// export default CustomNode;

export default memo(CustomNode);
