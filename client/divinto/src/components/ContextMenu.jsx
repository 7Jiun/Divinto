import React, { useCallback, useState } from 'react';
import { useReactFlow } from 'reactflow';
import { deleteNodeOnServer } from './Node';
import { getFirstLineAsTitle } from '../initial-elements';
import { URL } from '../App';

const token = localStorage.getItem('jwtToken');

function updateNodeTagsOnServer(node, updateContent) {
  const title = getFirstLineAsTitle(updateContent);

  fetch(`${URL}/card`, {
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
  const { setNodes, onNodesDelete } = useReactFlow();
  const [isContextMenuVisible, setIsContextMenuVisible] = useState(true);
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

  const exportCardMarkdown = useCallback(async () => {
    const whiteboardId = location.pathname.split('/')[2];
    const markdown = async () => {
      const response = await fetch(`${URL}/api/markdown/card/${whiteboardId}/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 检查响应是否成功
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      return response.blob(); // 返回 Blob 对象
    };

    const triggerDownload = (blob, filename) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    };

    // 获取 Markdown 内容并触发下载
    try {
      const markdownBlob = await markdown();
      triggerDownload(markdownBlob, 'card-download.zip');
    } catch (error) {
      console.error('下载失败:', error);
    }
  });

  const deleteNode = useCallback(() => {
    const userConfirmation = prompt(
      '此操作不可回復，請輸入[刪除]以刪除該卡片，若不要刪除，請輸入確認以外的內容',
    );
    if (userConfirmation === '刪除') {
      deleteNodeOnServer(id)
        .then(() => {
          setNodes((prevNodes) => {
            const updatedNodes = prevNodes.filter((node) => node.id !== id);
            return updatedNodes;
          });
        })
        .catch((error) => {
          console.error('刪除卡片失敗', error);
        });
    } else {
      alert('刪除卡片失敗');
    }
  });

  const cancelClick = useCallback(() => {
    setIsContextMenuVisible(false);
  });

  return (
    <div>
      {isContextMenuVisible && (
        <div style={{ top, left, right, bottom }} className="context-menu" {...props}>
          <p style={{ margin: '0.5em' }}></p>
          <button onClick={addNodeTags}>新增標籤</button>
          <button onClick={exportCardMarkdown}>輸出卡片</button>
          <button onClick={deleteNode}>刪除卡片</button>
          <button onClick={cancelClick}>取消</button>
        </div>
      )}
    </div>
  );
}
