"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(_a) {
    var t = _a.types;
    return {
        pre: function (state) {
            this.localCounts = {};
        },
        visitor: {
            JSXOpeningElement: function (path, state) {
                var elementName = path.node.name;
                if (t.isJSXIdentifier(elementName) && /^[a-z]/.test(elementName.name)) { // Check if element name is lowercase
                    var tagName = elementName.name;
                    if (!this.localCounts[tagName]) {
                        this.localCounts[tagName] = { total: 0, style: 0, className: 0, files: [] };
                    }
                    var hasStyle = path.node.attributes.some(function (attr) { return t.isJSXAttribute(attr) && attr.name.name === 'style'; });
                    var hasClassName = path.node.attributes.some(function (attr) { return t.isJSXAttribute(attr) && attr.name.name === 'className'; });
                    this.localCounts[tagName].total += 1;
                    if (hasStyle)
                        this.localCounts[tagName].style += 1;
                    if (hasClassName)
                        this.localCounts[tagName].className += 1;
                    // Append filename with line number
                    var location_1 = path.node.loc ? ":".concat(path.node.loc.start.line) : '';
                    var fileLocation = "".concat(this.filename).concat(location_1);
                    this.localCounts[tagName].files.push(fileLocation);
                }
            }
        },
        post: function () {
            var filename = this.filename || 'unknown';
            if (Object.keys(this.localCounts).length > 0) {
                this.opts.globalState[filename] = this.localCounts;
            }
        }
    };
}
exports.default = default_1;
//# sourceMappingURL=plugin.js.map