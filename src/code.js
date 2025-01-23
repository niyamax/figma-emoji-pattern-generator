// Add this helper function at the top
function getRandomPastelColor() {
  // Generate pastel colors by using higher base values
  const r = Math.floor((Math.random() * 55) + 200); // 200-255
  const g = Math.floor((Math.random() * 55) + 200); // 200-255
  const b = Math.floor((Math.random() * 55) + 200); // 200-255
  return { r: r/255, g: g/255, b: b/255 }; // Figma uses 0-1 values for RGB
}

figma.ui.onmessage = msg => {
  if (msg.type === 'create-pattern') {
    const nodes = [];
    const emojis = msg.emojis;
    const pattern = msg.pattern;

    // Create main frame with pastel background
    const mainFrame = figma.createFrame();
    mainFrame.resize(2000, 2000);
    mainFrame.fills = [{
      type: 'SOLID',
      color: getRandomPastelColor()
    }];

    if (pattern === 'grid') {
      
      const spacing = 100; // Adjusted to the frame
      const gridRows = Math.floor(mainFrame.height / spacing);
      const gridCols = Math.floor(mainFrame.width / spacing);
      for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
          const emojiIndex = (row * gridCols + col) % emojis.length;
          const node = figma.createNodeFromSvg(emojis[emojiIndex]);
          const group = figma.group(node.children, mainFrame); // Add to mainFrame instead
          node.remove();

          group.x = col * spacing + spacing; // Add padding
          group.y = row * spacing + spacing;

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
          const group = figma.group(node.children, mainFrame); // Add to mainFrame
          node.remove();

          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          const scaleFactor = minScale + (maxScale - minScale) * (i / (turns * emojis.length));
          group.rescale(scaleFactor);

          group.x = x + mainFrame.width/2; // Center in frame
          group.y = y + mainFrame.height/2;

          nodes.push(group);

          angle += spacing / (2 * Math.PI * radius || 1);
          radius += spacing / (2 * Math.PI);
        }
      }
    } else if (pattern === 'sierpinski') {
      const depth = 6;
      const size = 1800; // Slightly smaller to fit in frame

      function drawTriangle(x, y, size, depth) {
        if (depth === 0) {
          const emojiIndex = Math.floor(Math.random() * emojis.length);
          const node = figma.createNodeFromSvg(emojis[emojiIndex]);
          const group = figma.group(node.children, mainFrame);
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

      drawTriangle(100, 100, size, depth); // Add padding from edges
    } else if (pattern === 'wave') {
      const width = mainFrame.width - 200; // Add padding
      const height = mainFrame.height - 200;
      const frequency = msg.density / 100 || 0.2;
      const amplitude = 100;
      
      for (let x = 0; x < width; x += 100) {
        for (let y = 0; y < height; y += 100) {
          const emojiIndex = Math.floor(Math.random() * emojis.length);
          const node = figma.createNodeFromSvg(emojis[emojiIndex]);
          const group = figma.group(node.children, mainFrame);
          node.remove();
          
          const wave = Math.sin(x * frequency) * amplitude;
          group.x = x + 100; // Add padding
          group.y = y + wave + 100;
          
          const size = msg.size || 1;
          group.rescale(size * (0.8 + Math.random() * 0.4));
          
          nodes.push(group);
        }
      }
    }

    // Center the main frame
    mainFrame.x = figma.viewport.center.x - mainFrame.width/2;
    mainFrame.y = figma.viewport.center.y - mainFrame.height/2;

    if (nodes.length > 0) {
      figma.currentPage.selection = [mainFrame];
      figma.viewport.scrollAndZoomIntoView([mainFrame]);
    }
    figma.ui.postMessage({ type: 'PATTERN_CREATION_SUCCESS' });
  }
};

figma.showUI(__html__, { width: 400, height: 500 });