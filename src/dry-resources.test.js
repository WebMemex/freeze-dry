import { allResourcesInTree, makeLinksAbsolute } from './dry-resources.js'

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
        ],
    }
})

test('allResourcesInTree', () => {
    const result = allResourcesInTree(testResource)
    const urls = Array.from(result).map(resource => resource.url)

    expect(urls).toEqual(['abs:a', 'abs:aa', 'abs:aaa', 'abs:ab'])
})

test('makeLinksAbsolute', () => {
    makeLinksAbsolute(testResource)

    expect(testResource.links[0].target).toEqual('abs:aa')
    expect(testResource.links[1].target).toEqual('abs:ab')
})
