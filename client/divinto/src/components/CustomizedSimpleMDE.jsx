import React, { useState } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import './MDEditor.css';
import { URL } from '../App';

const uploadToServer = async (file) => {
  const url = await fetch(`${URL}/api/upload/:whiteboardId/:cardId`);
};

function CustomSimpleMDEEditor() {
  const [value, setValue] = useState('');

  const uploadImage = (editor) => {
    const fileInput = document.createElement('input');
    fileInput.setAttribute('type', 'file');
    fileInput.setAttribute('accept', 'image/*');
    fileInput.click();

    fileInput.onchange = async function () {
      const file = fileInput.files[0];
      // 處理文件上傳的邏輯。這裡您需要實現將文件上傳到後端服務器的代碼。
      // 例如：
      // const url = await uploadToServer(file);
      // const cm = editor.codemirror;
      // const output = `![](${url})`;
      // cm.replaceSelection(output);

      // 您需要在這裡替換上述代碼，以將圖片上傳到您的服務器。
    };
  };

  const options = {
    toolbar: [
      'bold',
      'italic',
      'strikethrough',
      'heading',
      '|',
      'quote',
      'code',
      'table',
      'horizontal-rule',
      'unordered-list',
      'ordered-list',
      '|',
      {
        name: 'upload-image',
        action: (editor) => uploadImage(editor),
        className: 'fa fa-upload',
        title: '上傳圖片',
      },
      '|',
      'link',
      'image',
      'preview',
      'side-by-side',
      'fullscreen',
      '|',
      'guide',
    ],
  };

  return <SimpleMDE options={options} />;
}

export default CustomSimpleMDEEditor;
