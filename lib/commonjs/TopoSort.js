'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const {
  _
} = require('@genx/july');

class TopoSort {
  constructor() {
    _defineProperty(this, "mapOfDependents", {});

    _defineProperty(this, "mapOfDependencies", {});
  }

  add(dependency, newDependents) {
    newDependents = Array.isArray(newDependents) ? newDependents : [newDependents];
    const dependents = this.mapOfDependents[dependency];
    newDependents.forEach(dependent => {
      const dependencies = this.mapOfDependencies[dependent];

      if (!dependencies) {
        this.mapOfDependencies[dependent] = new Set([dependency]);
      } else {
        dependencies.add(dependency);
      }

      if (dependents) {
        dependents.add(dependent);
      }
    });

    if (!dependents) {
      this.mapOfDependents[dependency] = new Set(newDependents);
    }
  }

  hasDependency(node) {
    return this.mapOfDependencies[node] && this.mapOfDependencies[node].size > 0 || false;
  }

  hasDependent(node) {
    return this.mapOfDependents[node] && this.mapOfDependents[node].size > 0 || false;
  }

  sort() {
    const l = [];
    const nodesWithDependents = Object.keys(this.mapOfDependents);
    const nodesWithDependencies = Object.keys(this.mapOfDependencies);
    const initialNodes = new Set(nodesWithDependents);
    nodesWithDependencies.forEach(nodeHasDependency => initialNodes.delete(nodeHasDependency));
    const s = [...initialNodes];
    const allNodes = new Set(nodesWithDependents.concat(nodesWithDependencies));
    let unsorted = allNodes.size;

    const numWithDependencies = _.mapValues(this.mapOfDependencies, node => node.size);

    while (s.length !== 0) {
      const n = s.shift();
      l.push(n);
      --unsorted;
      const dependentsOfN = this.mapOfDependents[n];

      if (dependentsOfN) {
        for (const dependentOfN of dependentsOfN) {
          if (--numWithDependencies[dependentOfN] === 0) {
            s.push(dependentOfN);
          }
        }
      }
    }

    if (unsorted !== 0) {
      const circular = [];

      for (const node in numWithDependencies) {
        if (numWithDependencies[node] !== 0) {
          circular.push(node);
        }
      }

      throw new Error('At least 1 circular dependency in nodes: \n\n' + circular.join('\n') + '\n\nGraph cannot be sorted!');
    }

    return l;
  }

}

module.exports = TopoSort;
//# sourceMappingURL=TopoSort.js.map