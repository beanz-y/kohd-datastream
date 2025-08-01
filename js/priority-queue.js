// js/priority-queue.js

/**
 * A simple Min-Priority Queue implementation.
 * Used by the A* algorithm to efficiently manage the open set of nodes to visit.
 */
export class PriorityQueue {
    constructor() {
        this.elements = [];
    }

    enqueue(element, priority) {
        this.elements.push({ element, priority });
        // Sort to keep the element with the lowest priority (cost) at the end.
        this.elements.sort((a, b) => b.priority - a.priority);
    }

    dequeue() {
        // The pop() method is efficient as the lowest priority is always last.
        return this.elements.pop().element;
    }

    isEmpty() {
        return this.elements.length === 0;
    }
}