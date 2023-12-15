import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkHtml from 'remark-html';

function convertYouTubeLinksToEmbed(markdownText) {
  const youtubeRegex = /https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/g;
  console.log('hit', markdownText);
  return markdownText.replace(youtubeRegex, (match, videoId) => {
    return `<div class="youtube-embed"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
  });
}

const Markdown = ({ content }) => {
  const processedContent = convertYouTubeLinksToEmbed(content);

  return (
    <ReactMarkdown children={processedContent} remarkPlugins={[remarkHtml]} allowDangerousHtml />
  );
};
