let graph = new Graph();
let svg = null;

async function initializeGraph() {
  try {
    const response = await fetch("graph.json");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Add nodes
    data.nodes.forEach((node) => {
      graph.addNode(node.id, node.name, node.x, node.y, node.aliases);
    });

    // Add edges
    data.edges.forEach((edge) => {
      graph.addEdge(edge.source, edge.target, edge.distance);
    });

    drawNodes();
    if (graph.showAllEdges) {
      drawAllEdges();
    }
  } catch (error) {
    console.error("Error loading graph data:", error);
  }
}

function drawNodes() {
  svg = document.getElementById("map-overlay");
  const image = document.getElementById("campus-map");

  // Set SVG dimensions to match the image
  svg.setAttribute(
    "viewBox",
    `0 0 ${image.naturalWidth} ${image.naturalHeight}`
  );

  // Add nodes to the map
  graph.nodes.forEach((node) => {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");

    // Create circle for the node
    const circle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    circle.setAttribute("cx", node.x);
    circle.setAttribute("cy", node.y);
    circle.setAttribute("r", "6");
    circle.setAttribute("fill", "#666");
    circle.setAttribute("data-node-id", node.id);
    circle.classList.add("node");

    // Create label for the node
    const label = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    label.setAttribute("x", node.x);
    label.setAttribute("y", node.y - 15);
    label.setAttribute("class", "node-label");
    label.textContent = node.name;

    // Add hover events
    circle.addEventListener("mouseenter", () => {
      circle.setAttribute("r", "8");
      label.classList.add("visible");
    });

    circle.addEventListener("mouseleave", () => {
      if (!circle.classList.contains("path-node")) {
        circle.setAttribute("r", "6");
      }
      label.classList.remove("visible");
    });

    group.appendChild(circle);
    group.appendChild(label);
    svg.appendChild(group);
  });

  populateDropdowns();
}

function drawAllEdges() {
  graph.nodes.forEach((sourceNode) => {
    sourceNode.neighbors.forEach((distance, targetId) => {
      const targetNode = graph.getNodeInfo(targetId);
      drawEdge(
        sourceNode.x,
        sourceNode.y,
        targetNode.x,
        targetNode.y,
        "#ccc",
        1
      );
    });
  });
}

function drawEdge(x1, y1, x2, y2, color, width) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
  line.setAttribute("stroke", color);
  line.setAttribute("stroke-width", width);
  line.classList.add("path-edge");
  svg.appendChild(line);
}

function populateDropdowns() {
  const startSelect = document.getElementById("start-select");
  const endSelect = document.getElementById("end-select");

  // Clear existing options except the first one
  startSelect.innerHTML = '<option value="">Select Start Location</option>';
  endSelect.innerHTML = '<option value="">Select End Location</option>';

  // Convert nodes to array and sort by name
  const sortedNodes = Array.from(graph.nodes.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Add options for each node and its aliases
  sortedNodes.forEach((node) => {
    // Add main name
    const startOption = createOption(node.id, node.name);
    const endOption = createOption(node.id, node.name);
    startSelect.appendChild(startOption);
    endSelect.appendChild(endOption);

    // Add aliases if they exist
    if (node.aliases && node.aliases.length > 0) {
      node.aliases.forEach((alias) => {
        const startAliasOption = createOption(node.id, alias);
        const endAliasOption = createOption(node.id, alias);
        startSelect.appendChild(startAliasOption);
        endSelect.appendChild(endAliasOption);
      });
    }
  });

  // Add event listeners to prevent selecting same node
  startSelect.addEventListener("change", () => {
    const selectedValue = startSelect.value;

    // Enable all options in end select first
    Array.from(endSelect.options).forEach((option) => {
      option.disabled = false;
    });

    // Disable matching options in end select
    if (selectedValue) {
      Array.from(endSelect.options).forEach((option) => {
        if (option.value === selectedValue) {
          option.disabled = true;
        }
      });

      // If currently selected end node is the same as start, reset it
      if (endSelect.value === selectedValue) {
        endSelect.value = "";
      }
    }
  });

  endSelect.addEventListener("change", () => {
    const selectedValue = endSelect.value;

    // Enable all options in start select first
    Array.from(startSelect.options).forEach((option) => {
      option.disabled = false;
    });

    // Disable matching options in start select
    if (selectedValue) {
      Array.from(startSelect.options).forEach((option) => {
        if (option.value === selectedValue) {
          option.disabled = true;
        }
      });

      // If currently selected start node is the same as end, reset it
      if (startSelect.value === selectedValue) {
        startSelect.value = "";
      }
    }
  });
}

function createOption(value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = text;
  return option;
}

function clearPath() {
  // Remove all lines
  const lines = svg.getElementsByTagName("line");
  while (lines.length > 0) {
    lines[0].remove();
  }

  // Reset node colors and remove path-node class
  const circles = svg.getElementsByTagName("circle");
  for (let circle of circles) {
    circle.setAttribute("fill", "#666");
    circle.classList.remove("path-node");
    circle.setAttribute("r", "6");
  }

  // Hide all node labels and remove path-label class
  const labels = svg.querySelectorAll(".node-label");
  labels.forEach((label) => {
    label.classList.remove("visible");
    label.classList.remove("path-label");
  });

  // Reset dropdown selections
  const startSelect = document.getElementById("start-select");
  const endSelect = document.getElementById("end-select");
  startSelect.value = "";
  endSelect.value = "";

  // Re-enable all options in both dropdowns
  Array.from(startSelect.options).forEach((option) => {
    option.disabled = false;
  });
  Array.from(endSelect.options).forEach((option) => {
    option.disabled = false;
  });

  // Hide path info
  const pathInfo = document.getElementById("path-info");
  pathInfo.classList.add("hidden");
  document.getElementById("distance").textContent = "";
  document.getElementById("path-sequence").textContent = "";

  if (graph.showAllEdges) {
    drawAllEdges();
  }
}

function drawPath(result) {
  clearPath();

  const { path, distance } = result;
  if (!path) return;

  // Draw edges
  for (let i = 0; i < path.length - 1; i++) {
    const currentNode = graph.getNodeInfo(path[i]);
    const nextNode = graph.getNodeInfo(path[i + 1]);
    drawEdge(
      currentNode.x,
      currentNode.y,
      nextNode.x,
      nextNode.y,
      "#4CAF50",
      3
    );
  }

  // Color and label nodes
  path.forEach((nodeId, index) => {
    const node = graph.getNodeInfo(nodeId);
    const circle = svg.querySelector(`circle[data-node-id="${nodeId}"]`);
    const label = circle.parentNode.querySelector(".node-label");

    // Set node color and class
    circle.classList.add("path-node");
    if (index === 0) {
      circle.setAttribute("fill", "#4CAF50"); // Start node - green
    } else if (index === path.length - 1) {
      circle.setAttribute("fill", "#f44336"); // End node - red
    } else {
      circle.setAttribute("fill", "#FFA500"); // Intermediate nodes - orange
    }

    // Make label permanently visible for path nodes
    label.classList.add("path-label");
  });

  // Update path info
  const pathInfo = document.getElementById("path-info");
  const distanceElement = document.getElementById("distance");
  const pathSequenceElement = document.getElementById("path-sequence");

  // Update the content
  distanceElement.textContent = `Total Distance: ${distance} meters`;
  pathSequenceElement.textContent = `Path: ${path
    .map((id) => graph.getNodeInfo(id).name)
    .join(" → ")}`;

  // Show the path info
  pathInfo.classList.remove("hidden");
  pathInfo.classList.remove("animate__fadeOut");
  pathInfo.classList.add("animate__fadeIn");
}

function findPath() {
  const startId = document.getElementById("start-select").value;
  const endId = document.getElementById("end-select").value;

  if (!startId || !endId) {
    alert("Please select both start and end locations");
    return;
  }

  if (startId === endId) {
    alert("Start and end locations cannot be the same");
    return;
  }

  const result = graph.getPath(startId, endId);
  if (!result) {
    alert("No path found between selected locations");
    return;
  }

  drawPath(result);
}

// Initialize everything when the page loads
window.addEventListener("load", () => {
  initializeGraph();

  document.getElementById("find-path").addEventListener("click", findPath);
  document.getElementById("clear-path").addEventListener("click", clearPath);
});
