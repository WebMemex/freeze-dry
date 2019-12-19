import { datetimeToString } from './set-memento-tags.ts'

describe('datetimeToString', () => {
    test('should work for a basic example', () => {
        const datetime = new Date(Date.UTC(2018, 6, 31, 14, 30, 59, 0))

        const string = datetimeToString(datetime)

        expect(string).toBe('Tue, 31 Jul 2018 14:30:59 GMT')
    })
})
