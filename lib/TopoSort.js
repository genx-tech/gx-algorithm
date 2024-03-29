'use strict';
function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
const { _  } = require('@genx/july');
/**
 * @class
 */ let TopoSort = class TopoSort {
    /**
     * Add edges(or one edge, if values is non-array).
     * @param {string} dependency - Incoming node (dependency)
     * @param {string|array} dependents - Outgoing node or nodes
     */ add(dependency, newDependents) {
        // cast to array
        newDependents = Array.isArray(newDependents) ? newDependents : [
            newDependents
        ];
        // get the existing dependents
        const dependents = this.mapOfDependents[dependency];
        newDependents.forEach((dependent)=>{
            // get the existing dependencies
            const dependencies = this.mapOfDependencies[dependent];
            if (!dependencies) {
                // new set of dependencies
                this.mapOfDependencies[dependent] = new Set([
                    dependency
                ]);
            } else {
                dependencies.add(dependency);
            }
            if (dependents) {
                dependents.add(dependent);
            }
        });
        if (!dependents) {
            // new set of dependents
            this.mapOfDependents[dependency] = new Set(newDependents);
        }
    }
    hasDependency(node) {
        return this.mapOfDependencies[node] && this.mapOfDependencies[node].size > 0 || false;
    }
    hasDependent(node) {
        return this.mapOfDependents[node] && this.mapOfDependents[node].size > 0 || false;
    }
    /**
     * Sort the graph. Circular graph throw an error with the circular nodes info.
     * Implementation of http://en.wikipedia.org/wiki/Topological_sorting#Algorithms
     * Reference: http://courses.cs.washington.edu/courses/cse326/03wi/lectures/RaoLect20.pdf
     * @return {Array} Sorted list
     */ sort() {
        // The list contains the final sorted nodes.
        const l = [];
        // Find all the initial 0 incoming edge nodes. If not found, this is is a circular graph, cannot be sorted.
        const nodesWithDependents = Object.keys(this.mapOfDependents);
        const nodesWithDependencies = Object.keys(this.mapOfDependencies);
        const initialNodes = new Set(nodesWithDependents);
        nodesWithDependencies.forEach((nodeHasDependency)=>initialNodes.delete(nodeHasDependency));
        // List of nodes with no unsorted dependencies
        const s = [
            ...initialNodes
        ];
        const allNodes = new Set(nodesWithDependents.concat(nodesWithDependencies));
        // number of unsorted nodes. If it is not zero at the end, this graph is a circular graph and cannot be sorted.
        let unsorted = allNodes.size;
        const numWithDependencies = _.mapValues(this.mapOfDependencies, (node)=>node.size);
        while(s.length !== 0){
            const n = s.shift();
            l.push(n);
            // decrease unsorted count, node n has been sorted.
            --unsorted;
            // n node might have no dependency, so have to check it.
            const dependentsOfN = this.mapOfDependents[n];
            if (dependentsOfN) {
                // decease n's adjacent nodes' incoming edges count. If any of them has 0 incoming edges, push them into s get them ready for detaching from the graph.
                for (const dependentOfN of dependentsOfN){
                    if (--numWithDependencies[dependentOfN] === 0) {
                        // no unsorted dependencies
                        s.push(dependentOfN);
                    }
                }
            }
        }
        // If there are unsorted nodes left, this graph is a circular graph and cannot be sorted.
        // At least 1 circular dependency exist in the nodes with non-zero incoming edges.
        if (unsorted !== 0) {
            const circular = [];
            for(const node in numWithDependencies){
                if (numWithDependencies[node] !== 0) {
                    circular.push(node);
                }
            }
            throw new Error('At least 1 circular dependency in nodes: \n\n' + circular.join('\n') + '\n\nGraph cannot be sorted!');
        }
        return l;
    }
    constructor(){
        /**
     * Map of nodes to a set of nodes as dependents, <string, Set.<string>>
     * @member {object}
     */ _defineProperty(this, "mapOfDependents", {});
        /** -
     * Map of nodes to a set of nodes as dependencies, <string, Set.<string>>
     * @member {object}
     */ _defineProperty(this, "mapOfDependencies", {});
    }
};
module.exports = TopoSort;

//# sourceMappingURL=TopoSort.js.map