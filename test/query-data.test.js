const query = require('../controllers/query')
const { config } = require('./utils/app-path')
const db = require('../utils/db')
const helper = require('../utils/helper')
const knex = db(config())

jest.setTimeout(50000)

describe('Testing Data', () => {
    beforeEach(async () => {
        try {
            let queryCreate = "CREATE TABLE `ms_test` (`id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, `test_name` varchar(200) NOT NULL);"
            let queryCreate2 = "CREATE TABLE `ms_test_child` (`id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, `test_id` int(11) NOT NULL ,`test_name_child` varchar(200) NOT NULL);"
            await knex.raw(queryCreate)
            await knex.raw("INSERT INTO `ms_test` (`test_name`) VALUES ('test nama 1');")
            await knex.raw("INSERT INTO `ms_test` (`test_name`) VALUES ('test nama 2');")
            await knex.raw("INSERT INTO `ms_test` (`test_name`) VALUES ('test nama 3');")

            await knex.raw(queryCreate2)
            await knex.raw("INSERT INTO `ms_test_child` (`test_id`, `test_name_child`) VALUES (1, 'test nama child 1');")
            return await knex.raw("INSERT INTO `ms_test_child` (`test_id`, `test_name_child`) VALUES (1, 'test nama child 2');")
        } catch (error) {
            return error
        }
    });

    afterEach(async () => {
        try {
            await knex.raw("DROP TABLE ms_test")
            return await knex.raw("DROP TABLE ms_test_child")
        } catch (error) {
            return error
        }
    });

    // SELECT
    test('Select All', async () => {
        const body = {"table": "ms_test"}

        const expectedResult = JSON.stringify([
            {
                id: 1,
                test_name: 'test nama 1'
            },
            {
                id: 2,
                test_name: 'test nama 2'
            },
            {
                id: 3,
                test_name: 'test nama 3'
            }
        ])
        let result = null
        try {
            result = await query.select(body, knex)
        } catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('Select With Column', async () => {
        const body = {
            table: "ms_test",
            column: ["test_name"]
        }

        const expectedResult = JSON.stringify([
            {
                test_name: 'test nama 1'
            },
            {
                test_name: 'test nama 2'
            },
            {
                test_name: 'test nama 3'
            }
        ])
        let result = null
        try {
            result = await query.select(body, knex(body.table))
        } catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('Select Column With Expression', async () => {
        const body = {
            table: "ms_test",
            column: [
                "ms_test.*",
                {
                    "type": "expression",
                    "colname": "count(:col:) as :alias:",
                    "value": {
                        "col": "test_child.test_id",
                        "alias": "childs_test"
                    }
                },
            ],
            join: [
                {
                    "name": "ms_test_child as test_child",
                    "type": "left",
                    "kind": "table",
                    "constraint": [
                        {
                            "source": "test_child.test_id",
                            "dest": "ms_test.id",
                            "op": "eq"
                        }
                    ]
                },
            ],
            group: [
                "ms_test.id"
            ],
        }

        const expectedResult = JSON.stringify([
            {
                id: 1,
                test_name: 'test nama 1',
                childs_test: 2
            },
            {
                id: 2,
                test_name: 'test nama 2',
                childs_test: 0
            },
            {
                id: 3,
                test_name: 'test nama 3',
                childs_test: 0
            }
        ])
        let result = null
        try {
            result = await query.select(body, knex(body.table))
        } catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('Select With Condition', async () => {
        const filterFieds = []
        filterFieds.push({
            name: "ms_test.test_name",
            value: "test nama 1",
            op: "eq"
        })

        const body = {
            table: "ms_test",
            filter: {
                type: "and",
                fields: filterFieds
            }
        }

        const expectedResult = JSON.stringify([
            {
                id: 1,
                test_name: 'test nama 1'
            }
        ])
        let result = null
        try {
            result = await query.select(body, knex(body.table))
        } catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('Select With Multiple Condition', async () => {
        const filterFieds = []
        filterFieds.push({
            name: "ms_test.test_name",
            value: "test nama 1",
            op: "eq"
        })
        filterFieds.push({
            name: "ms_test.id",
            value: "1",
            op: "eq"
        })

        const body = {
            table: "ms_test",
            filter: {
                type: "and",
                fields: filterFieds
            }
        }

        const expectedResult = JSON.stringify([
            {
                id: 1,
                test_name: 'test nama 1'
            }
        ])
        let result = null
        try {
            result = await query.select(body, knex(body.table))
        } catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('Select With OrderBy', async () => {
        const body = {
            table: "ms_test",
            order: [
                {
                    name: 'ms_test.id',
                    type: 'desc'
                }
            ]
        }

        const expectedResult = JSON.stringify([
            {
                id: 3,
                test_name: 'test nama 3'
            },
            {
                id: 2,
                test_name: 'test nama 2'
            },
            {
                id: 1,
                test_name: 'test nama 1'
            }
        ])
        let result = null
        try {
            result = await query.select(body, knex(body.table))
        } catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('Select With Limit and Offset', async () => {
        const body = { table: "ms_test", limit: 2, offset: 0 }

        const expectedResult = JSON.stringify([
            {
                id: 1,
                test_name: 'test nama 1'
            },
            {
                id: 2,
                test_name: 'test nama 2'
            },
        ])
        let result = null
        try {
            result = await query.select(body, knex(body.table))
        } catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('Select Join', async () => {
        const body = {
            table: "ms_test",
            column: ["ms_test.*"],
            join: [
                {
                    "name": "ms_test_child as test_child",
                    "type": "left",
                    "kind": "table",
                    "constraint": [
                        {
                            "source": "test_child.test_id",
                            "dest": "ms_test.id",
                            "op": "eq"
                        }
                    ]
                },
            ]
        }

        const expectedResult = JSON.stringify([
            {
                id: 1,
                test_name: 'test nama 1'
            },
            {
                id: 1,
                test_name: 'test nama 1'
            },
            {
                id: 2,
                test_name: 'test nama 2'
            },
            {
                id: 3,
                test_name: 'test nama 3'
            },
        ])
        let result = null
        try {
            result = await query.select(body, knex(body.table))
        } catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    // INSERT
    test('Insert Normal', async () => {
        const body = {
            table: "ms_test",
            column_values: [
                {
                    test_name: "manos",
                },
                {
                    test_name: "manos 2",
                },
            ]
        }

        const expectedResult = JSON.stringify([4])

        let result = null
        try {
            result = await query.insert(body.column_values, knex(body.table)).sql
        }
        catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }

        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('Insert With Raw', async () => {
        const body = {
            table: "ms_test",
            column_values: [
                {
                    test_name: "manos",
                },
                {
                    test_name: {
                        raw: "concat('manos 2', 'CAT')"
                    }
                },
            ]
        }

        const expectedResult = JSON.stringify([4])

        let result = null
        try {
            result = await query.insert(body.column_values, knex(body.table)).sql
        }
        catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }

        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('Insert Multiple Transactional Query', async () => {
        const body = {
            table: "ms_test",
            column_values: [
                {
                    test_name: "manos",
                },
                {
                    test_name: "manos 2",
                },
            ]
        }

        const expectedResult = JSON.stringify([4])

        let result = null
        try {
            result = await query.insert(body.column_values, knex(body.table)).sql
        }
        catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }

        expect(JSON.stringify(result)).toBe(expectedResult)
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    // UPDATE
    test('Update All', async () => {
        const body = {
            table: "ms_test",
            column_value: {
                test_name: "manos"
            }
        }

        const expectedResult = JSON.stringify(3)

        let result = null
        try {
            result = await query.update(body, knex(body.table))
        }
        catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }

        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('Update With Filter', async () => {
        const body = {
            table: "ms_test",
            column_value: {
                test_name: "manos"
            },
            filter: {
                type: "or",
                fields: [
                    {
                        name: "id",
                        value: 25,
                        op: "eq"
                    }
                ]
            }
        }

        const expectedResult = JSON.stringify(0)

        let result = null
        try {
            result = await query.update(body, knex(body.table))
        }
        catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }

        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('Update Multiple Transactional Query', async () => {
        const body = {
            table: "ms_test",
            column_value: {
                test_name: "manos"
            }
        }

        const expectedResult = JSON.stringify(3)

        let result = null
        try {
            result = await query.update(body, knex(body.table))
        }
        catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }

        expect(JSON.stringify(result)).toBe(expectedResult)
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    // DELETE
    test('Delete All', async () => {
        const body = {
            table: "ms_test"
        }

        const expectedResult = JSON.stringify(3)

        let result = null
        try {
            result = await query.delete(body, knex(body.table))
        }
        catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }

        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('Delete With Filter', async () => {
        const body = {
            table: "ms_test",
            filter: {
                type: 'and',
                fields: [
                    {
                        name: 'id',
                        value: 25,
                        op: 'eq'
                    }
                ]
            }
        }

        const expectedResult = JSON.stringify(3)

        let result = null
        try {
            result = await query.delete(body, knex(body.table))
        }
        catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }

        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('Delete Multiple Transactional Query', async () => {
        const body = {
            table: "ms_test"
        }

        const expectedResult = JSON.stringify(3)

        let result = null
        try {
            result = await query.delete(body, knex(body.table))
        }
        catch (error) {
            result = 'terjadi kesalahan'
            console.log(error)
        }

        expect(JSON.stringify(result)).toBe(expectedResult)
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })
})

async function insertData(event) {
    if (event.type && event.type === 'multiple') {
        const queries = event.queries
        let isError = false
        await knex.transaction(async trx => { 
            for (let i = 0; i < queries.length; i++) {
                const q = queries[i]
                let lastID = ''
                if (q.prefix_id && q.prefix_id.length > 1 && q.prefix_id.length < 6) {
                    const getLastId = await query.getLastItemWithPrefixId(q.table, q.prefix_id, knex).transacting(trx)
                    if (getLastId.length > 0) {
                        lastID = getLastId[0].id
                    }
                }
                let sql = knex(q.table)
                const ids = await query.insert(q.column_values, sql, q.prefix_id, lastID).sql.transacting(trx)
            }
        })
        return {
            status: 201,
            message: 'Request was successfully processed and returned',
        }
    } else {
        const table = event.table
        const column = event.column_values
        const prefixId = event.prefix_id
        if (column) {   
            await knex.transaction(async trx => { 
                let lastID = ''
                if (prefixId && prefixId.length > 1 && prefixId.length < 6) {
                    const getLastId = await query.getLastItemWithPrefixId(table, prefixId, knex).transacting(trx)
                    if (getLastId.length > 0) {
                        lastID = getLastId[0].id
                    }
                }
                let sql = knex(table)
                const ids = await query.insert(column, sql, prefixId, lastID).sql.transacting(trx)
            })
            return {
                status: 201,
                message: 'Request was successfully processed and returned',
            }
        } else {
            return {
                status: 400,
                message: 'Missing or invalid parameter column_values',
            }
        }
        
    }
}

describe('testing id generator', () => {
    beforeEach(async () => {
        try {
            await knex.raw("CREATE TABLE `ms_test_3` (`id` varchar(8) NOT NULL PRIMARY KEY);")
            return await knex.raw("CREATE TABLE `ms_test_2` (`id` varchar(8) NOT NULL PRIMARY KEY);")
        } catch (error) {
            return error
        }
    });

    afterEach(async () => {
        try {
            await knex.raw("DROP TABLE ms_test_3")
            return await knex.raw("DROP TABLE ms_test_2")
        } catch (error) {
            return error
        }
    });

    test('get last id', async () => {
        const body = {
            "table": "ms_test_2",
            "column": [
            ]
        }

        let result = null
        const values = [
            { id: 'TEST0001' },
            { id: 'TEST0002' },
            { id: 'TEST0003' }
        ]
        try {
            const bodyInsert = {
                "table": "ms_test_2",
                "column_values": [
                    { id: 'TEST0001' },
                    { id: 'TEST0002' },
                    { id: 'TEST0003' }
                ]
            }
            const insert = await insertData(bodyInsert)
            result = await query.getLastItemWithPrefixId(bodyInsert.table, "TEST", knex)
        } catch (error) {
            console.log(error)
            result = 'terjadi kesalahan'
        }
        const expectedResult = JSON.stringify([
            { id: 'TEST0003' }
        ])
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('insert multiple generated id in one table', async () => {
        const body = {
            "table": "ms_test_2",
            "column": [
            ]
        }

        let result = null
        const values = [
            { id: 'TEST0001' },
            { id: 'TEST0002' },
            { id: 'TEST0003' }
        ]
        try {
            const bodyInsert = {
                "table": "ms_test_2",
                "column_values": [
                    { id: 'TEST0001' },
                    { id: 'TEST0002' },
                    { id: 'TEST0003' }
                ]
            }
            const bodyInsert2 = {
                "table": "ms_test_2",
                "prefix_id": "TEST",
                "column_values": [
                    {},
                    {},
                    {}
                ]
            }
            await insertData(bodyInsert)
            await insertData(bodyInsert2)
            result = await query.select(body, knex)
        } catch (error) {
            console.log(error)
            result = 'terjadi kesalahan'
        }
        const expectedResult = JSON.stringify([
            { id: 'TEST0001' },
            { id: 'TEST0002' },
            { id: 'TEST0003' },
            { id: 'TEST0004' },
            { id: 'TEST0005' },
            { id: 'TEST0006' }
        ])
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('insert multiple generated id in one table with prefix length less than before', async () => {
        const body = {
            "table": "ms_test_2",
            "column": [
            ]
        }

        let result = null
        try {
            const bodyInsert = {
                "table": "ms_test_2",
                "prefix_id": "TEST",
                "column_values": [
                    { id: 'TEST0001' },
                    { id: 'TEST0002' },
                    { id: 'TEST0003' }
                ]
            }
            const bodyInsert2 = {
                "table": "ms_test_2",
                "prefix_id": "TES",
                "column_values": [
                    {},
                    {},
                    {}
                ]
            }
            await insertData(bodyInsert)
            await insertData(bodyInsert2)
            result = await query.select(body, knex)
        } catch (error) {
            console.log(error)
            result = 'terjadi kesalahan'
        }
        const expectedResult = JSON.stringify([
            { id: 'TES00001' },
            { id: 'TES00002' },
            { id: 'TES00003' },
            { id: 'TEST0001' },
            { id: 'TEST0002' },
            { id: 'TEST0003' }
        ])
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('insert multiple generated id in one table with prefix length more than before', async () => {
        const body = {
            "table": "ms_test_2",
            "column": [
            ]
        }

        let result = null
        try {
            const bodyInsert = {
                "table": "ms_test_2",
                "prefix_id": "TEST",
                "column_values": [
                    { id: 'TEST0001' },
                    { id: 'TEST0002' },
                    { id: 'TEST0003' }
                ]
            }
            const bodyInsert2 = {
                "table": "ms_test_2",
                "prefix_id": "TESTS",
                "column_values": [
                    {},
                    {},
                    {}
                ]
            }
            await insertData(bodyInsert)
            await insertData(bodyInsert2)
            result = await query.select(body, knex)
        } catch (error) {
            console.log(error)
            result = 'terjadi kesalahan'
        }
        const expectedResult = JSON.stringify([
            { id: 'TEST0001' },
            { id: 'TEST0002' },
            { id: 'TEST0003' },
            { id: 'TESTS001' },
            { id: 'TESTS002' },
            { id: 'TESTS003' }
        ])
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('insert multiple generated id in one table with higher prefix number', async () => {
        const body = {
            "table": "ms_test_2",
            "column": [
            ]
        }

        let result = null
        try {
            const bodyInsert = {
                "table": "ms_test_2",
                "column_values": [
                    { id: 'TEST1234' },
                    { id: 'TEST1235' },
                    { id: 'TEST1236' }
                ]
            }
            const bodyInsert2 = {
                "table": "ms_test_2",
                "prefix_id": "TEST",
                "column_values": [
                    {},
                    {},
                    {}
                ]
            }
            const bodyInsert3 = {
                "table": "ms_test_2",
                "prefix_id": "TESTS",
                "column_values": [
                    {},
                    {},
                    {}
                ]
            }
            await insertData(bodyInsert)
            await insertData(bodyInsert2)
            await insertData(bodyInsert3)
            result = await query.select(body, knex)
        } catch (error) {
            console.log(error)
            result = 'terjadi kesalahan'
        }
        const expectedResult = JSON.stringify([
            { id: 'TEST1234' },
            { id: 'TEST1235' },
            { id: 'TEST1236' },
            { id: 'TEST1237' },
            { id: 'TEST1238' },
            { id: 'TEST1239' },
            { id: 'TESTS001' },
            { id: 'TESTS002' },
            { id: 'TESTS003' }
        ])
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('insert multiple generated id in one table with prefix length more than 5', async () => {
        const body = {
            "table": "ms_test_2",
            "column": [
            ]
        }

        let result = null
        try {
            const bodyInsert = {
                "table": "ms_test_2",
                "column_values": [
                    { id: 'TEST1234' },
                    { id: 'TEST1235' },
                    { id: 'TEST1236' }
                ]
            }
            const bodyInsert2 = {
                "table": "ms_test_2",
                "prefix_id": "TESTTT",
                "column_values": [
                    { id: "asdawddd"},
                    { id: "bbbbbbbb"},
                    { id: "cccccccc"}
                ]
            }
            await insertData(bodyInsert)
            await insertData(bodyInsert2)
            result = await query.select(body, knex)
        } catch (error) {
            console.log(error)
            result = 'terjadi kesalahan'
        }
        const expectedResult = JSON.stringify([
            { id: "asdawddd" },
            { id: "bbbbbbbb" },
            { id: "cccccccc" },
            { id: 'TEST1234' },
            { id: 'TEST1235' },
            { id: 'TEST1236' }
        ])
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('insert multiple generated id in one table with prefix length less than 2', async () => {
        const body = {
            "table": "ms_test_2",
            "column": [
            ]
        }

        let result = null
        try {
            const bodyInsert = {
                "table": "ms_test_2",
                "column_values": [
                    { id: 'TEST1234' },
                    { id: 'TEST1235' },
                    { id: 'TEST1236' }
                ]
            }
            const bodyInsert2 = {
                "table": "ms_test_2",
                "prefix_id": "T",
                "column_values": [
                    { id: "asdawddd"},
                    { id: "bbbbbbbb"},
                    { id: "cccccccc"}
                ]
            }
            await insertData(bodyInsert)
            await insertData(bodyInsert2)
            result = await query.select(body, knex)
        } catch (error) {
            console.log(error)
            result = 'terjadi kesalahan'
        }
        const expectedResult = JSON.stringify([
            { id: "asdawddd" },
            { id: "bbbbbbbb" },
            { id: "cccccccc" },
            { id: 'TEST1234' },
            { id: 'TEST1235' },
            { id: 'TEST1236' }
        ])
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })

    test('insert multiple generated id in multiple table with multiple condition of prefix', async () => {
        const bodySelect = {
            "table": "ms_test_2",
            "column": [
            ]
        }
        const bodySelect2 = {
            "table": "ms_test_3",
            "column": [
            ]
        }

        const bodyInsertMultiple ={
            "type": "multiple",
            "queries": []
        }

        let result = null
        try {
            const bodyInsert = {
                "table": "ms_test_2",
                "column_values": [
                    { id: 'TEST1234' },
                    { id: 'TEST1235' },
                    { id: 'TEST1236' },
                ]
            }
            bodyInsertMultiple.queries.push(bodyInsert)

            const bodyInsert2 = {
                "table": "ms_test_2",
                "prefix_id": "TEST",
                "column_values": [
                    { id: "asdawddd"},
                    { id: "bbbbbbbb"},
                    { id: "cccccccc"}
                ]
            }
            bodyInsertMultiple.queries.push(bodyInsert2)

            const bodyInsert3 = {
                "table": "ms_test_3",
                "prefix_id": "TEST",
                "column_values": [
                    { id: "asdawddd"},
                    { id: "bbbbbbbb"},
                    { id: "cccccccc"}
                ]
            }
            bodyInsertMultiple.queries.push(bodyInsert3)

            const bodyInsert4 = {
                "table": "ms_test_2",
                "column_values": [
                    { id: "asdawddd"},
                    { id: "bbbbbbbb"},
                    { id: "cccccccc"}
                ]
            }
            bodyInsertMultiple.queries.push(bodyInsert4)

            await insertData(bodyInsertMultiple)
            result = [
                ...(await query.select(bodySelect, knex)),
                ...(await query.select(bodySelect2, knex))
            ]
        } catch (error) {
            console.log(error)
            result = 'terjadi kesalahan'
        }
        const expectedResult = JSON.stringify([
            { id: "asdawddd"},
            { id: "bbbbbbbb"},
            { id: "cccccccc"},
            { id: 'TEST1234' },
            { id: 'TEST1235' },
            { id: 'TEST1236' },
            { id: 'TEST1237' },
            { id: 'TEST1238' },
            { id: 'TEST1239' },
            { id: 'TEST0001' },
            { id: 'TEST0002' },
            { id: 'TEST0003' }
        ])
        return expect(JSON.stringify(result)).toBe(expectedResult)
    })
})

describe('testing inject drop', () => {
    beforeEach(async () => {
        try {
            let queryCreate = "CREATE TABLE `ms_test_drop` (`id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, `test_name` varchar(200) NOT NULL);"
            return await knex.raw(queryCreate)
        } catch (error) {
            return error
        }
    });

    afterEach(async () => {
        try {
            return await knex.raw("DROP TABLE ms_test_drop")
        } catch (error) {
            return error
        }
    });

    test('drop table --', async () => {
        const body = {
            "table": "ms_test_drop",
            "column": [
                "id",
                {
                    "type": "expression",
                    "colname": "drop table ms_test_drop --",
                    "value": {
                    }
                }
            ]
        }

        let result = null
        try {
            result = await query.select(body, knex)
        } catch (error) {
            result = 'terjadi kesalahan'
        }
        return await expect(result).toBe('terjadi kesalahan')
    })
})

test('Test prevent xss', () => {
    expect(helper.preventXss("<script>alert('halo');</script>")).toBe("&lt;script&gt;alert('halo');&lt;/script&gt;")
})


afterAll(async (done) => { await knex.destroy(); done(); });