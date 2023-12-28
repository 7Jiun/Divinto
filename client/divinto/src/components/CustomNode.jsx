import React, { useState, useEffect, useRef } from 'react';
import './CustomNode.css';
import SimpleMDE from 'react-simplemde-editor';

const CustomNode = ({ data }) => {
  return (
    <div className="custom-node">
      <div className="custom-node-content">{data.label}</div>
      <div className="node-tags">
        {data.tags &&
          data.tags.map((tag, index) => (
            <span key={index} className="node-tag">
              {tag}
            </span>
          ))}
      </div>
    </div>
  );
};

export default CustomNode;
