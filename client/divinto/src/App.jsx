import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState } from 'reactflow';
import { convertCardsToNodes, getFirstLineAsTitle } from './initial-elements';
import 'reactflow/dist/style.css';
import './overview.css';
import './text-updater-note.css';
import './updatenode.css';
import Markdown from 'react-markdown';

const url = 'http://localhost:3000';

function updateNodeOnServer(node, updateContent) {
  const title = getFirstLineAsTitle(updateContent);
  fetch(`http://localhost:3000/card`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      _id: node.id,
      title: title,
      content: updateContent,
      position: node.position,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      console.log('Node updated successfully', data);
    })
    .catch((error) => {
      console.error('Error updating node:', error);
    });
}

const initialNodes = [];
const initialEdges = [];
const defaultViewport = { x: 80, y: 40, zoom: 0.5 };

const UpdateNode = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeContent, setNodeContent] = useState();
  const [nodeBg, setNodeBg] = useState('#eee');
  const [nodeHidden, setNodeHidden] = useState(false);
  const [selectNodeId, setSelectNodeId] = useState();
  const reactFlowWrapper = useRef(null);

  const onNodeDragStart = (event, node) => console.log('drag start', node);
  const onNodeDragStop = (event, node) => {
    try {
      const updateContent = node.data.label.props.children[1].props.children;
      updateNodeOnServer(node, updateContent);
    } catch {
      const updateContentChange = node.data.label.props.children.props.children;
      updateNodeOnServer(node, updateContentChange);
    }
    console.log('drag stop', node);
  };

  const handleNodeClick = (event, node) => {
    try {
      setNodeContent(
        `${node.data.label.props.children[0].props.children}\n${node.data.label.props.children[1].props.children}`,
      );
    } catch {
      setNodeContent(`${node.data.label.props.children.props.children}`);
    }
    setSelectNodeId(node.id);
  };

  const onPaneClick = useCallback(
    (event) => {
      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };
      fetch(`http://localhost:3000/card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '',
          whiteboardId: '655707e16e10510551747f04',
          position: position,
          content: '# a wonderful new card',
          tags: ['excited'],
        }),
      })
        .then((response) => response.json())
        .then((newCard) => {
          const newNode = convertCardsToNodes([newCard]);
          setNodes((nds) => nds.concat(newNode));
        })
        .catch((error) => {
          console.error('Error creating card:', error);
        });
    },
    [setNodes],
  );

  useEffect(() => {
    fetch(`http://localhost:3000/whiteboard/655707e16e10510551747f04`)
      .then((res) => res.json())
      .then((whiteboard) => {
        const cards = whiteboard.data[0].cards;

        const nodes = convertCardsToNodes(cards);
        setNodes(nodes);
      })
      .catch((err) => console.error(err));
  }, []);

  // useEffect(() => {
  //   const onDoubleClick = (event) => {
  //     // 假設 createNodeOnServer 和 convertCardsToNodes 函數已定義
  //     const newNode = createNodeOnServer(event.clientX, event.clientY);
  //     const convertedNewNode = convertCardsToNodes([newNode]);
  //     setNodes((nds) => nds.concat(convertedNewNode));

  //     // 重置 paneClick 狀態
  //     setPaneClick(0);
  //   };

  //   const currentWrapper = reactFlowWrapper.current;
  //   currentWrapper.addEventListener('dblclick', onDoubleClick);

  //   return () => {
  //     currentWrapper.removeEventListener('dblclick', onDoubleClick);
  //   };
  // }, [paneClick, setPaneClick, setNodes]);

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
        console.log(node);
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
    <div style={{ width: '100vw', height: '100vh' }} ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onPaneClick={onPaneClick}
        defaultViewport={defaultViewport}
        minZoom={0.2}
        maxZoom={4}
      >
        <div className="updatenode__controls">
          <label>text:</label>
          <textarea value={nodeContent} onChange={(evt) => setNodeContent(evt.target.value)} />

          <label className="updatenode__bglabel">background:</label>
          <input value={nodeBg} onChange={(evt) => setNodeBg(evt.target.value)} />

          <div className="updatenode__checkboxwrapper">
            <label>hidden:</label>
            <input
              type="checkbox"
              checked={nodeHidden}
              onChange={(evt) => setNodeHidden(evt.target.checked)}
            />
          </div>
        </div>
        <Controls />
        <Background color="#000" />
        <MiniMap zoomable pannable />
      </ReactFlow>
    </div>
  );
};

export default UpdateNode;
