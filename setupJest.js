import iface from 'jsdom/lib/jsdom/living/generated/Element'

Element.prototype.insertAdjacentElement = function insertAdjacentElement(position, node) {
    position = position.toLowerCase();
    
    switch (position) {
        case "beforebegin": {
            if (this.parentNode === null || this.parentNode.nodeType === NODE_TYPE.DOCUMENT_NODE) {
                throw new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR, "Cannot insert HTML adjacent to " +"parent-less nodes or children of document nodes.");
            } else {
                this.parentNode.insertBefore(node, this);
            }
            break;
        }
        case "afterend": {
            if (this.parentNode === null || this.parentNode.nodeType === NODE_TYPE.DOCUMENT_NODE) {
                throw new DOMException(DOMException.NO_MODIFICATION_ALLOWED_ERR, "Cannot insert HTML adjacent to " +"parent-less nodes or children of document nodes.");
            } else {
                this.parentNode.insertBefore(node, this.nextSibling);
            }
            break;
        }
        case "afterbegin": {
            this.insertBefore(node, this.firstChild);
            break;
        }
        case "beforeend": {
            this.appendChild(node);
            break;
        }
        default: {
            throw new DOMException(DOMException.SYNTAX_ERR, "Must provide one of \"beforebegin\", \"afterend\", " +"\"afterbegin\", or \"beforeend\".");
        }
    }
}

global.fetch = require('jest-fetch-mock')
