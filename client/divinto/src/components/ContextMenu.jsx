import React, { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { getFirstLineAsTitle } from '../initial-elements';

const token = localStorage.getItem('jwtToken');

function updateNodeTagsOnServer(node, updateContent) {
  const title = getFirstLineAsTitle(updateContent);

  fetch(`http://localhost:3000/card`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      _id: node.id,
      position: node.position,
      content: updateContent,
      tags: node.data.tags,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {})
    .catch((error) => {
      console.error('Error updating node:', error);
    });
}

export default function ContextMenu({ id, top, left, right, bottom, ...props }) {
  const { setNodes } = useReactFlow();
  const addNodeTags = useCallback(() => {
    const newTag = prompt('請輸入新標籤:');
    if (newTag) {
      setNodes((prevNodes) => {
        const updatedNodes = prevNodes.map((node) =>
          node.id === id
            ? {
                ...node,
                data: {
                  ...node.data,
                  tags: node.data.tags ? [...node.data.tags, newTag] : [newTag],
                },
              }
            : node,
        );

        // 在這裡找到更新後的節點並發送到後端
        const updatedNode = updatedNodes.find((node) => node.id === id);

        try {
          const updateContent = updatedNode.data.label.props.children[1].props.children;
          updateNodeTagsOnServer(updatedNode, updateContent);
        } catch {
          const updateContentChange = updatedNode.data.label.props.children.props.children;
          updateNodeTagsOnServer(updatedNode, updateContentChange);
        }

        return updatedNodes;
      });
    }
  }, [setNodes]);

  return (
    <div style={{ top, left, right, bottom }} className="context-menu" {...props}>
      <p style={{ margin: '0.5em' }}></p>
      <button onClick={addNodeTags}>add tags</button>
    </div>
  );
}