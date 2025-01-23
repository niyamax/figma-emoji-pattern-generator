figma.ui.onmessage = msg => {
  if (msg.type === 'create-pattern') {
    const nodes = [];
    const emojis = msg.emojis;
    const pattern = msg.pattern; // Get the selected pattern from the message

    if (pattern === 'grid') {
      const gridRows = msg.gridRows || 10;
      const gridCols = msg.gridCols || 10;
      const spacing = msg.spacing || 10;

      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          const emojiIndex = (row * gridCols + col) % emojis.length;
          const node = figma.createNodeFromSvg(emojis[emojiIndex]);
          const group = figma.group(node.children, figma.currentPage);
          node.remove();

          group.x = col * spacing;
          group.y = row * spacing;

          nodes.push(group);
        }
      }
    } else if (pattern === 'spiral') {
      const turns = 5;
      const spacing = 1200;
      const spiralCount = 15;
      const minScale = 0.5;
      const maxScale = 6.0;

      for (let s = 0; s < spiralCount; s++) {
        let angle = (s * 2 * Math.PI) / spiralCount;
        let radius = 0;

        for (let i = 0; i < turns * emojis.length; i++) {
          const emojiIndex = i % emojis.length;
          const node = figma.createNodeFromSvg(emojis[emojiIndex]);
          const group = figma.group(node.children, figma.currentPage);
          node.remove();

          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          const scaleFactor = minScale + (maxScale - minScale) * (i / (turns * emojis.length));
          group.rescale(scaleFactor);

          group.x = x + figma.viewport.center.x;
          group.y = y + figma.viewport.center.y;

          nodes.push(group);

          angle += spacing / (2 * Math.PI * radius || 1);
          radius += spacing / (2 * Math.PI);
        }
      }
    } else if (pattern === 'sierpinski') {
      const depth = 6;
      const size = 2000;

      function drawTriangle(x, y, size, depth) {
        if (depth === 0) {
          const emojiIndex = Math.floor(Math.random() * emojis.length);
          const node = figma.createNodeFromSvg(emojis[emojiIndex]);
          const group = figma.group(node.children, figma.currentPage);
          node.remove();

          group.x = x;
          group.y = y;
          group.rescale(size / 100);

          nodes.push(group);
        } else {
          const newSize = size / 2;
          drawTriangle(x, y, newSize, depth - 1);
          drawTriangle(x + newSize, y, newSize, depth - 1);
          drawTriangle(x + newSize / 2, y + newSize * Math.sqrt(3) / 2, newSize, depth - 1);
        }
      }

      drawTriangle(figma.viewport.center.x - size/2, figma.viewport.center.y - size*Math.sqrt(3)/4, size, depth);
    } else if (pattern === 'wave') {
      const width = 2000;
      const height = 2000;
      const frequency = msg.density / 100 || 0.2;
      const amplitude = 100;
      
      for (let x = 0; x < width; x += 100) {
        for (let y = 0; y < height; y += 100) {
          const emojiIndex = Math.floor(Math.random() * emojis.length);
          const node = figma.createNodeFromSvg(emojis[emojiIndex]);
          const group = figma.group(node.children, figma.currentPage);
          node.remove();
          
          // Create wave pattern
          const wave = Math.sin(x * frequency) * amplitude;
          group.x = x + figma.viewport.center.x - width/2;
          group.y = y + wave + figma.viewport.center.y - height/2;
          
          // Apply size variation
          const size = msg.size || 1;
          group.rescale(size * (0.8 + Math.random() * 0.4));
          
          nodes.push(group);
        }
      }
    }

    if (nodes.length > 0) {
      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
    }
    figma.ui.postMessage({ type: 'PATTERN_CREATION_SUCCESS' });
  }
};
figma.showUI(__html__, { width: 400, height: 500 });