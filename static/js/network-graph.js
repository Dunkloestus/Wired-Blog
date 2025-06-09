// Fixed Network Graph JavaScript
console.log("Network graph script loaded - v2");

document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM loaded, initializing network graph");
  
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
  
  // Create the network graph
  createNetworkGraph(data);
});

function createNetworkGraph(data) {
  console.log("Creating network graph with", data.nodes.length, "nodes");
  
  const container = document.getElementById('network-graph');
  if (!container) {
    console.error("Graph container not found!");
    return;
  }
  
  // Clear loading message
  container.innerHTML = '';
  
  // Set dimensions
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;
  
  console.log("Graph dimensions:", width, "x", height);
  
  // Create SVG
  const svg = d3.select("#network-graph")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background", "#000000");
  
  // Add categories and tags as nodes
  const categoryNodes = [...new Set(data.nodes.flatMap(n => n.categories || []))]
    .map(cat => ({
      id: `category-${cat}`,
      title: cat,
      type: "category"
    }));
  
  const tagNodes = [...new Set(data.nodes.flatMap(n => n.tags || []))]
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
    if (post.categories) {
      post.categories.forEach(cat => {
        allLinks.push({
          source: post.id,
          target: `category-${cat}`,
          type: "category"
        });
      });
    }
    if (post.tags) {
      post.tags.forEach(tag => {
        allLinks.push({
          source: post.id,
          target: `tag-${tag}`,
          type: "tag"
        });
      });
    }
  });
  
  console.log("Total nodes:", allNodes.length);
  console.log("Total links:", allLinks.length);
  
  // Create force simulation
  const simulation = d3.forceSimulation(allNodes)
    .force("link", d3.forceLink(allLinks).id(d => d.id).distance(100))
    .force("charge", d3.forceManyBody().strength(-300))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(30));
  
  // Create links
  const link = svg.append("g")
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
    .attr("stroke-width", 2);
  
  // Create nodes
  const node = svg.append("g")
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
    .style("filter", "drop-shadow(0 0 6px currentColor)")
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
        .style("filter", "drop-shadow(0 0 12px currentColor)");
    })
    .on("mouseout", function(event, d) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr("r", d.type === 'post' ? 12 : d.type === 'category' ? 16 : 8)
        .style("filter", "drop-shadow(0 0 6px currentColor)");
    });
  
  // Add labels
  const label = svg.append("g")
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
    .style("text-shadow", "0 0 3px #00ff00");
  
  // Update positions on tick
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
  }
  
  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }
  
  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }
  
  console.log("Network graph created successfully!");
}

function showNodeInfo(d) {
  const info = document.getElementById('node-details');
  if (!info) return;
  
  let content = `<h4 style="color: #ffff55; margin: 0 0 10px 0;">${d.title}</h4>`;
  
  if (d.type === 'post') {
    content += `
      <p><strong style="color: #ff5555;">Date:</strong> ${d.date}</p>
      <p><strong style="color: #ff5555;">Reading Time:</strong> ${d.readingTime} min</p>
      <p><strong style="color: #ff5555;">Word Count:</strong> ${d.wordCount}</p>
      <p><strong style="color: #ff5555;">Section:</strong> ${d.section}</p>
      ${d.categories && d.categories.length > 0 ? `<p><strong style="color: #ff5555;">Categories:</strong> ${d.categories.join(', ')}</p>` : ''}
      ${d.tags && d.tags.length > 0 ? `<p><strong style="color: #ff5555;">Tags:</strong> ${d.tags.join(', ')}</p>` : ''}
      <a href="${d.url}" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #ff5555; color: #000000; text-decoration: none; border-radius: 4px; font-weight: bold;">Visit Post →</a>
    `;
  } else if (d.type === 'category' || d.type === 'tag') {
    content += `
      <p><strong style="color: #ff5555;">Type:</strong> ${d.type}</p>
      ${d.count ? `<p><strong style="color: #ff5555;">Post Count:</strong> ${d.count}</p>` : ''}
    `;
  }
  
  info.innerHTML = content;
}
