import iface from 'jsdom/lib/jsdom/living/generated/Element'
import NODE_TYPE from 'jsdom/lib/jsdom/living/node-type'

Element.prototype.insertAdjacentElement = function insertAdjacentElement(position, node) {
    position = position.toLowerCase()

    function checkHasValidParentNode(el) {
        if (el.parentNode === null || el.parentNode.nodeType === NODE_TYPE.DOCUMENT_NODE) {
            throw new DOMException(
                DOMException.NO_MODIFICATION_ALLOWED_ERR,
                "Cannot insert element adjacent to parent-less nodes or children of document nodes.",
            )
        }
    }

    switch (position) {
        case "beforebegin": {
            checkHasValidParentNode(this)
            this.parentNode.insertBefore(node, this)
            break
        }
        case "afterend": {
            checkHasValidParentNode(this)
            this.parentNode.insertBefore(node, this.nextSibling)
            break
        }
        case "afterbegin": {
            this.insertBefore(node, this.firstChild)
            break
        }
        case "beforeend": {
            this.appendChild(node)
            break
        }
        default: {
            throw new DOMException(
                DOMException.SYNTAX_ERR,
                'Must provide one of "beforebegin", "afterend", "afterbegin", or "beforeend".',
            )
        }
    }
}

global.fetch = require('jest-fetch-mock')
