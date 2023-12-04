import React, { useState } from 'react';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io';

export const SidebarData = [
  {
    title: 'Home',
    path: '/',
    icon: <AiIcons.AiFillHome />,
    cName: 'nav-text',
  },
  {
    title: 'Whiteboards',
    path: '/whiteboard',
    icon: <IoIcons.IoIosPaper />,
    cName: 'nav-text',
  },
  {
    title: 'Agents',
    path: '/agent',
    icon: <AiIcons.AiFillMessage />,
    cName: 'nav-text',
  },
];
