/* eslint-env jest */
/* eslint import/namespace: "off" */

import freezeDry from './index'
import * as inlineStyles from './inline-styles'
import * as removeScripts from './remove-scripts'
import * as inlineImages from './inline-images'
import * as setContentSecurityPolicy from './set-content-security-policy'
import * as fixLinks from './fix-links'
import * as removeNoscripts from './remove-noscripts'


beforeAll(() => {
    inlineStyles.default = jest.fn()
    removeScripts.default = jest.fn()
    inlineImages.default = jest.fn()
    fixLinks.default = jest.fn()
    setContentSecurityPolicy.default = jest.fn()
    removeNoscripts.default = jest.fn()
})

describe('freezeDry', () => {
    test('should run all the jobs', async () => {
        await freezeDry()
        expect(inlineStyles.default).toHaveBeenCalled()
        expect(removeScripts.default).toHaveBeenCalled()
        expect(inlineImages.default).toHaveBeenCalled()
        expect(fixLinks.default).toHaveBeenCalled()
        expect(setContentSecurityPolicy.default).toHaveBeenCalled()
        expect(removeNoscripts.default).toHaveBeenCalled()
    })

    test('should return a string', async () => {
        const html = await freezeDry()
        expect(typeof html).toBe('string')
    })
})
