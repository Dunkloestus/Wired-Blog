// Immersive Network Graph - Enhanced Version
console.log("🌐 Immersive Network Graph v4.0 Loading...");

// Helper function to ensure array format
function ensureArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return [value];
  return [];
}

document.addEventListener('DOMContentLoaded', function() {
  console.log("🚀 Initializing immersive network graph");

  // Check if D3 is available
  if (typeof d3 === 'undefined') {
    console.error("❌ D3.js is not loaded!");
    showError("D3.js library not loaded. Please check your internet connection.");
    return;
  }

  console.log("✅ D3.js loaded successfully, version:", d3.version);

  // Get posts data
  const dataElement = document.getElementById('posts-data');
  if (!dataElement) {
    console.error("❌ Posts data element not found!");
    showError("Posts data not found in page.");
    return;
  }

  let data;
  try {
    const jsonText = dataElement.textContent;
    data = JSON.parse(jsonText);
    console.log("✅ Parsed data successfully");
    console.log("📊 Nodes:", data.nodes.length, "| Links:", data.links.length);
  } catch (e) {
    console.error("❌ Error parsing JSON data:", e);
    showError("Invalid data format. Please check your posts configuration.");
    return;
  }

  // Check if we have any data
  if (!data.nodes || data.nodes.length === 0) {
    console.warn("⚠️ No nodes found in data");
    showError("No posts found. Create some posts to visualize the network!");
    return;
  }

  // Create the enhanced network graph
  createEnhancedNetworkGraph(data);
});

function showError(message) {
  const container = document.getElementById('network-graph');
  if (container) {
    container.innerHTML = `
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                  text-align: center; font-family: 'Fira Code', monospace; max-width: 500px;">
        <div style="font-size: 48px; color: #ff5555; margin-bottom: 20px;">⚠</div>
        <div style="font-size: 18px; color: #ff5555; margin-bottom: 10px; text-shadow: 0 0 10px #ff5555;">ERROR</div>
        <div style="font-size: 14px; color: #00ff00; line-height: 1.6;">${message}</div>
        <a href="/" style="display: inline-block; margin-top: 20px; padding: 10px 20px;
                          background: #ff5555; color: #000; text-decoration: none;
                          border-radius: 4px; font-weight: bold;">← Back to Home</a>
      </div>
    `;
  }
}

function createEnhancedNetworkGraph(data) {
  console.log("🎨 Creating immersive network graph with", data.nodes.length, "nodes");

  const container = document.getElementById('network-graph');
  if (!container) {
    console.error("❌ Graph container not found!");
    return;
  }

  // Clear container completely
  container.innerHTML = '';

  // Create control panel
  const controls = document.createElement('div');
  controls.style.cssText = `
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    background: rgba(0, 0, 0, 0.85);
    padding: 12px;
    border: 2px solid #ff5555;
    border-radius: 8px;
    box-shadow: 0 0 20px rgba(255, 85, 85, 0.4);
  `;

  // Control label
  const controlLabel = document.createElement('div');
  controlLabel.textContent = 'CONTROLS';
  controlLabel.style.cssText = `
    color: #ff5555;
    font-family: 'Fira Code', monospace;
    font-size: 10px;
    font-weight: bold;
    text-align: center;
    margin-bottom: 4px;
    letter-spacing: 2px;
    text-shadow: 0 0 5px #ff5555;
  `;
  controls.appendChild(controlLabel);

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
    bottom: 20px;
    left: 20px;
    z-index: 1000;
    color: #00ff00;
    font-family: 'Fira Code', monospace;
    font-size: 14px;
    background: rgba(0, 0, 0, 0.9);
    padding: 10px 15px;
    border: 2px solid #00ff00;
    border-radius: 6px;
    box-shadow: 0 0 20px rgba(0, 255, 0, 0.4);
    text-shadow: 0 0 5px #00ff00;
  `;
  zoomIndicator.textContent = 'ZOOM: 100%';
  container.appendChild(zoomIndicator);

  // Create stats indicator
  const statsIndicator = document.createElement('div');
  statsIndicator.style.cssText = `
    position: absolute;
    bottom: 20px;
    right: 20px;
    z-index: 1000;
    color: #ffff55;
    font-family: 'Fira Code', monospace;
    font-size: 12px;
    background: rgba(0, 0, 0, 0.9);
    padding: 10px 15px;
    border: 2px solid #ffff55;
    border-radius: 6px;
    box-shadow: 0 0 20px rgba(255, 255, 85, 0.4);
    text-align: right;
  `;
  statsIndicator.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 5px; color: #ff5555;">NETWORK STATS</div>
    <div>Nodes: ${data.nodes.length}</div>
  `;
  container.appendChild(statsIndicator);

  // Set dimensions to full viewport
  const width = window.innerWidth;
  const height = window.innerHeight;

  console.log("📐 Graph dimensions:", width, "x", height);
  
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
  
  // Create force simulation with enhanced parameters for larger screen
  const simulation = d3.forceSimulation(allNodes)
    .force("link", d3.forceLink(allLinks).id(d => d.id).distance(150))
    .force("charge", d3.forceManyBody().strength(-600))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(45))
    .force("x", d3.forceX(width / 2).strength(0.05))
    .force("y", d3.forceY(height / 2).strength(0.05));
  
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
  
  // Create nodes with larger sizes for immersive experience
  const node = g.append("g")
    .selectAll("circle")
    .data(allNodes)
    .enter().append("circle")
    .attr("r", d => {
      switch(d.type) {
        case 'post': return 16;
        case 'category': return 22;
        case 'tag': return 12;
        default: return 14;
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
        .attr("r", d.type === 'post' ? 22 : d.type === 'category' ? 28 : 18)
        .style("filter", "url(#glow) brightness(1.8)");

      // Highlight connected links
      link.style("stroke-opacity", l =>
        (l.source === d || l.target === d) ? 1 : 0.15
      ).style("stroke-width", l =>
        (l.source === d || l.target === d) ? 4 : 2
      );

      // Show quick preview in stats
      statsIndicator.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px; color: #ff5555;">NODE PREVIEW</div>
        <div style="color: #00ff00;">${d.title}</div>
        <div style="font-size: 10px; margin-top: 5px; color: #ffff55;">Type: ${d.type}</div>
      `;
    })
    .on("mouseout", function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", d.type === 'post' ? 16 : d.type === 'category' ? 22 : 12)
        .style("filter", "url(#glow)");

      // Reset link opacity and width
      link.style("stroke-opacity", 0.6)
          .style("stroke-width", 2);

      // Reset stats
      statsIndicator.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px; color: #ff5555;">NETWORK STATS</div>
        <div>Nodes: ${allNodes.length}</div>
      `;
    });
  
  // Add labels with larger font for immersive view
  const label = g.append("g")
    .selectAll("text")
    .data(allNodes)
    .enter().append("text")
    .text(d => {
      const title = d.title || "Untitled";
      return title.length > 20 ? title.substring(0, 20) + "..." : title;
    })
    .attr("font-size", "13px")
    .attr("font-family", "Fira Code, monospace")
    .attr("fill", d => {
      switch(d.type) {
        case 'post': return "#00ff00";
        case 'category': return "#ff5555";
        case 'tag': return "#ffff55";
        default: return "#00ff00";
      }
    })
    .attr("text-anchor", "middle")
    .attr("dy", ".35em")
    .style("pointer-events", "none")
    .style("text-shadow", "0 0 5px currentColor")
    .style("user-select", "none")
    .style("font-weight", "bold");
  
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
  
  // Add window resize handler
  window.addEventListener('resize', () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    svg.attr("width", newWidth).attr("height", newHeight);
    simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
    simulation.alpha(0.3).restart();
  });

  console.log("✅ Immersive network graph created successfully!");
  console.log("🎯 Use mouse to interact with the network");
}

function createButton(text, title) {
  const button = document.createElement('button');
  button.textContent = text;
  button.title = title;
  button.style.cssText = `
    width: 40px;
    height: 40px;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #00ff00;
    color: #00ff00;
    font-family: 'Fira Code', monospace;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.3s ease;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  `;

  button.onmouseover = () => {
    button.style.background = 'rgba(0, 255, 0, 0.2)';
    button.style.color = '#ffffff';
    button.style.boxShadow = '0 0 20px rgba(0, 255, 0, 0.6)';
    button.style.transform = 'scale(1.1)';
    button.style.borderColor = '#00ff00';
  };

  button.onmouseout = () => {
    button.style.background = 'rgba(0, 0, 0, 0.9)';
    button.style.color = '#00ff00';
    button.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.3)';
    button.style.transform = 'scale(1)';
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
