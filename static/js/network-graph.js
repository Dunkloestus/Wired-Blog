// Enhanced Network Graph with Zoom Controls
console.log("Enhanced network graph script loaded - v3");

// Helper function to ensure array format
function ensureArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
}

document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing enhanced network graph");
  
  // Check if D3 is available
  if (typeof d3 === 'undefined') {
    console.error("D3.js is not loaded!");
    const container = document.getElementById('network-graph');
    if (container) {
      container.innerHTML = '<div style="color: red; padding: 20px; font-family: Fira Code;">ERROR: D3.js library not loaded</div>';
    }
    return;
  }
  
  console.log("D3.js loaded successfully, version:", d3.version);
  
  // Get posts data
  const dataElement = document.getElementById('posts-data');
  if (!dataElement) {
    console.error("Posts data element not found!");
    const container = document.getElementById('network-graph');
    if (container) {
      container.innerHTML = '<div style="color: yellow; padding: 20px; font-family: Fira Code;">ERROR: Posts data not found</div>';
    }
    return;
  }
  
  let data;
  try {
    const jsonText = dataElement.textContent;
    console.log("Raw JSON data:", jsonText.substring(0, 500) + "...");
    data = JSON.parse(jsonText);
    console.log("Parsed data successfully:", data);
    console.log("Number of nodes:", data.nodes.length);
    console.log("Number of links:", data.links.length);
  } catch (e) {
    console.error("Error parsing JSON data:", e);
    const container = document.getElementById('network-graph');
    if (container) {
      container.innerHTML = '<div style="color: red; padding: 20px; font-family: Fira Code;">ERROR: Invalid JSON data</div>';
    }
    return;
  }
  
  // Check if we have any data
  if (!data.nodes || data.nodes.length === 0) {
    console.warn("No nodes found in data");
    const container = document.getElementById('network-graph');
    if (container) {
      container.innerHTML = '<div style="color: yellow; padding: 20px; font-family: Fira Code;">No posts found. Make sure your posts have proper frontmatter.</div>';
    }
    return;
  }
  
  // Create the enhanced network graph
  createEnhancedNetworkGraph(data);
});

function createEnhancedNetworkGraph(data) {
  console.log("Creating enhanced network graph with", data.nodes.length, "nodes");
  
  const container = document.getElementById('network-graph');
  if (!container) {
    console.error("Graph container not found!");
    return;
  }
  
  // Clear container completely
  container.innerHTML = '';
  
  // Create control panel
  const controls = document.createElement('div');
  controls.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 5px;
  `;
  
  // Zoom controls
  const zoomIn = createButton('+', 'Zoom In');
  const zoomOut = createButton('−', 'Zoom Out');
  const resetView = createButton('⌂', 'Reset View');
  const fullscreen = createButton('⛶', 'Fullscreen');
  
  controls.appendChild(zoomIn);
  controls.appendChild(zoomOut);
  controls.appendChild(resetView);
  controls.appendChild(fullscreen);
  container.appendChild(controls);
  
  // Create zoom level indicator
  const zoomIndicator = document.createElement('div');
  zoomIndicator.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 10px;
    z-index: 1000;
    color: #00ff00;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
    background: rgba(0, 0, 0, 0.8);
    padding: 5px 10px;
    border: 1px solid #00ff00;
    border-radius: 4px;
  `;
  zoomIndicator.textContent = 'ZOOM: 100%';
  container.appendChild(zoomIndicator);
  
  // Set dimensions
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;
  
  console.log("Graph dimensions:", width, "x", height);
  
  // Create SVG with zoom behavior
  const svg = d3.select("#network-graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#000000")
    .style("cursor", "grab");
  
  // Create zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 10])
    .on("zoom", handleZoom);
  
  svg.call(zoom);
  
  // Create main group for all graph elements
  const g = svg.append("g");
  
  // Add categories and tags as nodes
  const allCategories = data.nodes.flatMap(n => ensureArray(n.categories));
  const allTags = data.nodes.flatMap(n => ensureArray(n.tags));
  
  const categoryNodes = [...new Set(allCategories)]
    .map(cat => ({
      id: `category-${cat}`,
      title: cat,
      type: "category"
    }));
  
  const tagNodes = [...new Set(allTags)]
    .map(tag => ({
      id: `tag-${tag}`,
      title: tag, 
      type: "tag"
    }));
  
  // Combine all nodes
  const allNodes = [...data.nodes, ...categoryNodes, ...tagNodes];
  
  // Create links between posts and their categories/tags
  const allLinks = [];
  data.nodes.forEach(post => {
    const categories = ensureArray(post.categories);
    const tags = ensureArray(post.tags);
    
    categories.forEach(cat => {
      allLinks.push({
        source: post.id,
        target: `category-${cat}`,
        type: "category"
      });
    });
    
    tags.forEach(tag => {
      allLinks.push({
        source: post.id,
        target: `tag-${tag}`,
        type: "tag"
      });
    });
  });
  
  console.log("Total nodes:", allNodes.length);
  console.log("Total links:", allLinks.length);
  
  // Create force simulation
  const simulation = d3.forceSimulation(allNodes)
    .force("link", d3.forceLink(allLinks).id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-400))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(35));
  
  // Create links
  const link = g.append("g")
    .selectAll("line")
    .data(allLinks)
    .enter().append("line")
    .attr("stroke", d => {
      switch(d.type) {
        case 'category': return "#ff5555";
        case 'tag': return "#00ff00";
        default: return "#ffff55";
      }
    })
    .attr("stroke-opacity", 0.6)
    .attr("stroke-width", 2)
    .style("filter", "drop-shadow(0 0 4px currentColor)");
  
  // Create glow definitions
  const defs = svg.append("defs");
  
  // Glow filter for nodes
  const glowFilter = defs.append("filter")
    .attr("id", "glow")
    .attr("x", "-50%")
    .attr("y", "-50%")
    .attr("width", "200%")
    .attr("height", "200%");
  
  glowFilter.append("feGaussianBlur")
    .attr("stdDeviation", "3")
    .attr("result", "coloredBlur");
  
  const feMerge = glowFilter.append("feMerge");
  feMerge.append("feMergeNode").attr("in", "coloredBlur");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");
  
  // Create nodes
  const node = g.append("g")
    .selectAll("circle")
    .data(allNodes)
    .enter().append("circle")
    .attr("r", d => {
      switch(d.type) {
        case 'post': return 12;
        case 'category': return 16;
        case 'tag': return 8;
        default: return 10;
      }
    })
    .attr("fill", d => {
      switch(d.type) {
        case 'post': return "#00ff00";
        case 'category': return "#ff5555";
        case 'tag': return "#ffff55";
        default: return "#ffffff";
      }
    })
    .attr("stroke", "#000000")
    .attr("stroke-width", 2)
    .style("filter", "url(#glow)")
    .style("cursor", "pointer")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended))
    .on("click", function(event, d) {
      console.log("Clicked node:", d);
      if (d.type === 'post' && d.url) {
        window.location.href = d.url;
      } else {
        showNodeInfo(d);
      }
    })
    .on("mouseover", function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", d.type === 'post' ? 16 : d.type === 'category' ? 20 : 12)
        .style("filter", "url(#glow) brightness(1.5)");
      
      // Highlight connected links
      link.style("stroke-opacity", l => 
        (l.source === d || l.target === d) ? 1 : 0.2
      );
    })
    .on("mouseout", function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", d.type === 'post' ? 12 : d.type === 'category' ? 16 : 8)
        .style("filter", "url(#glow)");
      
      // Reset link opacity
      link.style("stroke-opacity", 0.6);
    });
  
  // Add labels
  const label = g.append("g")
    .selectAll("text")
    .data(allNodes)
    .enter().append("text")
    .text(d => {
      const title = d.title || "Untitled";
      return title.length > 15 ? title.substring(0, 15) + "..." : title;
    })
    .attr("font-size", "10px")
    .attr("font-family", "Fira Code, monospace")
    .attr("fill", "#00ff00")
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .style("pointer-events", "none")
    .style("text-shadow", "0 0 3px #00ff00")
    .style("user-select", "none");
  
  // Zoom event handler
  function handleZoom(event) {
    const { transform } = event;
    g.attr("transform", transform);
    
    // Update zoom indicator
    const zoomPercent = Math.round(transform.k * 100);
    zoomIndicator.textContent = `ZOOM: ${zoomPercent}%`;
    
    // Adjust visual elements based on zoom level
    const nodeScale = Math.max(0.5, Math.min(2, 1 / transform.k));
    label.style("font-size", `${10 * nodeScale}px`);
    link.attr("stroke-width", Math.max(1, 2 * nodeScale));
  }
  
  // Button functions
  zoomIn.onclick = () => {
    svg.transition().duration(300).call(
      zoom.scaleBy, 1.5
    );
  };
  
  zoomOut.onclick = () => {
    svg.transition().duration(300).call(
      zoom.scaleBy, 1 / 1.5
    );
  };
  
  resetView.onclick = () => {
    svg.transition().duration(500).call(
      zoom.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
    );
  };
  
  fullscreen.onclick = () => {
    if (container.requestFullscreen) {
      container.requestFullscreen();
    }
  };
  
  // Update positions on simulation tick
  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);
    
    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);
    
    label
      .attr("x", d => d.x)
      .attr("y", d => d.y + 25);
  });
  
  // Drag functions
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
    svg.style("cursor", "grabbing");
  }
  
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
    svg.style("cursor", "grab");
  }
  
  // Add mouse wheel zoom
  svg.on("wheel", function(event) {
    event.preventDefault();
  });
  
  console.log("Enhanced network graph created successfully!");
}

function createButton(text, title) {
  const button = document.createElement('button');
  button.textContent = text;
  button.title = title;
  button.style.cssText = `
    width: 30px;
    height: 30px;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid #ff5555;
    color: #00ff00;
    font-family: 'Fira Code', monospace;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.3s ease;
  `;
  
  button.onmouseover = () => {
    button.style.background = 'rgba(255, 85, 85, 0.2)';
    button.style.color = '#ffffff';
    button.style.boxShadow = '0 0 10px rgba(255, 85, 85, 0.5)';
  };
  
  button.onmouseout = () => {
    button.style.background = 'rgba(0, 0, 0, 0.8)';
    button.style.color = '#00ff00';
    button.style.boxShadow = 'none';
  };
  
  return button;
}

function showNodeInfo(d) {
  const info = document.getElementById('node-details');
  if (!info) return;
  
  let content = `<h4 style="color: #ffff55; margin: 0 0 10px 0;">${d.title}</h4>`;
  
  if (d.type === 'post') {
    const categories = ensureArray(d.categories);
    const tags = ensureArray(d.tags);
    
    content += `
      <p><strong style="color: #ff5555;">Date:</strong> ${d.date}</p>
      <p><strong style="color: #ff5555;">Reading Time:</strong> ${d.readingTime} min</p>
      <p><strong style="color: #ff5555;">Word Count:</strong> ${d.wordCount}</p>
      <p><strong style="color: #ff5555;">Section:</strong> ${d.section}</p>
      ${categories.length > 0 ? `<p><strong style="color: #ff5555;">Categories:</strong> ${categories.join(', ')}</p>` : ''}
      ${tags.length > 0 ? `<p><strong style="color: #ff5555;">Tags:</strong> ${tags.join(', ')}</p>` : ''}
      <a href="${d.url}" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #ff5555; color: #000000; text-decoration: none; border-radius: 4px; font-weight: bold;">Visit Post →</a>
    `;
  } else if (d.type === 'category' || d.type === 'tag') {
    content += `
      <p><strong style="color: #ff5555;">Type:</strong> ${d.type}</p>
      <p><strong style="color: #ff5555;">Connections:</strong> Multiple posts</p>
      <p style="color: #00ff00; font-style: italic;">Hover over connected nodes to see relationships</p>
    `;
  }
  
  info.innerHTML = content;
}
