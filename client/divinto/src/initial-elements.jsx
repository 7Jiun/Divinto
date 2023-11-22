import React from 'react';
import { MarkerType, Position } from 'reactflow';
import Markdown from 'react-markdown';

export function mergeCardContents(card) {
  const imageRegex = /!\[.*?\]\(.*?\)/;
  let fullContent = '';
  card.content.main.forEach((blockContent) => {
    console.log(blockContent);
    if (blockContent.content.match(imageRegex)) {
      const images = blockContent.content.split('(');
      console.log(images);
      fullContent += `${images[0]}(${images[1]}`;
    } else {
      fullContent += `${blockContent.content}\n`;
    }
  });
  return fullContent;
}

export function convertCardsToNodes(cards) {
  return cards.map((card) => ({
    id: card._id,
    type: 'input',
    data: {
      label: (
        <>
          {/* <Markdown>{`# ${card.title}`}</Markdown> */}
          <Markdown>{mergeCardContents(card)}</Markdown>
          {/* <Markdown>{`tags: _${card.tags}_`}</Markdown> */}
        </>
      ),
    },
    position: card.position,
    resizing: true,
  }));
}

export function getFirstLineAsTitle(cardContent) {
  const lines = cardContent.split('\n');
  const title = lines[0];
  return title;
}
