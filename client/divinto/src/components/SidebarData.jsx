import React, { useState } from 'react';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io';

export const SidebarData = [
  {
    title: '首頁',
    path: '/',
    icon: <AiIcons.AiFillHome />,
    cName: 'nav-text',
  },
  {
    title: '白板',
    path: '/whiteboard',
    icon: <IoIcons.IoIosPaper />,
    cName: 'nav-text',
  },
  {
    title: '對話紀錄',
    path: '/agent',
    icon: <AiIcons.AiFillMessage />,
    cName: 'nav-text',
  },
];
