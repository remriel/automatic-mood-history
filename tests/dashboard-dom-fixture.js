// Minimal Obsidian DOM adapter for exercising the bundled dashboard without a browser.
const Module = require("node:module");
const original = Module._load;
Module._load = function (name, ...args) {
  if (name === "obsidian") return { Plugin: class {}, PluginSettingTab: class {}, Component: class {}, Setting: class {}, Notice: class {}, TFile: class {}, TFolder: class {} };
  return original.call(this, name, ...args);
};
const Mood = require("../main.js");
Module._load = original;

class Element {
  constructor(tag = "div") {
    this.tagName = tag;
    this.namespaceURI = "http://www.w3.org/2000/svg";
    this.children = []; this.parentElement = null; this.attributes = {}; this.dataset = {}; this.events = {};
    this.style = { setProperty(key, value) { this[key] = value; } };
    this.classList = { values: new Set(), add(...values) { values.forEach(value => this.values.add(value)); }, contains(value) { return this.values.has(value); } };
    this.clientWidth = 640; this._text = ""; this.rootConnected = false;
  }
  get childNodes() { return [...this.children]; }
  get isConnected() { return this.rootConnected || Boolean(this.parentElement?.isConnected); }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(""); }
  set textContent(value) { this._text = String(value); this.replaceChildren(); }
  setAttribute(key, value) {
    this.attributes[key] = String(value);
    if (key === "class") String(value).split(/\s+/).forEach(name => this.classList.add(name));
    if (key === "value") this.value = String(value);
    if (key === "type") this.type = String(value);
  }
  getAttribute(key) { return this.attributes[key] ?? null; }
  removeAttribute(key) { delete this.attributes[key]; }
  appendChild(child) {
    if (child.parentElement) child.remove();
    this.children.push(child); child.parentElement = this; return child;
  }
  append(...children) { children.forEach(child => this.appendChild(child)); }
  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter(child => child !== this);
    this.parentElement = null;
  }
  replaceChildren(...children) {
    for (const child of this.children) child.parentElement = null;
    this.children = []; children.forEach(child => this.appendChild(child));
  }
  empty() { this._text = ""; this.replaceChildren(); }
  setText(value) { this.textContent = value; }
  createEl(tag, options = {}) {
    const child = new Element(tag);
    if (options.cls) child.setAttribute("class", options.cls);
    if (options.text !== undefined) child.textContent = options.text;
    for (const [key, value] of Object.entries(options.attr || {})) child.setAttribute(key, value);
    this.appendChild(child); return child;
  }
  createDiv(options) { return this.createEl("div", options); }
  addEventListener(name, callback) { (this.events[name] ||= []).push(callback); }
  trigger(name) { for (const callback of this.events[name] || []) callback({ preventDefault() {} }); }
  focus() {}
  contains(element) { return element === this || this.children.some(child => child.contains(element)); }
  querySelectorAll(selector) {
    return this.walk().filter(element => selector === "[data-series]" && element.getAttribute("data-series") !== null);
  }
  walk() { return this.children.flatMap(child => [child, ...child.walk()]); }
}

global.document = { createElementNS: (_namespace, tag) => new Element(tag) };
module.exports = { Mood, Element };
