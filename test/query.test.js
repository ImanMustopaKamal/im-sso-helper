const query = require('../controllers/query')
const { config } = require('./utils/app-path')
const db = require('../utils/db')
const knex = db(config())

jest.setTimeout(50000)

test('Test select all from table', () => {
    const body = {
            "table": "ms_test",
            "column": [
                
            ]
    }
    expect(query.select(body, knex).toQuery()).toBe('select * from `ms_test`')
})

test('Test select column from table', () => {
    const body = {
            "table": "ms_test",
            "column": [
                "col1", "col2 as c2",
                {
                    "type": "expression", 
                    "colname": "count(1) as :alias:", 
                    "value": {
                        "alias": "cnt"
                    } 
                }
            ]
        }
    expect(query.select(body, knex).toQuery()).toBe('select `col1`, `col2` as `c2`, count(1) as `cnt` from `ms_test`')
})

test('Test select where', () => {
    const body = {
            "table": "ms_test",
            "filter": {
                "type": "and",
                "fields": [
                  {
                      "name": "id",
                      "value": 0,
                      "op": "gte"
                  }
                ]
          }
        }
    expect(query.select(body, knex).toQuery()).toBe('select * from `ms_test` where `id` >= 0')
})

test('Test select where and', () => {
    const body = {
            "table": "ms_test",
            "filter": {
                "type": "and",
                "fields": [
                  {
                      "name": "id",
                      "value": 0,
                      "op": "gte"
                  },
                  {
                    "name": "id",
                    "value": 25,
                    "op": "lte"
                    }
                ]
          }
        }
    expect(query.select(body, knex).toQuery()).toBe('select * from `ms_test` where `id` >= 0 and `id` <= 25')
})

test('Test select where or', () => {
    const body = {
            "table": "ms_test",
            "filter": {
                "type": "or",
                "fields": [
                  {
                      "name": "id",
                      "value": 0,
                      "op": "gte"
                  },
                  {
                    "name": "id",
                    "value": 25,
                    "op": "lte"
                    }
                ]
          }
        }
    expect(query.select(body, knex).toQuery()).toBe('select * from `ms_test` where `id` >= 0 or `id` <= 25')
})

test('Test select where with nested object, knex reqursion', () => {
    const body = {
            "table": "ms_test",
            "filter": {
                "type": "or",
                "fields": [
                  {
                      "name": "id",
                      "value": 0,
                      "op": "gte"
                  },
                  {
                    "name": "id",
                    "value": 25,
                    "op": "lte"
                  },
                  {
                    "type": "and",
                    "fields": [
                        {
                            "name": "status",
                            "op": "eq",
                            "value": "A"
                        },
                        {
                            "name": "name",
                            "op": "like",
                            "value": "%w%"
                        }
                    ]
                  }
                ]
          }
        }
    expect(query.select(body, knex).toQuery()).toBe("select * from `ms_test` where `id` >= 0 or `id` <= 25 and `status` = 'A' and `name` like '%w%'")
})

test('Test select where with nested object, knex reqursion, with is null', () => {
    const body = {
            "table": "ms_test",
            "filter": {
                "type": "and",
                "fields": [
                  {
                      "name": "id",
                      "value": 0,
                      "op": "gte"
                  },
                  {
                    "name": "name",
                    "value": "%a%",
                    "op": "like"
                  },
                  {
                    "type": "or",
                    "fields": [
                        {
                            "name": "description",
                            "op": "eq",
                            "value": null
                        },
                        {
                            "name": "title",
                            "op": "eq",
                            "value": null
                        }
                    ]
                  },
                  {
                      "name": "status",
                      "op": "eq",
                      "value": "A"
                  }
                ]
          }
        }
    expect(query.select(body, knex).toQuery()).toBe("select * from `ms_test` where `id` >= 0 and `name` like '%a%' or `description` is null or `title` is null and `status` = 'A'")
})

test('Test select where with nested object, knex reqursion, with is null', () => {
    const body = {
            "table": "ms_test",
            "filter": {
                "type": "or",
                "fields": [
                  {
                      "name": "id",
                      "value": 0,
                      "op": "gte"
                  },
                  {
                    "name": "description",
                    "op": "eq",
                    "value": null
                  },
                  {
                    "type": "and",
                    "fields": [
                        {
                            "name": "title",
                            "op": "eq",
                            "value": null
                        }
                    ]
                  },
                ]
          }
        }
    expect(query.select(body, knex).toQuery()).toBe("select * from `ms_test` where `id` >= 0 or `description` is null and `title` is null")
})

test('Test select order by', () => {
    const body = {
            "table": "ms_test",
            "order": [
                {"name": "description", "type": "desc"},
                {"name": "name", "type": "asc"}
            ],
        }
    expect(query.select(body, knex).toQuery()).toBe('select * from `ms_test` order by `description` desc, `name` asc')
})

test('Test select group by, limit, and offset', () => {
    const req = {
        body: {
            "table": "ms_test",
            "group": ["name", "description"],
            "limit": 10,
            "offset": 1
        }
    }
    expect(query.select(req.body, knex).toQuery()).toBe('select * from `ms_test` group by `name`, `description` limit 10 offset 1')
})

test('Test inner join', () => {
    const req = {
        body: {
            "table": "ms_test",
            "join": [
                {
                    "name": "lt_test_status as status",
                    "type": "inner", 
                    "kind":"table", 
                    "constraint":[
                        {
                            "source":"ms_test.test_status_id",
                            "dest":"status.id",
                            "op": "eq"
                        }
                    ]
                }
            ]
        }
    }
    expect(query.select(req.body, knex).toQuery()).toBe('select * from `ms_test` inner join `lt_test_status` as `status` on (`ms_test`.`test_status_id` = `status`.`id`)')
})

test('Test left join with column', () => {
    const req = {
        body: {
            "table": "ms_test",
            "column": [
                "ms_test.id as id",
                "ms_test.name as name",
                "status.name as status"
            ],
            "join": [
                {
                    "name": "lt_test_status as status",
                    "type": "left", 
                    "kind":"table", 
                    "constraint":[
                        {
                            "source":"ms_test.test_status_id",
                            "dest":"status.id",
                            "op": "eq"
                        }
                    ]
                }
            ]
        }
    }
    expect(query.select(req.body, knex).toQuery()).toBe('select `ms_test`.`id` as `id`, `ms_test`.`name` as `name`, `status`.`name` as `status` from `ms_test` left join `lt_test_status` as `status` on (`ms_test`.`test_status_id` = `status`.`id`)')
})

test('Test right join', () => {
    const req = {
        body: {
            "table": "ms_test",
            "join": [
                {
                    "name": "lt_test_status as status",
                    "type": "right", 
                    "kind":"table", 
                    "constraint":[
                        {
                            "source":"ms_test.test_status_id",
                            "dest":"status.id",
                            "op": "eq"
                        }
                    ]
                }
            ]
        }
    }
    expect(query.select(req.body, knex).toQuery()).toBe('select * from `ms_test` right join `lt_test_status` as `status` on (`ms_test`.`test_status_id` = `status`.`id`)')
})

test('Test right join with raw', () => {
    const req = {
        body: {
            "table": "ms_test",
            "join": [
                {
                    "name": "lt_test_status as status",
                    "type": "right", 
                    "kind":"table", 
                    "constraint":[
                        {
                            "source":"ms_test.test_status_id",
                            "dest":"status.id",
                            "op": "eq"
                        }
                    ]
                },
                {
                    "name": "(select @param_1:='sCbN2YFt' param_1, @param_2:='5GuTVLI7' param_2, @param_3='87DBOiFN' param_3 ) as parm",
                    "type": "raw",
                    "constraint":[
                      
                    ]
                }
            ]
        }
    }
    expect(query.select(req.body, knex).toQuery()).toBe("select * from `ms_test` right join `lt_test_status` as `status` on (`ms_test`.`test_status_id` = `status`.`id`) (select @param_1:='sCbN2YFt' param_1, @param_2:='5GuTVLI7' param_2, @param_3='87DBOiFN' param_3 ) as parm")
})

test('Test insert into', () => {
    const req = {
        body: {
            "table": "ms_test",
            "column_values": [
                {
                    "created_at": {
                        "raw": "now()"
                    },
                    "name": "terserah",
                    "description": "warga +62"
                },
                {
                    "created_at": {
                        "raw": "now()"
                    },
                    "name": {
                        "raw": "concat('terserah2', 'CAT')"

                        },
                    "description": "warga terserah"
                }
            ]
        }
    }

    expect(query.insert(req.body.column_values, knex(req.body.table)).sql.toQuery()).toBe("insert into `ms_test` (`created_at`, `description`, `name`) values (now(), 'warga +62', 'terserah'), (now(), 'warga terserah', concat('terserah2', 'CAT'))")
})

test('Test insert into onConflict columns single string', () => {
    const req = {
        body: {
            "table": "ms_test",
            "column_values": [
                {
                    "name": "terserah",
                    "description": "warga +62"
                }
            ],
            on_conflict: {
                columns: 'name'
            }
        }
    }
    // const expectQuery = "insert into `ms_test` (`description`, `name`) values ('warga +62', 'terserah') on duplicate key update `name` = values(`name`), `description` = values(`description`)"
    const expectQuery = "insert into `ms_test` (`description`, `name`) values ('warga +62', 'terserah') on duplicate key update `description` = values(`description`), `name` = values(`name`)"
    expect(query.insert(req.body.column_values, knex(req.body.table), '', '', req.body.on_conflict).sql.toQuery()).toBe(expectQuery)
})

test('Test insert into onConflict columns single string merge object', () => {
    const req = {
        body: {
            "table": "ms_test",
            "column_values": [
                {
                    "name": "terserah",
                    "description": "warga +62"
                }
            ],
            on_conflict: {
                columns: 'name',
                merge: {
                    name: "John Doe"
                }
            }
        }
    }
    // const expectQuery = "insert into `ms_test` (`description`, `name`) values ('warga +62', 'terserah') on duplicate key update `name` = values(`name`), `description` = values(`description`)"
    const expectQuery = "insert into `ms_test` (`description`, `name`) values ('warga +62', 'terserah') on duplicate key update `name` = 'John Doe'"
    expect(query.insert(req.body.column_values, knex(req.body.table), '', '', req.body.on_conflict).sql.toQuery()).toBe(expectQuery)
})

test('Test insert into onConflict columns array string with merge object but ignore true', () => {
    const req = {
        body: {
            "table": "ms_test",
            "column_values": [
                {
                    "name": "terserah",
                    "description": "warga +62"
                }
            ],
            on_conflict: {
                columns: ['name'],
                merge: {
                    name: "John Doe"
                },
                ignore: true
            }
        }
    }
    // const expectQuery = "insert into `ms_test` (`description`, `name`) values ('warga +62', 'terserah') on duplicate key update `name` = values(`name`), `description` = values(`description`)"
    const expectQuery = "insert ignore into `ms_test` (`description`, `name`) values ('warga +62', 'terserah')"
    expect(query.insert(req.body.column_values, knex(req.body.table), '', '', req.body.on_conflict).sql.toQuery()).toBe(expectQuery)
})

test('Test update with filter query', () => {
    const req = {
        body: {
            "table": "ms_test",
            "column_value": {
                "created_at": {
                    "raw": "now()"
                },
                "name": "naruto uzumaki",
                "description": "warga konoha"
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

    expect(query.update(req.body, knex(req.body.table)).toQuery()).toBe("update `ms_test` set `created_at` = now(), `name` = 'naruto uzumaki', `description` = 'warga konoha' where `id` = 25")
})

test('Test update all query', () => {
    const req = {
        body: {
            "table": "ms_test",
            "column_value": {
                "created_at": {
                    "raw": "now()"
                },
                "name": "naruto uzumaki",
                "description": "warga konoha"
            }
        }
    }

    expect(query.update(req.body, knex(req.body.table)).toQuery()).toBe("update `ms_test` set `created_at` = now(), `name` = 'naruto uzumaki', `description` = 'warga konoha'")
})



test('Test delete with filter query', () => {
    const req = {
        body: {
            "table": "ms_test",
             "filter": {
                  "type": "and",
                  "fields": [
                        { "name": "id", "value": 3, "op": "eq"}
                  ]
            }
        }
    }

    expect(query.delete(req.body.filter, knex(req.body.table)).toQuery()).toBe("delete from `ms_test` where `id` = 3")
})

test('Test delete all query', () => {
    const req = {
        body: {
            "table": "ms_test"
        }
    }

    expect(query.delete(req.body.filter, knex(req.body.table)).toQuery()).toBe("delete from `ms_test`")
})

test('Test join raw', () => {
    const req = {
        body: {
            table: 'ms_risk_template as rt',
        column: [
            'rt.name as name',
            {
                type: 'expression',
                colname: 'group_concat(:col:) as :as:',
                value: {
                    col: 'bsu.name',
                    as: 'bSubunits'
                }
            },
            {
                type: 'expression',
                colname: 'group_concat(:col:) as :as:',
                value: {
                    col: 'bsu.name',
                    as: 'bUnits'
                }
            },
            {
                type: 'expression',
                colname: 'group_concat(:col:) as :as:',
                value: {
                    col: 'ri.name',
                    as: 'issues'
                }
            }
        ],
        offset: 0,
        limit: 10,
        filter: {
            type: 'and',
            fields: [{
                name: 'rtm.status',
                op: 'eq',
                value: 'A'
            }]
        },
        join: [
            {
                name: 'ms_risk_template_map as rtm',
                type: 'left',
                kind: 'table',
                constraint: [
                    {
                        source: 'rt.id',
                        dest: 'rtm.risk_template_id',
                        op: 'eq'
                    }
                ]
            },
            {
                name: 'ms_risk_issue as ri',
                type: 'inner',
                kind: 'table',
                constraint: [
                    {
                        source: 'ri.id',
                        dest: 'rtm.risk_issue_id',
                        op: 'eq'
                    }
                ]
            },
            {
                name: 'ms_business_subunit as bsu',
                type: 'inner',
                kind: 'table',
                constraint: [
                    {
                        source: 'bsu.id',
                        dest: 'rt.business_subunit_id',
                        op: 'eq'
                    }
                ]
            },
            {
                name: 'ms_business_unit as bu',
                type: 'inner',
                kind: 'table',
                constraint: [
                    {
                        source: 'bu.id',
                        dest: 'bsu.business_unit_id',
                        op: 'eq'
                    }
                ]
            },
            
        ],
        order: [
            {
                name: 'rt.last_modify_date',
                type: 'desc'
            },
            {
                name: 'rt.id',
                type: 'asc'
            }
        ],
        group: ['rt.id']
        }
    }

    expect(query.select(req.body, knex).toQuery()).toBe("select `rt`.`name` as `name`, group_concat(`bsu`.`name`) as `bSubunits`, group_concat(`bsu`.`name`) as `bUnits`, group_concat(`ri`.`name`) as `issues` from `ms_risk_template` as `rt` left join `ms_risk_template_map` as `rtm` on (`rt`.`id` = `rtm`.`risk_template_id`) inner join `ms_risk_issue` as `ri` on (`ri`.`id` = `rtm`.`risk_issue_id`) inner join `ms_business_subunit` as `bsu` on (`bsu`.`id` = `rt`.`business_subunit_id`) inner join `ms_business_unit` as `bu` on (`bu`.`id` = `bsu`.`business_unit_id`) where `rtm`.`status` = 'A' group by `rt`.`id` order by `rt`.`last_modify_date` desc, `rt`.`id` asc limit 10")
})

afterAll( async (done) => { await knex.destroy(); done(); });