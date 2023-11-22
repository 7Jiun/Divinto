import { useCallback, useState } from 'react';
import { Handle, Position } from 'reactflow';
import Markdown from 'react-markdown';

const handleStyle = { left: 10 };

function TextUpdaterNode({ data, isConnectable }) {
  const onChange = useCallback((evt) => {
    const originalValue = evt.target.value;
  }, []);

  return (
    <div className="text-updater-node">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div>
        <label htmlFor="text">Text:</label>
        <textarea id="text" name="text" onChange={onChange} className="nodrag" />
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        style={handleStyle}
        isConnectable={isConnectable}
      />
      <Handle type="source" position={Position.Bottom} id="b" isConnectable={isConnectable} />
    </div>
  );
}

function MarkdownEditorNode({ data: { content, tags }, isConnectable }) {
  const [input, setInput] = useState();
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  return (
    <>
      <div className="text-updater-node" onDoubleClick={toggleEdit}>
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
        {isEditing ? (
          <textarea
            className="markdown-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter Markdown text"
          />
        ) : (
          <div className="text-updater-node">
            <Markdown>{input}</Markdown>
          </div>
        )}
        <Handle
          type="source"
          position={Position.Bottom}
          id="a"
          style={handleStyle}
          isConnectable={isConnectable}
        />
        <Handle type="source" position={Position.Bottom} id="b" isConnectable={isConnectable} />
      </div>
    </>
  );
}

export default TextUpdaterNode;
