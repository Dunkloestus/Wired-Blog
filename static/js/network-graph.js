// Network Graph for Serial Experiments Lain Blog
class NetworkGraph {
  constructor() {
    this.width = window.innerWidth * 0.8;
    this.height = window.innerHeight * 0.7;
    this.init();
  }

  init() {
    // Load data from Hugo template
    const data = JSON.parse(document.getElementById('posts-data').textContent);
    
    // Create SVG
    this.svg = d3.select("#network-graph")
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .style("background", "#000000");

    // Create force simulation
    this.simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(this.width / 2, this.height / 2))
      .force("collision", d3.forceCollide().radius(20));

    this.createGraph(data);
  }

  createGraph(data) {
    // Create links (connections)
    const link = this.svg.append("g")
      .selectAll("line")
      .data(data.links)
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
    const node = this.svg.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .enter().append("circle")
      .attr("r", d => {
        switch(d.type) {
          case 'post': return 8;
          case 'category': return 12;
          case 'tag': return 6;
          default: return 8;
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
      .call(this.drag())
      .on("click", this.handleNodeClick.bind(this))
      .on("mouseover", this.handleMouseOver.bind(this))
      .on("mouseout", this.handleMouseOut.bind(this));

    // Add labels
    const label = this.svg.append("g")
      .selectAll("text")
      .data(data.nodes)
      .enter().append("text")
      .text(d => d.title.length > 20 ? d.title.substring(0, 20) + "..." : d.title)
      .attr("font-size", "10px")
      .attr("font-family", "Fira Code, monospace")
      .attr("fill", "#00ff00")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .style("pointer-events", "none")
      .style("text-shadow", "0 0 3px #00ff00");

    // Update positions on simulation tick
    this.simulation.on("tick", () => {
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
  }

  drag() {
    return d3.drag()
      .on("start", (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }

  handleNodeClick(event, d) {
    if (d.type === 'post') {
      // Navigate to post
      window.location.href = d.url;
    } else {
      // Show node info
      this.showNodeInfo(d);
    }
  }

  handleMouseOver(event, d) {
    // Highlight connected nodes
    d3.select(event.target)
      .transition()
      .duration(200)
      .attr("r", d.type === 'post' ? 12 : d.type === 'category' ? 16 : 10)
      .style("filter", "drop-shadow(0 0 12px currentColor)");
  }

  handleMouseOut(event, d) {
    // Reset node appearance
    d3.select(event.target)
      .transition()
      .duration(200)
      .attr("r", d.type === 'post' ? 8 : d.type === 'category' ? 12 : 6)
      .style("filter", "drop-shadow(0 0 6px currentColor)");
  }

  showNodeInfo(d) {
    const info = document.getElementById('node-details');
    let content = `<h4>${d.title}</h4>`;
    
    if (d.type === 'post') {
      content += `
        <p><strong>Date:</strong> ${d.date}</p>
        <p><strong>Reading Time:</strong> ${d.readingTime} min</p>
        <p><strong>Word Count:</strong> ${d.wordCount}</p>
        <p><strong>Categories:</strong> ${d.categories ? d.categories.join(', ') : 'None'}</p>
        <p><strong>Tags:</strong> ${d.tags ? d.tags.join(', ') : 'None'}</p>
        <a href="${d.url}" class="visit-post">Visit Post →</a>
      `;
    } else if (d.type === 'category' || d.type === 'tag') {
      content += `
        <p><strong>Type:</strong> ${d.type}</p>
        <p><strong>Post Count:</strong> ${d.count}</p>
      `;
    }
    
    info.innerHTML = content;
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  new NetworkGraph();
});
