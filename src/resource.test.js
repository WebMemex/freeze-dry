import { Resource } from './resource.js'

let testResource

beforeEach(() => {
    testResource = {
        url: 'abs:a',
        links: [
            {
                target: 'aa',
                absoluteTarget: 'abs:aa',
                resource: {
                    url: 'abs:aa',
                    links: [
                        {
                            target: 'aaa',
                            absoluteTarget: 'abs:aaa',
                            resource: { url: 'abs:aaa', links: [] },
                        },
                    ],
                },
            },
            {
                target: 'ab',
                absoluteTarget: 'abs:ab',
                resource: { url: 'abs:ab', links: [] },
            },
            {
                target: 'a',
                absoluteTarget: 'abs:a',
                // omitting resource, it is optional (and for this link it would be recursive)
            },
        ],
    }
})


describe('makeLinksAbsolute', () => {
    test('makes links to other resources (or itself) absolute', () => {
        testResource.links.map(link => Resource.makeLinkAbsolute(link, testResource))

        expect(testResource.links[0].target).toEqual('abs:aa')
        expect(testResource.links[1].target).toEqual('abs:ab')
        expect(testResource.links[2].target).toEqual('abs:a')
    })

    test('keeps relative (hash-only) links relative', () => {
        const testResource = {
            url: 'abs:a',
            links: [
                {
                    target: '#top',
                    absoluteTarget: 'abs:a#top',
                },
            ],
        }
        testResource.links.map(link => Resource.makeLinkAbsolute(link, testResource))

        expect(testResource.links[0].target).toEqual('#top')
    })

    test('makes absolute (or not hash-only) links pointing within the resource relative', () => {
        const testResource = {
            url: 'abs:a',
            links: [
                {
                    target: 'abs:a#top',
                    absoluteTarget: 'abs:a#top',
                },
                {
                    target: 'a#top', // not really absolute, but not yet hash-only either.
                    absoluteTarget: 'abs:a#top',
                },
            ],
        }
        testResource.links.map(link => Resource.makeLinkAbsolute(link, testResource))

        expect(testResource.links[0].target).toEqual('#top')
        expect(testResource.links[1].target).toEqual('#top')
    })
})
