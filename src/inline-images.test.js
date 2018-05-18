/* eslint-env jest */
/* eslint import/namespace: "off" */

import inlineImages from './inline-images'
import * as common from './common'


describe('inlineImages', () => {
    test('should call inlineUrlsInAttributes', async () => {
        common.inlineUrlsInAttributes = jest.fn()
        const doc = window.document.implementation.createHTMLDocument()
        const rootElement = doc.documentElement
        await inlineImages({rootElement})
        expect(common.inlineUrlsInAttributes).toHaveBeenCalledTimes(3)
    })
})
