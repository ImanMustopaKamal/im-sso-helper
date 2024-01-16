const helper = require('../utils/helper')
const db = require('../utils/db')
const { config } = require('../utils/app-path')
const { generatePrefixId } = require('../utils/helper')
const knex = db(config())

exports.select = select
function select(body, sql) {
    sql = parseColumn(body.column, sql)
    sql = parseFilter(body.filter, sql)
    sql = parseOffset(body.offset, sql)
    sql = parseLimit(body.limit, sql)
    sql = parseOrder(body.order, sql)
    sql = parseGroup(body.group, sql)
    sql = parseJoin(body.join, sql)
    sql = sql.select().from(body.table)

    return sql
}
exports.count = (body, sql) => {
    sql = parseFilter(body.filter, sql)
    sql = parseJoin(body.join, sql)
    sql = parseGroup(body.group, sql)

    return sql.count(body.column)
}

exports.getLastItemWithPrefixId = (table, prefix, sql) => {
    const payload = {
        table: table,
        column: ['id'],
        filter: {
            type: 'and',
            fields: [
                {
                    name: 'id',
                    value: `${prefix}%`,
                    op: 'like'
                }
            ]
        },
        offset: 0,
        limit: 1,
        order: [{
            name: 'id',
            type: 'desc'
        }]
    }
    sql = select(payload, sql)
    return sql
}

exports.insert = (column, sql, prefix, lastID, onConflict) => {
    const inserts = []
    const ids = []
    if (prefix && prefix.length > 1 && prefix.length < 6) {
        for (let i = 0; i < column.length; i++) {
            let param = column[i]
            param.id = generatePrefixId(prefix, lastID, i)
            Object.keys(param).forEach((key) => {
                const col_type = typeof param[key]
                if (col_type == 'object') {
                    param[key] = knex.raw(helper.preventXss(param[key].raw))
                } else if (col_type == 'string') {
                    param[key] = helper.preventXss(param[key])
                }
                if (key === 'id') {
                    ids.push(param[key])
                }
            })
            inserts.push(param)   
        }
    } else {
        column.forEach((col, i) => {
            let param = col
            Object.keys(col).forEach((key) => {
                const col_type = typeof col[key]
                if(col_type == 'object'){
                    param[key] = knex.raw(helper.preventXss(col[key].raw))
                } else if (col_type == 'string') {
                    param[key] = helper.preventXss(col[key])
                }
                if (key === 'id') {
                    ids.push(param[key])
                }
            })
            inserts.push(param)
        })
    }
    
    if (onConflict && onConflict.columns) {
        if (onConflict.ignore) {
            sql = sql.insert(inserts).onConflict(onConflict.columns).ignore()
        } else if (onConflict.merge && (typeof onConflict.merge == 'object' || Array.isArray(onConflict.merge))) {
            sql = sql.insert(inserts).onConflict(onConflict.columns).merge(onConflict.merge)
        } else {
            sql = sql.insert(inserts).onConflict(onConflict.columns).merge()
        }
    } else {
        sql = sql.insert(inserts)
    }
    return {
        sql: sql,
        ids: ids
    }
}

exports.update = (body, sql) => {
    const table = body.table
    const column = body.column_value
    const filter = body.filter

    if(filter){
        sql = parseFilter(filter, sql)
    }

    let dataColumn = column
    Object.keys(column).forEach((key) => {
        const col_type = typeof column[key]

        if(col_type == 'object'){
            dataColumn[key] = knex.raw(helper.preventXss(column[key].raw))
        } else if (col_type == 'string') {
            dataColumn[key] = helper.preventXss(column[key])
        }
    })

    return sql.update(dataColumn)
}

exports.delete = (filter, sql) => {
    if (filter) {
        sql = parseFilter(filter, sql)
    }

    return sql.del()
}

function parseColumn(column, sql) {
    const columns = []

    if (column) {
        column.forEach((col) => {
            typeCol = typeof col
            if(typeCol === "object") {
                if(col.type && col.type.length > 0) {
                    switch (col.type) {
                        case "column":
                            columns.push(col.colname)
                            break
                        case "expression":
                            if(col.colname.length > 0 && (typeof col.value) === "object") {
                                columns.push(knex.raw(col.colname, col.value))
                            }
                            break
                        default:

                            break
                    }
                }
            } else {
                columns.push(col)
            }
        })
    }

    if (columns.length > 0) return sql.column(columns)

    return sql.column("*")
}

function get_sql_op(op, value) {
    if (op == "eq") {
        if (value != null) {
            return "="
        } else {
            return "is"
        }
    }
    if (op == "neq") {
        if (value != null) {
            return "!="
        } else {
            return "is not"
        }
    }
    if (op == "gt") {
        return ">"
    }
    if (op == "gte") {
        return ">="
    }
    if (op == "lt") {
        return "<"
    }
    if (op == "lte") {
        return "<="
    }
    if (op == "like") {
        return "like"
    }
    return "undefined"
}

function parseFilter(filter, sql, isMain = true) {
    if (filter) {
        if (filter.fields) {
            const fields = filter.fields
            let fieldsNotMain = []
            fields.forEach((field, i) => {
                if (field.type) {
                    sql = parseFilter(field, sql, false)
                } else {
                    if (isMain && i == 0) {
                        sql = sql.where(field.name, get_sql_op(field.op, field.value), field.value)
                    } else {
                        if (isMain) {
                            if (filter.type == 'and') {
                                sql = sql.andWhere(field.name, get_sql_op(field.op, field.value), field.value)
                            }
                            else if (filter.type == 'or') {
                                sql = sql.orWhere(field.name, get_sql_op(field.op, field.value), field.value)
                            }
                        }
                        else {
                            fieldsNotMain.push(field)
                        }
                    }
                }
            })
            if (fieldsNotMain && fieldsNotMain.length > 0) {
                sql.andWhere(function() {
                    fieldsNotMain.forEach((field, i) => {
                        if (filter.type == 'and') {
                            this.andWhere(field.name, get_sql_op(field.op, field.value), field.value)
                        }
                        else if (filter.type == 'or') {
                            this.orWhere(field.name, get_sql_op(field.op, field.value), field.value)
                        }   
                    })
                })
            }
        }
        if (filter.expression){
            sql = sql.whereRaw(filter.expression)
        }
    }

    return sql
}

function parseOrder(order, sql) {
    const orders = []
    const orderRaws = []
    if (order) {
        order.forEach((ord) => {
            if (ord.type == "expression") {
                orderRaws.push(knex.raw(ord.name))
            }
            else {
                orders.push({
                    column: ord.name,
                    order: ord.type
                })
            }
        })
    }

    if (orders.length > 0 || orderRaws.length > 0) {
        if (orderRaws.length > 0) {
            sql.orderByRaw(orderRaws)
        }
        if (orders.length > 0) {
            sql.orderBy(orders)
        }
    }

    return sql
}

function parseLimit(limit, sql) {
    if (limit) return sql.limit(limit)
    return sql
}

function parseOffset(offset, sql) {
    if (offset) return sql.offset(offset)
    return sql
}

function parseGroup(group, sql) {
    if (group) {
        group.forEach((col) => {
            sql = sql.groupBy(col)
        })
    }
    return sql
}

function parseJoin(join, sql) {
    if (join) {
        join.forEach((obj) => {
            if (obj.type == 'left') {
                sql = sql.leftJoin(obj.name, function() {
                    if (obj.constraint) {
                        this.on(function () {
                            obj.constraint.forEach((objCons, i) => {
                                if (i === 0) {
                                    if (objCons.dest) {
                                        this.on(objCons.source, get_sql_op(objCons.op, "value"), objCons.dest)
                                    } else if (objCons.value) {
                                        this.onVal(objCons.source, get_sql_op(objCons.op, "value"), objCons.value)
                                    }

                                } else {
                                    if (objCons.type == 'and') {
                                        if (objCons.dest) {
                                            this.andOn(objCons.source, get_sql_op(objCons.op, "value"), objCons.dest)
                                        } else if (objCons.value) {
                                            this.andOnVal(objCons.source, get_sql_op(objCons.op, "value"), objCons.value)
                                        }
                                    } else if (objCons.type == 'or') {
                                        if (objCons.dest) {
                                            this.orOn(objCons.source, get_sql_op(objCons.op, "value"), objCons.dest)
                                        } else if (objCons.value) {
                                            this.orOnVal(objCons.source, get_sql_op(objCons.op, "value"), objCons.value)
                                        }
                                    }
                                }
                            })
                        })
                    }
                })
            } else if (obj.type == 'right') {
                sql = sql.rightJoin(obj.name, function() {
                    if (obj.constraint) {
                        this.on(function () {
                            obj.constraint.forEach((objCons, i) => {
                                if (i === 0) {
                                    if (objCons.dest) {
                                        this.on(objCons.source, get_sql_op(objCons.op, "value"), objCons.dest)
                                    } else if (objCons.value) {
                                        this.onVal(objCons.source, get_sql_op(objCons.op, "value"), objCons.value)
                                    }

                                } else {
                                    if (objCons.type == 'and') {
                                        if (objCons.dest) {
                                            this.andOn(objCons.source, get_sql_op(objCons.op, "value"), objCons.dest)
                                        } else if (objCons.value) {
                                            this.andOnVal(objCons.source, get_sql_op(objCons.op, "value"), objCons.value)
                                        }
                                    } else if (objCons.type == 'or') {
                                        if (objCons.dest) {
                                            this.orOn(objCons.source, get_sql_op(objCons.op, "value"), objCons.dest)
                                        } else if (objCons.value) {
                                            this.orOnVal(objCons.source, get_sql_op(objCons.op, "value"), objCons.value)
                                        }
                                    }
                                }
                            })
                        })
                    }
                })
            } else if (obj.type == 'inner') {
                sql = sql.innerJoin(obj.name, function() {
                    if (obj.constraint) {
                        this.on(function () {
                            obj.constraint.forEach((objCons, i) => {
                                if (i === 0) {
                                    if (objCons.dest) {
                                        this.on(objCons.source, get_sql_op(objCons.op, "value"), objCons.dest)
                                    } else if (objCons.value) {
                                        this.onVal(objCons.source, get_sql_op(objCons.op, "value"), objCons.value)
                                    }

                                } else {
                                    if (objCons.type == 'and') {
                                        if (objCons.dest) {
                                            this.andOn(objCons.source, get_sql_op(objCons.op, "value"), objCons.dest)
                                        } else if (objCons.value) {
                                            this.andOnVal(objCons.source, get_sql_op(objCons.op, "value"), objCons.value)
                                        }
                                    } else if (objCons.type == 'or') {
                                        if (objCons.dest) {
                                            this.orOn(objCons.source, get_sql_op(objCons.op, "value"), objCons.dest)
                                        } else if (objCons.value) {
                                            this.orOnVal(objCons.source, get_sql_op(objCons.op, "value"), objCons.value)
                                        }
                                    }
                                }
                            })
                        })
                    }
                })
            } else if (obj.type == 'raw') {
                sql = sql.joinRaw(obj.name)
            }
        })

    }

    return sql
}