figma.showUI(__html__, { width: 280, height: 500 });

figma.ui.onmessage = msg => {
  if (msg.type === 'create-grid') {
    const nodes = [];
    const emojis = msg.emojis; // Array of selected emojis
    const gridRows = msg.gridRows; // Number of rows in the grid
    const gridCols = msg.gridCols; // Number of columns in the grid
    const spacing = msg.spacing; // Spacing between emojis

    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        const emojiIndex = (row * gridCols + col) % emojis.length;
        const node = figma.createNodeFromSvg(emojis[emojiIndex]);
        const group = figma.group(node.children, figma.currentPage);
        node.remove();

        group.x = col * (group.width + spacing);
        group.y = row * (group.height + spacing);

        nodes.push(group);
      }
    }

    if (nodes.length > 0) {
      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
    }

    figma.ui.postMessage({ type: 'GRID_CREATION_SUCCESS' });
  }
};