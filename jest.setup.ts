import { TextEncoder } from 'util'

// TextEncoder is used by viem, supported by Browsers for over five years and node since v11 as a global export: https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder
// `js-dom` doesn't set some of the globals: https://github.com/jestjs/jest/blob/v29.7.0/packages/jest-environment-jsdom/src/index.ts
// for reference, node does: https://github.com/jestjs/jest/blob/4e56991693da7cd4c3730dc3579a1dd1403ee630/packages/jest-environment-node/src/index.ts#L40
Object.assign(global, { TextEncoder })

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
