import { PluginObj, types } from '@babel/core';

interface ElementCount {
  total: number;
  style: number;
  className: number;
  files: string[];
}

interface PluginState {
  opts: {
    globalState: Record<string, Record<string, ElementCount>>;
  };
  filename: string;
  localCounts: Record<string, ElementCount>;
}

export default function({ types: t }: { types: typeof types }): PluginObj<PluginState> {
  return {
    pre(state) {
      this.localCounts = {};
    },
    visitor: {
      JSXOpeningElement(path, state) {
        const elementName = path.node.name;

        if (t.isJSXIdentifier(elementName) && /^[a-z]/.test(elementName.name)) {  // Check if element name is lowercase
          const tagName = elementName.name;
          if (!this.localCounts[tagName]) {
            this.localCounts[tagName] = { total: 0, style: 0, className: 0, files: [] };
          }

          const hasStyle = path.node.attributes.some(attr => t.isJSXAttribute(attr) && attr.name.name === 'style');
          const hasClassName = path.node.attributes.some(attr => t.isJSXAttribute(attr) && attr.name.name === 'className');

          this.localCounts[tagName].total += 1;
          if (hasStyle) this.localCounts[tagName].style += 1;
          if (hasClassName) this.localCounts[tagName].className += 1;

          // Append filename with line number
          const location = path.node.loc ? `:${path.node.loc.start.line}` : '';
          const fileLocation = `${this.filename}${location}`;
          this.localCounts[tagName].files.push(fileLocation);
        }
      }
    },
    post(this) {
      const filename = this.filename || 'unknown';
      if (Object.keys(this.localCounts).length > 0) {
        this.opts.globalState[filename] = this.localCounts;
      }
    }
  };
}
