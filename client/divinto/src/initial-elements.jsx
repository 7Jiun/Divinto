import React from 'react';
import Markdown from 'react-markdown';

function getDate() {
  const today = new Date();

  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  const dateString = `${month}-${day}`;

  return dateString;
}

export function mergeCardContents(card) {
  const imageRegex = /!\[.*?\]\(.*?\)/;
  let fullContent = '';
  try {
    card.content.main.forEach((blockContent) => {
      if (blockContent.content.match(imageRegex)) {
        const images = blockContent.content.split('(');
        fullContent += `${images[0]}(${images[1]}`;
      } else {
        fullContent += `${blockContent.content}\n`;
      }
    });
  } catch (error) {
    return;
  }
  if (card.content.approvement) {
    fullContent += `# 對話記錄${card.title}-${getDate()}\n ## 認同的觀點\n ${
      card.content.approvement
    } \n`;
  }
  if (card.content.disapprovement) {
    fullContent += `## 不認同的觀點\n ${card.content.disapprovement}`;
  }
  return fullContent;
}

export function convertCardsToNodes(cards) {
  return cards.map((card) => ({
    id: card._id,
    type: 'CustomNode',
    data: {
      label: (
        <>
          <Markdown>{mergeCardContents(card)}</Markdown>
        </>
      ),
      tags: card.tags,
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
