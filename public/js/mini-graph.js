/**
 * MINI GRAPH WIDGET - LAIN INSPIRED
 * Compact D3.js network visualization for top-right navigation
 */

(function() {
  'use strict';

  // Wait for D3 and data to be available
  function initMiniGraph() {
    if (typeof d3 === 'undefined') {
      console.warn('D3.js not loaded, mini-graph will not render');
      return;
    }

    if (typeof window.miniGraphData === 'undefined') {
      console.warn('Mini graph data not available');
      return;
    }

    const data = window.miniGraphData;

    // Build nodes and links
    const nodes = [];
    const links = [];
    const nodeMap = new Map();

    // Add category nodes
    Object.keys(data.categories || {}).forEach((category, idx) => {
      const node = {
        id: `cat-${category}`,
        label: category,
        type: 'category',
        group: 1
      };
      nodes.push(node);
      nodeMap.set(node.id, node);
    });

    // Add tag nodes (limit to top tags for mini view)
    const tagKeys = Object.keys(data.tags || {});
    const maxTags = 8; // Limit tags for compact view
    tagKeys.slice(0, maxTags).forEach((tag, idx) => {
      const node = {
        id: `tag-${tag}`,
        label: tag,
        type: 'tag',
        group: 2
      };
      nodes.push(node);
      nodeMap.set(node.id, node);
    });

    // Add post nodes (limit for mini view)
    const posts = data.posts || [];
    const maxPosts = 12; // Limit posts for compact view
    posts.slice(0, maxPosts).forEach((post, idx) => {
      const node = {
        id: `post-${idx}`,
        label: post.title,
        url: post.url,
        type: 'post',
        group: 0
      };
      nodes.push(node);
      nodeMap.set(node.id, node);

      // Create links to categories
      (post.categories || []).forEach(category => {
        const catId = `cat-${category}`;
        if (nodeMap.has(catId)) {
          links.push({
            source: node.id,
            target: catId,
            type: 'category-link'
          });
        }
      });

      // Create links to tags (only if in our limited set)
      (post.tags || []).slice(0, 3).forEach(tag => {
        const tagId = `tag-${tag}`;
        if (nodeMap.has(tagId)) {
          links.push({
            source: node.id,
            target: tagId,
            type: 'tag-link'
          });
        }
      });
    });

    // If no nodes, don't render
    if (nodes.length === 0) {
      console.warn('No nodes to render in mini-graph');
      return;
    }

    // Setup SVG
    const container = document.getElementById('mini-graph-svg');
    if (!container) {
      console.warn('Mini graph SVG container not found');
      return;
    }

    const width = container.clientWidth || 350;
    const height = container.clientHeight || 300;

    const svg = d3.select('#mini-graph-svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Clear any existing content
    svg.selectAll('*').remove();

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(35)
        .strength(0.3))
      .force('charge', d3.forceManyBody()
        .strength(-50))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(12))
      .alpha(0.5)
      .alphaDecay(0.05);

    // Create links
    const link = svg.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('class', d => `link ${d.type}`)
      .attr('stroke', d => {
        if (d.type === 'category-link') return '#ff5555';
        if (d.type === 'tag-link') return '#00ff00';
        return '#00ff00';
      })
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 1);

    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'mini-graph-tooltip')
      .style('position', 'absolute')
      .style('opacity', 0);

    // Create nodes
    const node = svg.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', d => `node ${d.type}`)
      .style('cursor', 'pointer');

    // Add circles to nodes
    node.append('circle')
      .attr('r', d => {
        if (d.type === 'category') return 9;
        if (d.type === 'tag') return 5;
        return 6; // post
      })
      .attr('fill', d => {
        if (d.type === 'category') return '#ff5555';
        if (d.type === 'tag') return '#ffff55';
        return '#00ff00'; // post
      })
      .attr('stroke', d => {
        if (d.type === 'category') return '#ff5555';
        if (d.type === 'tag') return '#ffff55';
        return '#00ff00'; // post
      })
      .attr('stroke-width', 1.5);

    // Add hover and click handlers
    node.on('mouseenter', function(event, d) {
      // Show tooltip
      tooltip
        .attr('class', `mini-graph-tooltip visible ${d.type}`)
        .html(d.label)
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .style('opacity', 1);

      // Highlight node
      d3.select(this).select('circle')
        .transition()
        .duration(150)
        .attr('r', d => {
          if (d.type === 'category') return 11;
          if (d.type === 'tag') return 6.5;
          return 8;
        });
    })
    .on('mousemove', function(event) {
      // Update tooltip position
      tooltip
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseleave', function(event, d) {
      // Hide tooltip
      tooltip
        .style('opacity', 0);

      // Reset node size
      d3.select(this).select('circle')
        .transition()
        .duration(150)
        .attr('r', d => {
          if (d.type === 'category') return 9;
          if (d.type === 'tag') return 5;
          return 6;
        });
    })
    .on('click', function(event, d) {
      // Prevent default link behavior
      event.preventDefault();
      event.stopPropagation();

      // Navigate to post URL if it's a post node
      if (d.type === 'post' && d.url) {
        window.location.href = d.url;
      }
    });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Stop simulation after a while to save resources
    setTimeout(() => {
      simulation.stop();
    }, 5000);

    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newWidth = container.clientWidth || 350;
        const newHeight = container.clientHeight || 300;
        svg.attr('viewBox', `0 0 ${newWidth} ${newHeight}`);
      }, 250);
    });

    console.log('Mini graph initialized with', nodes.length, 'nodes and', links.length, 'links');
  }

  // Initialize when DOM is ready and D3 is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Give D3 a moment to load if it's being loaded async
      setTimeout(initMiniGraph, 100);
    });
  } else {
    setTimeout(initMiniGraph, 100);
  }
})();
