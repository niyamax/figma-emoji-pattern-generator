// figma.ui.onmessage = msg => {
//     if (msg.type === 'create-grid') {
//       const nodes = [];
//       const emojis = msg.emojis; // Array of selected emojis
//       const turns = 5; // Number of turns in each spiral
//       const spacing = 1200; // Spacing between emojis
//       const spiralCount = 15; // Number of spirals
//       const minScale = 0.5; // Minimum scale of the emoji
//       const maxScale = 6.0; // Maximum scale of the emoji
  
//       for (let s = 0; s < spiralCount; s++) {
//         let angle = (s * 2 * Math.PI) / spiralCount; // Initial angle for each spiral
//         let radius = 0;
  
//         for (let i = 0; i < turns * emojis.length; i++) {
//           const emojiIndex = i % emojis.length;
//           const node = figma.createNodeFromSvg(emojis[emojiIndex]);
//           const group = figma.group(node.children, figma.currentPage);
//           node.remove();
  
//           const x = Math.cos(angle) * radius;
//           const y = Math.sin(angle) * radius;
  
//           // Calculate scaling factor based on position in the spiral
//           const scaleFactor = minScale + (maxScale - minScale) * (i / (turns * emojis.length));
  
//           // Apply scaling to the group
//           group.rescale(scaleFactor);
  
//           group.x = x + figma.viewport.center.x;
//           group.y = y + figma.viewport.center.y;
  
//           nodes.push(group);
  
//           angle += spacing / (2 * Math.PI * radius || 1); // increment angle based on the circumference of the current radius
//           radius += spacing / (2 * Math.PI); // increment radius slightly with each emoji
//         }
//       }
  
//       if (nodes.length > 0) {
//         figma.currentPage.selection = nodes;
//         figma.viewport.scrollAndZoomIntoView(nodes);
//       }
//       figma.ui.postMessage({ type: 'SCALING_MULTI_SPIRAL_CREATION_SUCCESS' });
//     }
//   };
  
// figma.showUI(__html__, { width: 280, height: 500 });

figma.ui.onmessage = msg => {
  if (msg.type === 'create-pattern') {
    const nodes = [];
    const emojis = msg.emojis;
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

    if (nodes.length > 0) {
      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
    }
    figma.ui.postMessage({ type: 'SIERPINSKI_CREATION_SUCCESS' });
  }
};
figma.showUI(__html__, { width: 280, height: 500 });