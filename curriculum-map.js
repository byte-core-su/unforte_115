'use strict';
// 課程地圖頁：依單元卡片位置畫出概念關聯箭頭。

function svgElement(tag, attributes) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }
  return element;
}

function setupConceptMap(diagram, index) {
  const list = diagram.querySelector('.curriculum-steps');
  const nodes = [...list.querySelectorAll('li > a')];
  const relations = [...diagram.querySelectorAll('.course-relations li')];
  const svg = svgElement('svg', { class: 'course-diagram-lines', 'aria-hidden': 'true', focusable: 'false' });
  const markerId = 'course-relation-arrow-' + index;
  const definitions = svgElement('defs', {});
  const marker = svgElement('marker', { id: markerId, viewBox: '0 0 8 8', refX: 8, refY: 4, markerWidth: 5, markerHeight: 5, orient: 'auto' });
  marker.append(svgElement('path', { d: 'M0 0 L8 4 L0 8 Z', class: 'course-diagram-arrow' }));
  definitions.append(marker);
  const lines = svgElement('g', {});
  const labels = svgElement('g', {});
  svg.append(definitions, lines, labels);
  diagram.prepend(svg);

  function draw() {
    if (getComputedStyle(svg).display === 'none') return;
    const origin = list.getBoundingClientRect();
    if (!origin.width || !origin.height) return;
    const boxes = nodes.map(node => {
      const { left, right, top, bottom } = node.getBoundingClientRect();
      return {
        left: left - origin.left,
        right: right - origin.left,
        top: top - origin.top,
        bottom: bottom - origin.top,
        x: (left + right) / 2 - origin.left,
        y: (top + bottom) / 2 - origin.top
      };
    });
    svg.setAttribute('viewBox', `0 0 ${origin.width} ${origin.height}`);
    lines.replaceChildren();
    labels.replaceChildren();

    for (const relation of relations) {
      const from = boxes[Number(relation.dataset.from) - 1];
      const to = boxes[Number(relation.dataset.to) - 1];
      const sameRow = Math.abs(from.y - to.y) < 1;
      const leftToRight = from.x < to.x;
      const startX = sameRow ? (leftToRight ? from.right : from.left) : from.x;
      const endX = sameRow ? (leftToRight ? to.left : to.right) : to.x;
      const startY = sameRow ? from.y : from.bottom;
      const endY = sameRow ? to.y : to.top;
      const middleY = (startY + endY) / 2;
      const path = sameRow
        ? `M${startX} ${startY} L${endX} ${endY}`
        : `M${startX} ${startY} C${startX} ${middleY}, ${endX} ${middleY}, ${endX} ${endY}`;
      lines.append(svgElement('path', { d: path, 'marker-end': `url(#${markerId})` }));
      const label = svgElement('text', { x: (startX + endX) / 2, y: middleY - 9, 'text-anchor': 'middle' });
      label.textContent = relation.querySelector('span').textContent;
      labels.append(label);
    }
    diagram.classList.add('is-drawn');
  }

  new ResizeObserver(draw).observe(list);
}

if ('ResizeObserver' in window) {
  document.querySelectorAll('.course-diagram').forEach(setupConceptMap);
}
