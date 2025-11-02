class Graph {
    constructor() {
        this.nodes = new Map();
        this.showAllEdges = false; // Flag to control edge visibility
    }

    addNode(id, name, x, y, aliases = []) {
        this.nodes.set(id, {
            id,
            name,
            x,
            y,
            aliases,
            neighbors: new Map()
        });
    }

    addEdge(sourceId, targetId, distance) {
        // Add edge in both directions since it's an undirected graph
        const sourceNode = this.nodes.get(sourceId);
        const targetNode = this.nodes.get(targetId);

        if (sourceNode && targetNode) {
            sourceNode.neighbors.set(targetId, distance);
            targetNode.neighbors.set(sourceId, distance);
        }
    }

    dijkstra(startId) {
        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set();

        // Initialize distances
        for (const [nodeId] of this.nodes) {
            distances.set(nodeId, nodeId === startId ? 0 : Infinity);
            previous.set(nodeId, null);
            unvisited.add(nodeId);
        }

        while (unvisited.size > 0) {
            // Find the unvisited node with minimum distance
            let minDistance = Infinity;
            let currentId = null;

            for (const nodeId of unvisited) {
                const distance = distances.get(nodeId);
                if (distance < minDistance) {
                    minDistance = distance;
                    currentId = nodeId;
                }
            }

            if (currentId === null || minDistance === Infinity) {
                break; // No reachable nodes left
            }

            unvisited.delete(currentId);
            const currentNode = this.nodes.get(currentId);

            // Update distances to neighbors
            for (const [neighborId, edgeDistance] of currentNode.neighbors) {
                if (unvisited.has(neighborId)) {
                    const newDistance = distances.get(currentId) + edgeDistance;
                    if (newDistance < distances.get(neighborId)) {
                        distances.set(neighborId, newDistance);
                        previous.set(neighborId, currentId);
                    }
                }
            }
        }

        return { distances, previous };
    }

    getPath(startId, endId) {
        const { distances, previous } = this.dijkstra(startId);
        
        if (distances.get(endId) === Infinity) {
            return null; // No path exists
        }

        const path = [];
        let currentId = endId;

        while (currentId !== null) {
            path.unshift(currentId);
            currentId = previous.get(currentId);
        }

        return {
            path,
            distance: distances.get(endId)
        };
    }

    getNodeInfo(nodeId) {
        return this.nodes.get(nodeId);
    }
}