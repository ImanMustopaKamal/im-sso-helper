# SELECT

### SELECT ALL
Table name can use alias (as)
```sh
{
    table: 'table_1'
}
// select * from table_1
# OR
{
    table: 'table_1 as t1',
    column: []
}
// select * from table_1 as t1
```
## SELECT COLUMNS
Colum names can use alias (as)
### SELECT with column name
```sh
{
    table: 'table_1',
    column: [ 'col_1', 'col_2', 'col_3']
}
// select col_1, col_2, col_3 from table_1
```
### SELECT with expression or raw or query
```sh
# 
{
    table: 'ms_test',
    column: [ 
        'col_1 ', 'col_2 as c2'
        {
            type: "expression", 
            colname: "count(1) as :alias:", 
            value: {
                alias: "cnt"
            } 
        }
    ]
}
// select `col1`, `col2` as `c2`, count(1) as `cnt` from `ms_test`

# With select query inside columns

{
    table: 'ms_test as t',
    column: [ 
        'col_1 ', 'col_2 as c2'
        {
            type: "expression", 
            colname: "(select count(t_child.id) from ms_test_child as t_child where t_child.test_id = t.id) as c_child", 
            value: {} # this 'value' key is must an object 
        }
    ]
}
// select `col1`, `col2` as `c2`, (select count(t_child.id) from ms_test_child as t_child where t_child.test_id = t.id) as `c_child` from `ms_test`
```
## SELECT 
Select data filtered with where
Operator (op) list values:
- "eq": equal (=)
- "neq": not equal (!=)
- "lte": less than equals (<=)
- "gte": greater than equals (>=)
- "lt": less than (<)
- "gt": greater than (>)
- "like": like (like)
### Select where AND
```sh
{
    table: "ms_test",
    filter: {
        type: "and", # only 'and'/'or'
        fields: [
            {
                name: "id",
                value: 0,
                op: "gte"
            },
            {
                name: "id",
                value: 50,
                op: "lte"
            },
            {
                name: "name",
                value: "%a%",
                op: "like"
            }
        ]
    }
}
// select * from `ms_test` where `id` >= 0 and `id` <= 50 and `name` like '%a%'
```
### Select where OR
```sh
{
    table: "ms_test",
    filter: {
        type: "or", # only 'and'/'or'
        fields: [
            {
                name: "id",
                value: 3,
                op: "gte"
            },
            {
                name: "name",
                value: "%a%",
                op: "like"
            }
        ]
    }
}
// select * from `ms_test` where `id` >= 3 or `name` like '%a%'
```
### Select where OR & AND together
```sh
{
    table: "ms_test",
    filter: {
        type: "or", # only 'and'/'or'
        fields: [
            {
                name: "id",
                value: 3,
                op: "gte"
            },
            {
                name: "name",
                value: "%a%",
                op: "like"
            },
            {
                type: "and", # only 'and'/'or'
                fields: [
                    {
                        name: "name",
                        value: "%i%",
                        op: "like"
                    },
                    {
                        name: "description",
                        op: "eq",
                        value: null
                    },
                ]
            }
        ]
    }
}
// select * from `ms_test` where `id` >= 3 or `name` like '%a%' and `name` like '%i%' and `description` is null
```
## SELECT with LIMIT and OFFSET
```sh
{
    table: "ms_test",
    limit: 2,
    offset: 1
}
// select * from `ms_test` limit 2 offset 1
```
## SELECT with ORDER BY
```sh
{
    table: "ms_test as t",
    order: [
        {
            name: 't.id',
            type: 'desc'
        },
        {
            name: 't.name',
            type: 'asc'
        }
    ]
}
// select * from `ms_test` as `t` order by `t`.`id` desc, `t`.`name` asc
```
## SELECT with GROUP BY
```sh
{
    table: "ms_test as t",
    group: [
        "t.name"
    ]
}
// select * from `ms_test` as `t` group by `t`.`name`
```
## SELECT JOIN
You can combine with other SELECT feature above like filter/where, group by, order by, etc.
Join type list values:
- "inner"
- "left"
- "right"
- "raw"
```sh
{
    table: "ms_test",
    column: [
        "ms_test.*",
        "status.name as status"
    ],
    join: [
        {
            name: "lt_test_status as status",
            type: "inner", 
            constraint:[
                {
                    source: "ms_test.test_status_id",
                    dest:"status.id",
                    op: "eq"   # same as filter/where
                }
            ]
        }
    ],
    filter: {
        type: "and",
        fields: [
            name: "status.id",
            op: "neq",
            value: 0
        ]
    }
}
// select ms_test.*, status.name as status from `ms_test` inner join `lt_test_status` as `status` on (`ms_test`.`test_status_id` = `status`.`id`) where status.id != 0

# join with raw
{
    table: "ms_test",
    column
    join: [
        {
            name: "lt_test_status as status",
            type: "right", 
            kind:"table", 
            constraint:[
                {
                    source:"ms_test.test_status_id",
                    dest:"status.id",
                    op: "eq"
                }
            ]
        },
        {
            name: "(select @param_1:='sCbN2YFt' param_1, @param_2:='5GuTVLI7' param_2, @param_3='87DBOiFN' param_3 ) as parm",
            type: "raw",
            constraint:[
            ]
        }
    ]
}
// select * from `ms_test` right join `lt_test_status` as `status` on (`ms_test`.`test_status_id` = `status`.`id`) (select @param_1:='sCbN2YFt' param_1, @param_2:='5GuTVLI7' param_2, @param_3='87DBOiFN' param_3 ) as parm
```
## INSERT
Can insert raw like now(), etc.
column_values is array, posible to insert multiple values in one table
### INSERT on single table
```sh
{
    table: "ms_test",
    column_values: [
        {
            created_at: {
                raw: "now()"
            },
            name: "terserah",
            description: "warga +62"
        },
        {
            created_at: {
                raw: "now()"
            },
            name: {
                raw: "concat('terserah2', 'CAT')"
            },
            description: "warga terserah"
        }
    ]
}
// insert into `ms_test` (`created_at`, `description`, `name`) values (now(), 'warga +62', 'terserah'), (now(), 'warga terserah', concat('terserah2', 'CAT'))
```
### INSERT on multiple table
You can insert data on multiple table in one transactional query with payload below.
queries is array of object, the value for same like single insert above
```sh
{
    type: "multiple"
    queries: [
        {
            table: "ms_test",
            column_values: [
                {
                    field_1: "value 1",
                    field_2: "value 2",
                    description: "warga +62"
                }
            ]
        },
        {
            table: "ms_test_children",
            column_values: [
                {
                    field_1: "value 1",
                    field_2: "value 2",
                    description: "warga +62"
                }
            ]
        }
    ]
}]
```
## UPDATE
Same like insert, you can edit value of fields with raw like now(), etc.
But the value of column_value to update data is not array but object, the key name is also different.
You can use filter or where like select to, if not use filter, all data in the table will updated
### UPDATE on single table
```sh
{
    table: "ms_test",
    column_value: {
        created_at: {
            raw: "now()"
        },
        name: "naruto uzumaki",
        description: "warga konoha"
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
// update `ms_test` set `created_at` = now(), `name` = 'naruto uzumaki', `description` = 'warga konoha' where `id` = 25
```
### UPDATE on multiple table
You can update data on multiple table in one transactional query with payload below.
queries is array of object, the value for same like single update above
```sh
{
    type: "multiple"
    queries: [
        {
            table: "ms_test",
            column_value: {
                created_at: {
                    raw: "now()"
                },
                name: "naruto uzumaki",
                description: "warga konoha"
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
        {
            table: "ms_test_children",
            column_value: {
                created_at: {
                    raw: "now()"
                },
                name: "naruto uzumaki",
                description: "warga konoha"
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
    ]
}]
```
## DELETE
You can use filter or where like select and upder to, if not use filter, all data in the table will deleted.
You also can delete data on multiple table, it's similiar with UPDATE but the key queries value use object below
```sh
{
    table: "ms_test",
    filter: {
        type: "and",
        fields: [
            { 
                name: "id", 
                value: 3, 
                op: "eq"
            }
        ]
    }
}
// delete from `ms_test` where `id` = 3
```


