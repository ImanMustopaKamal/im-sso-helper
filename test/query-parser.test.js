const query = require('../controllers/query')
const {config} = require('./utils/app-path')
const db = require('../utils/db')
const helper = require('../utils/helper')
const knex = db(config())

jest.setTimeout(50000)

describe('Testing Data', () => {
    beforeEach(async () => {
        try {
            let queryCreate = "CREATE TABLE `ms_test_parser` (`id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, `test_name` varchar(200) NOT NULL);"
            let queryCreate2 = "CREATE TABLE `ms_test_parser_child` (`id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, `test_id` int(11) NOT NULL ,`test_name_child` varchar(200) NOT NULL);"
            await knex.raw(queryCreate)
            await knex.raw("INSERT INTO `ms_test_parser` (`test_name`) VALUES ('test nama 1');")
            await knex.raw("INSERT INTO `ms_test_parser` (`test_name`) VALUES ('test nama 2');")
            await knex.raw("INSERT INTO `ms_test_parser` (`test_name`) VALUES ('test nama 3');")
            
            await knex.raw(queryCreate2)
            await knex.raw("INSERT INTO `ms_test_parser_child` (`test_id`, `test_name_child`) VALUES (1, 'test nama child 1');")
            return await knex.raw("INSERT INTO `ms_test_parser_child` (`test_id`, `test_name_child`) VALUES (1, 'test nama child 2');")
        } catch (error) {
            return error
        }
    });

    afterEach(async () => {
        try {
            await knex.raw("DROP TABLE ms_test_parser")
            return await knex.raw("DROP TABLE ms_test_parser_child")
        } catch (error) {
            return error
        }
    });

    // SELECT
    test('Select All', () => {
        const req = {
            body: {
                table: "ms_test_parser"
            }
        }

        expect(query.select(req.body, knex).toQuery()).toBe("select * from `ms_test_parser`")
    })

    test('Select With Column', () => {
        const req = {
            body: {
                table: "ms_test_parser",
                column: ["test_name"]
            }
        }

        expect(query.select(req.body, knex).toQuery()).toBe("select `test_name` from `ms_test_parser`")
    })

    test('Select Column With Expression', () => {
        const req = {
            body: {
                table: "ms_test_parser",
                column: [
                    "ms_test_parser.*",
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
                        "name": "ms_test_parser_child as test_child",
                        "type": "left",
                        "kind": "table",
                        "constraint": [
                            {
                                "source": "test_child.test_id",
                                "dest": "ms_test_parser.id",
                                "op": "eq"
                            }
                        ]
                    },
                ],
                group: [
                    "ms_test_parser.id"
                ]
            }
        }

        expect(query.select(req.body, knex).toQuery()).toBe("select `ms_test_parser`.*, count(`test_child`.`test_id`) as `childs_test` from `ms_test_parser` left join `ms_test_parser_child` as `test_child` on (`test_child`.`test_id` = `ms_test_parser`.`id`) group by `ms_test_parser`.`id`")
    })

    test('Select With Condition', () => {
        const filterFieds = []
        filterFieds.push({
            name: "ms_test_parser.test_name",
            value: "test nama 1",
            op: "eq"
        })

        const req = {
            body: {
                table: "ms_test_parser",
                filter: {
                    type: "and",
                    fields: filterFieds
                }
            }
        }

        expect(query.select(req.body, knex).toQuery()).toBe("select * from `ms_test_parser` where `ms_test_parser`.`test_name` = 'test nama 1'")
    })

    test('Select With Multiple Condition', () => {
        const filterFieds = []
        filterFieds.push({
            name: "ms_test_parser.test_name",
            value: "test nama 1",
            op: "eq"
        })
        filterFieds.push({
            name: "ms_test_parser.id",
            value: "1",
            op: "eq"
        })

        const req = {
            body: {
                table: "ms_test_parser",
                filter: {
                    type: "and",
                    fields: filterFieds
                }
            }
        }

        expect(query.select(req.body, knex).toQuery()).toBe("select * from `ms_test_parser` where `ms_test_parser`.`test_name` = 'test nama 1' and `ms_test_parser`.`id` = '1'")
    })

    test('Select With OrderBy', () => {
        const req = {
            body: {
                table: "ms_test_parser",
                order: [
                    {
                        name: 'ms_test_parser.id',
                        type: 'desc'
                    }
                ]
            }
        }

        expect(query.select(req.body, knex).toQuery()).toBe("select * from `ms_test_parser` order by `ms_test_parser`.`id` desc")
    })

    test('Select With Limit and Offset', () => {
        const req = {
            body: {
                table: "ms_test_parser",
                limit: 2,
                offset: 0
            }
        }

        expect(query.select(req.body, knex).toQuery()).toBe("select * from `ms_test_parser` limit 2")
    })

    test('Select Join', () => {
        const req = {
            body: {
                table: "ms_test_parser",
                column: ["ms_test_parser.*"],
                join: [
                    {
                        "name": "ms_test_parser_child as test_child",
                        "type": "left",
                        "kind": "table",
                        "constraint": [
                            {
                                "source": "test_child.test_id",
                                "dest": "ms_test_parser.id",
                                "op": "eq"
                            }
                        ]
                    },
                ]
            }
        }

        expect(query.select(req.body, knex).toQuery()).toBe("select `ms_test_parser`.* from `ms_test_parser` left join `ms_test_parser_child` as `test_child` on (`test_child`.`test_id` = `ms_test_parser`.`id`)")
    })

    // COUNT
    test('Count Normal', () => {
        const req = {
            body: {
                table: "ms_test_parser",
                column: ["* as cnt"],
                filter:{
                    type: "or",
                    fields: [
                        {
                            name: "test_name",
                            value: "%3%",
                            op: "like"
                        }
                    ]
                }
            }
        }

        expect(query.count(req.body, knex).toQuery()).toBe("select count(* as `cnt`) where `test_name` like '%3%'")
    })

    test('Count With Expression', () => {
        const req = {
            body: {
                table: "ms_test_parser",
                column: [
                    "ms_test_parser.* as cnt",
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
                        "name": "ms_test_parser_child as test_child",
                        "type": "left",
                        "kind": "table",
                        "constraint": [
                            {
                                "source": "test_child.test_id",
                                "dest": "ms_test_parser.id",
                                "op": "eq"
                            }
                        ]
                    },
                ],
                group: [
                    "ms_test_parser.id"
                ]
            }
        }

        expect(query.count(req.body, knex).toQuery()).toBe("select count(`ms_test_parser`.* as `cnt`, `expression` as `type`, `count(:col:)` as `:alias:` as `colname`, `test_child`.`test_id` as `col`, `childs_test` as `alias` as `value`) left join `ms_test_parser_child` as `test_child` on (`test_child`.`test_id` = `ms_test_parser`.`id`) group by `ms_test_parser`.`id`")
    })

    test('Count Mixed With Normal Select', () => {
        const req = {
            body: {
                table: "ms_test_parser",
                column: [
                    "ms_test_parser.* as cnt"
                ]
            }
        }

        expect(query.count(req.body, knex).toQuery()).toBe("select count(`ms_test_parser`.* as `cnt`)")
        expect(query.select(req.body, knex).toQuery()).toBe("select `ms_test_parser`.* as `cnt` from `ms_test_parser`")
    })

    // INSERT
    test('Insert Normal', () => {
        const req = {
            body: {
                "table": "ms_test_parser",
                "column_values": [
                    {
                        "test_name": "manos",
                    },
                    {
                        "test_name": "manos 2",
                    },
                ]
            }
        }

        expect(query.insert(req.body.column_values, knex(req.body.table)).sql.toQuery()).toBe("insert into `ms_test_parser` (`test_name`) values ('manos'), ('manos 2')")
    })

    test('Insert With Raw', () => {
        const req = {
            body: {
                "table": "ms_test_parser",
                "column_values": [
                    {
                        "test_name": "manos",
                    },
                    {
                        "test_name": {
                            "raw": "concat('manos 2', 'CAT')"
                        }
                    },
                ]
            }
        }

        expect(query.insert(req.body.column_values, knex(req.body.table)).sql.toQuery()).toBe("insert into `ms_test_parser` (`test_name`) values ('manos'), (concat('manos 2', 'CAT'))")
    })
    
    // UPDATE
    test('Update All', () => {
        const req = {
            body: {
                "table": "ms_test_parser",
                "column_value": {
                    "test_name": "manos"
                }
            }
        }
    
        expect(query.update(req.body, knex(req.body.table)).toQuery()).toBe("update `ms_test_parser` set `test_name` = 'manos'")
    })

    test('Update With Filter', () => {
        const req = {
            body: {
                "table": "ms_test_parser",
                "column_value": {
                    "test_name": "manos"
                },
                "filter": {
                    "type": "or",
                    "fields": [
                        {
                            "name": "id",
                            "value": 25,
                            "op": "eq"
                        }
                    ]
                }
            }
        }
    
        expect(query.update(req.body, knex(req.body.table)).toQuery()).toBe("update `ms_test_parser` set `test_name` = 'manos' where `id` = 25")
    })

    // DELETE
    test('Delete All', () => {
        const req = {
            body: {
                "table": "ms_test_parser"
            }
        }
    
        expect(query.delete(req.body, knex(req.body.table)).toQuery()).toBe("delete from `ms_test_parser`")
    })

    test('Delete With Filter', () => {
        const req = {
            body: {
                table: "ms_test_parser",
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
        }
    
        expect(query.delete(req.body.filter, knex(req.body.table)).toQuery()).toBe("delete from `ms_test_parser` where `id` = 25")
    })
})

describe('testing inject drop', () => {
    beforeEach(async () => {
        try {
            let queryCreate = "CREATE TABLE `ms_test_parser_drop` (`id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY, `test_name` varchar(200) NOT NULL);"
            return await knex.raw(queryCreate)
        } catch (error) {
            return error
        }
    });

    afterEach(async () => {
        try {
            return await knex.raw("DROP TABLE ms_test_parser_drop")
        } catch (error) {
            return error
        }
    });

    test('drop table --', async () => {
        const body = {
                "table": "ms_test_parser_drop",
                "column": [
                    "id",
                    {
                        "type": "expression", 
                        "colname": "drop table ms_test_parser_drop --", 
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


afterAll( async (done) => { await knex.destroy(); done(); });