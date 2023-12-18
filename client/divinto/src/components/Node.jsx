import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, { MiniMap, Background, useNodesState, useEdgesState } from 'reactflow';
import { convertCardsToNodes, getFirstLineAsTitle } from '../initial-elements';
import { URL } from '../App';
import { driver } from 'driver.js';
import CustomNode from './CustomNode';
import ContextMenu from './ContextMenu';
import Markdown from 'react-markdown';
import SimpleMDE from 'react-simplemde-editor';
import 'reactflow/dist/style.css';
import '../overview.css';
import '../text-updater-note.css';
import '../updatenode.css';
import './MDEditor.css';
import './CustomNode.css';
import { Sidebar } from './Sidebar';

const token = localStorage.getItem('jwtToken');

function updateNodeOnServer(node, updateContent) {
  const title = getFirstLineAsTitle(updateContent);
  fetch(`${URL}/api/card`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      _id: node.id,
      title: title,
      content: updateContent,
      position: node.position,
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

export async function deleteNodeOnServer(nodeId) {
  return fetch(`${URL}/api/card/${nodeId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
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
const NodeType = { CustomNode: CustomNode };

const initialNodes = [];
const initialEdges = [];

let defaultViewport = { x: 80, y: 40, zoom: 0.5 };

export const UpdateNode = () => {
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedNodePage');
    if (hasVisited) return;
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: '#first-step',
          popover: {
            title: '新增卡片',
            description: '點擊白板任意地方以新增空白卡片',
          },
        },
        {
          element: '#second-step',
          popover: {
            title: '卡片編輯器',
            description: '透過編輯器可以輸入文字、上傳照片、嵌入連結',
          },
        },
        {
          element: '.custom-node',
          popover: {
            title: '卡片動作',
            description: '在卡片點擊右鍵，可以新增卡片標籤，下載卡片內容，或是刪除卡片',
          },
        },
        {
          element: '#third-step',
          popover: {
            title: '側邊欄功能',
            description: '點擊查看更多功能',
          },
        },
        {
          element: '#sidebar-search-step',
          popover: {
            title: '搜尋功能',
            description: '點擊跳轉至卡片搜尋頁面，幫助你找到帶有特定關鍵字的卡片',
          },
        },
        {
          element: '#sidebar-chat-step',
          popover: {
            title: 'AI 功能',
            description: `透過 AI 協助整理、反思白板內卡片的內容。
              該白板必須要至少有三張卡片才可以觸發此功能。`,
          },
        },
      ],
    });
    driverObj.drive();
    localStorage.setItem('hasVisitedNodePage', 'true');
  }, []);

  const { id } = useParams();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeContent, setNodeContent] = useState();
  const [nodeBg, setNodeBg] = useState('#000000');
  const [nodeHidden, setNodeHidden] = useState(false);
  const [selectNodeId, setSelectNodeId] = useState();
  const [menu, setMenu] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const menuRef = useRef();
  const reactFlowWrapper = useRef(null);
  const controlsRef = useRef(null);

  const Options = useMemo(() => {
    return {
      autofocus: true,
      spellChecker: false,
      lineWrapping: true,
      toolbar: [
        'bold',
        'italic',
        'heading',
        'unordered-list',
        'ordered-list',
        'link',
        '|',
        {
          name: 'upload-image',
          action: (editor) => uploadImage(editor),
          className: 'fa fa-upload',
          title: '上傳圖片',
        },
        '|',
        'image',
        'preview',
        'side-by-side',
        'fullscreen',
        'guide',
      ],
    };
  }, [selectNodeId]);

  const uploadImage = async (editor) => {
    const fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');
    fileInput.setAttribute('accept', 'image/png, image/jpeg');
    fileInput.click();

    fileInput.onchange = async function () {
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];

        try {
          const file = fileInput.files[0];
          const uploadImage = await uploadToServer(file);
          const cm = editor.codemirror;
          cm.replaceSelection(uploadImage);
        } catch (error) {
          console.error(error);
        }
      }
    };
  };

  const uploadToServer = async (file) => {
    const whiteboardId = id;
    const cardId = selectNodeId;
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${URL}/api/upload/${whiteboardId}/${cardId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('圖片上傳失敗');
    }

    const responseJson = await response.json();
    const markdownExpression = responseJson.data;
    return markdownExpression;
  };

  const onNodeDragStart = (event, node) => {};
  const onNodeDragStop = (event, node) => {
    try {
      const updateContent = node.data.label.props.children[1].props.children;
      updateNodeOnServer(node, updateContent);
    } catch {
      const updateContentChange = node.data.label.props.children.props.children;
      updateNodeOnServer(node, updateContentChange);
    }
  };
  const onNodesDelete = (event) => {
    event.forEach((node) => deleteNodeOnServer(node.id));
  };

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      const nodeElement = event.target.closest('.custom-node');
      const { right, top } = nodeElement.getBoundingClientRect();
      setMenu({
        id: node.id,
        top: top - 80, // 菜单顶部与节点顶部对齐
        left: right, // 菜单左边与节点右边对齐
        right: null, // 不需要使用 right 和 bottom
        bottom: null,
      });
    },
    [setMenu],
  );
  const onMenuPaneClick = useCallback(() => setMenu(null), [setMenu]);

  const onPaneClick = useCallback(
    (event) => {
      if (controlsRef.current && !controlsRef.current.contains(event.target)) {
        setShowControls(false);
        return;
      }

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      fetch(`${URL}/api/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: '',
          whiteboardId: id,
          position: position,
          content: '# 點擊開始編輯卡片',
          tags: [],
        }),
      })
        .then((response) => response.json())
        .then((newCard) => {
          const newNode = {
            ...convertCardsToNodes([newCard])[0],
            type: 'CustomNode',
          };
          setNodes((nds) => nds.concat(newNode));
        })
        .catch((error) => {
          console.error('Error creating card:', error);
        });
    },
    [setNodes, id, showControls],
  );

  const handleNodeClick = (event, node) => {
    setShowControls(true);
    try {
      setNodeContent(
        `${node.data.label.props.children[0].props.children}\n${node.data.label.props.children[1].props.children}`,
      );
    } catch {
      setNodeContent(`${node.data.label.props.children.props.children}`);
    }
    setSelectNodeId(node.id);
  };

  useEffect(() => {
    fetch(`${URL}/api/whiteboard/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((whiteboard) => {
        const cards = whiteboard.data[0].cards;
        const nodes = convertCardsToNodes(cards);
        setNodes(nodes);
      })
      .catch((err) => console.error(err));
  }, [id]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectNodeId) {
          node.data = {
            ...node.data,
            label: (
              <>
                <Markdown>{nodeContent}</Markdown>
              </>
            ),
          };
        }
        try {
          const updateContent = node.data.label.props.children[1].props.children;
          updateNodeOnServer(node, updateContent);
        } catch {
          const updateContentChange = node.data.label.props.children.props.children;
          updateNodeOnServer(node, updateContentChange);
        }
        return node;
      }),
    );
  }, [nodeContent, setNodes]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectNodeId) {
          node.style = { ...node.style, backgroundColor: nodeBg };
        }
        return node;
      }),
    );
  }, [nodeBg, setNodes]);

  return (
    <>
      <div id="third-step">
        <Sidebar />
      </div>
      <div id="first-step" style={{ width: '100vw', height: '92vh' }} ref={reactFlowWrapper}>
        <ReactFlow
          ref={menuRef}
          nodes={nodes}
          edges={edges}
          nodeTypes={NodeType}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onNodesDelete={onNodesDelete}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          style={{ backgroundColor: '	#ADADAD	', height: '100vh' }}
          defaultViewport={defaultViewport}
          onPaneClick={onPaneClick}
          onNodeContextMenu={onNodeContextMenu}
          minZoom={0.2}
          maxZoom={4}
        >
          {showControls && (
            <div ref={controlsRef} id="second-step" className="updatenode__controls">
              <SimpleMDE
                className="myCustomMDE"
                options={Options}
                value={nodeContent}
                onChange={setNodeContent}
              />
            </div>
          )}
          <Background color="#000" />
          {menu && <ContextMenu onClick={onMenuPaneClick} {...menu} />}
          <MiniMap zoomable pannable />
        </ReactFlow>
      </div>
    </>
  );
};
