const { generatePrefixId } = require("../utils/helper")

test('build prefix id with diferent prefix from last id', () => {
    const prefixId = generatePrefixId('TES', 'TEST0001', 0)
    expect(prefixId).toBe('TES00001')
})

test('build prefix id with ten', () => {
    const prefixId = generatePrefixId('TES', 'TES00009', 0)
    expect(prefixId).toBe('TES00010')
})

test('build prefix id with hundred', () => {
    let prefixId = generatePrefixId('TES', 'TES00099', 0)
    expect(prefixId).toBe('TES00100')
    prefixId = generatePrefixId('TES', 'TES00199', 0)
    expect(prefixId).toBe('TES00200')
    prefixId = generatePrefixId('TES', 'TES00299', 0)
    expect(prefixId).toBe('TES00300')
})

test('build prefix id with thousands', () => {
    const prefixId = generatePrefixId('TES', 'TES00999', 0)
    expect(prefixId).toBe('TES01000')
})

test('build prefix id with loop', () => {
    for (let index = 0; index < 9999; index++) {
        const prefixId = generatePrefixId('TEST', '', index)
        if (index > 9995) console.log(prefixId)
        expect(prefixId).toBe('TEST' + ('00000000'.substring(4 + (index + 1).toString().length) + (index + 1)))    
    }
})

test('build prefix id with diferent prefix from last id with loop', () => {
    for (let index = 0; index < 99988; index++) {
        const prefixId = generatePrefixId('TES', 'TES00011', index)
        if (index > 99984) console.log(prefixId)
        expect(prefixId).toBe('TES' + ('00000000'.substring(3 + (index + 1 + 11).toString().length) + (index + 1 + 11)))
    }
})

test('build prefix id with diferent prefix from last id with loop', () => {
    for (let index = 0; index < 99988; index++) {
        const prefixId = generatePrefixId('TES', 'TES00011', index)
        if (index > 99984) console.log(prefixId)
        expect(prefixId).toBe('TES' + ('00000000'.substring(3 + (index + 1 + 11).toString().length) + (index + 1 + 11)))
    }
})