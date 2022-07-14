"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const {
  _
} = require('@genx/july');

const Tree = Node => {
  var _class;

  return _class = class extends Node {
    find(predicate) {
      let queue = Node.cloneChildrenList(this);

      while (queue.length > 0) {
        const node = queue.shift();
        if (predicate(node)) return node;
        queue = queue.concat(Node.cloneChildrenList(node));
      }

      return undefined;
    }

  }, _defineProperty(_class, "Node", Node), _class;
};

class DataNode {
  static cloneChildrenList(node) {
    return node.children.concat();
  }

  constructor(data) {
    _defineProperty(this, "children", []);

    this.data = data;
  }

  get size() {
    return this.children.length;
  }

  append(node) {
    node.parent = this;
    this.children.push(node);
  }

  insert(i, node) {
    node.parent = this;
    this.children.splice(Math.max(0, i), 0, node);
  }

  remove(node) {
    if (node.parent !== this) {
      throw new Error('Removing a node which is not a child of the current node.');
    }

    this.children = _.reject(this.children, n => n === node);
    delete node.parent;
    return node;
  }

  removeAtIndex(i) {
    const [removed] = this.children.splice(i, 1);

    if (removed) {
      delete removed.parent;
    }

    return removed;
  }

}

class KeyDataNode {
  static cloneChildrenList(node) {
    return Object.values(node.children);
  }

  constructor(key, data) {
    _defineProperty(this, "children", {});

    this.key = key;
    this.data = data;
  }

  get size() {
    return Object.keys(this.children).length;
  }

  findByKeyPath(keys) {
    keys = keys.concat();

    if (keys.length === 0 || keys[0] !== this.key) {
      return undefined;
    }

    let value = {
      children: {
        [this.key]: this
      }
    };

    _.find(keys, key => {
      value = value.children[key];
      return typeof value === 'undefined';
    });

    return value;
  }

  appendDataByKeyPath(keys, data) {
    keys = keys.concat();

    if (keys.length === 0 || keys[0] !== this.key) {
      throw new Error(`The given key path "${keys.join(' / ')}" is not starting from the correct initial key "${this.key}".`);
    }

    const lastKey = keys.pop();
    let lastNode = {
      children: {
        [this.key]: this
      }
    };
    let node;

    _.each(keys, key => {
      if (key in lastNode.children) {
        lastNode = lastNode.children[key];
      } else {
        node = new KeyDataNode(key);
        lastNode.append(node);
        lastNode = node;
      }
    });

    node = new KeyDataNode(lastKey, data);
    lastNode.append(node);
    return node;
  }

  append(node) {
    node.parent = this;

    if (node.key in this.children) {
      throw new Error(`Duplicate node key: ${node.key}`);
    }

    this.children[node.key] = node;
  }

  remove(node) {
    if (node.parent !== this || !(node.key in this.children)) {
      throw new Error('Removing a node which is not a child of the current node.');
    }

    delete this.children[node.key];
    delete node.parent;
    return node;
  }

  getKeyPath() {
    const paths = [this.key];
    let curr = this;

    while (curr.parent) {
      curr = curr.parent;
      paths.push(curr.key);
    }

    return paths.reverse();
  }

}

module.exports = {
  Tree: Tree(DataNode),
  KeyTree: Tree(KeyDataNode)
};
//# sourceMappingURL=Tree.js.map