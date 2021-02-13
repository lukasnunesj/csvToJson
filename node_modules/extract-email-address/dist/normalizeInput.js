"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _emojiRegex = _interopRequireDefault(require("emoji-regex"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const emojiRegex = (0, _emojiRegex.default)();

var _default = input => {
  return input.replace(emojiRegex, ' ').replace(/(?<=\s|^)([a-z0-9.-_@])\s?(?=[a-z0-9.-_@](?:\s|$))/g, '$1').replace(/\s+at\s+/g, '@').replace(/\s+dot\s+/g, '.').replace(/\s*<at>\s*/g, '@').replace(/\s*<dot>\s*/g, '.').replace(/\s*\(at\)\s*/g, '@').replace(/\s*\(dot\)\s*/g, '.').replace(/\s*\[at\]\s*/g, '@').replace(/\s*\[dot\]\s*/g, '.') // Matches all ASCII characters from the space to tilde.
  .replace(/[^ -~]/g, ' ').trim().toLowerCase();
};

exports.default = _default;
//# sourceMappingURL=normalizeInput.js.map