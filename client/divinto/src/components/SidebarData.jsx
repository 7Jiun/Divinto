import React, { useState } from 'react';
import * as FaIcons from 'react-icons/fa';
import * as AiIcons from 'react-icons/ai';
import * as IoIcons from 'react-icons/io';
import { URL } from '../App';

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
    title: 'Reflects',
    path: '/',
    icon: <AiIcons.AiFillHome />,
    cName: 'nav-text',
  },
  {
    title: 'Threads',
    path: '/thread',
    icon: <AiIcons.AiFillMessage />,
    cName: 'nav-text',
  },
  // {
  //   title: 'Create Agent',
  //   path: '/create Agent',
  //   icon: <AiIcons.AiFillHome />,
  //   cName: 'nav-text',
  // },
];
