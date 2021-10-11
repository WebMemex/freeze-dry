import { Resource } from '.'
import { Link } from '../extract-links/types'

class TestResource extends Resource {
    blob: null
    constructor(public url: string, public links: Link[]) {
        super()
    }
}

describe('makeLinksAbsolute', () => {
    test('makes links to other resources (or itself) absolute', () => {
        const testResourceAAA = new TestResource('abs:aaa', [])
        const testResourceAA = new TestResource('abs:aa', [
            {
                target: 'aaa',
                absoluteTarget: 'abs:aaa',
                isSubresource: true,
                resource: testResourceAAA,
                from: {},
            },
        ])
        const testResourceAB = new TestResource('abs:ab', [])
        const testResource = new TestResource(
            'abs:a',
            [
                {
                    target: 'aa',
                    absoluteTarget: 'abs:aa',
                    isSubresource: true,
                    resource: testResourceAA,
                    from: {},
                },
                {
                    target: 'ab',
                    absoluteTarget: 'abs:ab',
                    isSubresource: true,
                    resource: testResourceAB,
                    from: {},
                },
                {
                    target: 'a',
                    absoluteTarget: 'abs:a',
                    isSubresource: false,
                    from: {},
                    // omitting resource, it is optional (and for this link it would be recursive)
                },
            ]
        )

        testResource.makeLinksAbsolute()

        expect(testResource.links[0].target).toEqual('abs:aa')
        expect(testResource.links[1].target).toEqual('abs:ab')
        expect(testResource.links[2].target).toEqual('abs:a')
    })

    test('keeps relative (hash-only) links relative', () => {
        const testResource = new TestResource(
            'abs:a',
            [
                {
                    target: '#top',
                    absoluteTarget: 'abs:a#top',
                    isSubresource: false,
                    from: {},
                },
            ],
        )
        testResource.makeLinksAbsolute()

        expect(testResource.links[0].target).toEqual('#top')
    })

    test('makes absolute (or not hash-only) links pointing within the resource relative', () => {
        const testResource = new TestResource(
            'abs:a',
            [
                {
                    target: 'abs:a#top',
                    absoluteTarget: 'abs:a#top',
                    isSubresource: false,
                    from: {},
                },
                {
                    target: 'a#top', // not really absolute, but not yet hash-only either.
                    absoluteTarget: 'abs:a#top',
                    isSubresource: false,
                    from: {},
                },
            ],
        )
        testResource.makeLinksAbsolute()

        expect(testResource.links[0].target).toEqual('#top')
        expect(testResource.links[1].target).toEqual('#top')
    })
})
