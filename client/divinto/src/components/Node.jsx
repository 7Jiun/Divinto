import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState } from 'reactflow';
import { convertCardsToNodes, getFirstLineAsTitle } from '../initial-elements';
import 'reactflow/dist/style.css';
import '../overview.css';
import '../text-updater-note.css';
import '../updatenode.css';
import Markdown from 'react-markdown';
import SimpleMDE from 'react-simplemde-editor';
import './MDEditor.css';
import './CustomNode.css';
import CustomNode from './CustomNode';
import ContextMenu from './ContextMenu';

const token = localStorage.getItem('jwtToken');

function updateNodeOnServer(node, updateContent) {
  const title = getFirstLineAsTitle(updateContent);
  fetch(`http://localhost:3000/card`, {
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
  fetch(`http://localhost:3000/card/${nodeId}`, {
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
const defaultViewport = { x: 80, y: 40, zoom: 0.5 };

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
      fetch(`http://localhost:3000/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: '',
          whiteboardId: id,
          position: position,
          content: '# a wonderful new card',
          tags: ['excited'],
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
    fetch(`http://localhost:3000/whiteboard/${id}`, {
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
          // it's important that you create a new object here
          // in order to notify react flow about the change
          node.style = { ...node.style, backgroundColor: nodeBg };
        }
        return node;
      }),
    );
  }, [nodeBg, setNodes]);

  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectNodeId) {
          // when you update a simple type you can just update the value
          node.hidden = nodeHidden;
        }
        return node;
      }),
    );
    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.id === 'e1-2') {
          edge.hidden = nodeHidden;
        }
        return edge;
      }),
    );
  }, [nodeHidden, setNodes, setEdges]);

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
          onPaneClick={onPaneClick}
          onNodeContextMenu={onNodeContextMenu}
          defaultViewport={defaultViewport}
          minZoom={0.2}
          maxZoom={4}
        >
          {showControls && (
            <div ref={controlsRef} className="updatenode__controls">
              <SimpleMDE className="myCustomMDE" value={nodeContent} onChange={setNodeContent} />
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
