import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, { MiniMap, Background, useNodesState, useEdgesState } from 'reactflow';
import { convertCardsToNodes, getFirstLineAsTitle } from '../initial-elements';
import { URL } from '../App';
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

function deleteNodeOnServer(nodeId) {
  fetch(`${URL}/api/card/${nodeId}`, {
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
      // Prevent native context menu from showing
      event.preventDefault();

      // Calculate position of the context menu. We want to make sure it
      // doesn't get positioned off-screen.
      const pane = menuRef.current.getBoundingClientRect();
      setMenu({
        id: node.id,
        top: event.clientY < pane.height - 500 && event.clientY,
        left: event.clientX < pane.width - 500 && event.clientX,
        right: event.clientX >= pane.width - 500 && pane.width - event.clientX,
        bottom: event.clientY >= pane.height - 500 && pane.height - event.clientY,
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
      <div style={{ width: '100vw', height: '92vh' }} ref={reactFlowWrapper}>
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
            <div ref={controlsRef} className="updatenode__controls">
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
