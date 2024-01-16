const { config } = require('../utils/app-path')
const db = require('../utils/db')
const query = require('./query')
const knex = db(config())

exports.parseSelect = async (event, context) => {
    try {
        const qSelect = query.select(event, knex)
        const result = await qSelect
        
        return {
            status: 200,
            message: qSelect.toQuery(),
            result: result
        }
    } catch (error) {
        console.error(error)

        return {
            status: 500,
            message: 'Ops... Internal server error, please contact support',
            errorMessage: error.message
        }
    }

}

exports.parseCount = async (event, context) => {
    try {
        const qCount = query.count(event, knex(event.table))
        const result = await qCount 
        
        return {
            status: 200,
            message: qCount.toQuery(),
            result: result
        }
    } catch (error) {
        console.error(error)

        return {
            status: 500,
            message: 'Ops... Internal server error, please contact support',
            errorMessage: error.message
        }
    }
}

exports.parseInsert = async (event, context) => {
    try {
        const results = []
        if (event.type && event.type === 'multiple') {
            const queries = event.queries
            let isError = false
            await knex.transaction(async trx => { 
                for (let i = 0; i < queries.length; i++) {
                    const q = queries[i]
                    let lastID = ''
                    if (q.prefix_id && q.prefix_id.length > 1 && q.prefix_id.length < 6) {
                        const getLastId = await query.getLastItemWithPrefixId(q.table, q.prefix_id, knex)
                        if (getLastId.length > 0) {
                            lastID = getLastId[0].id
                        }
                    }
                    let sql = knex(q.table)
                    const insert = query.insert(q.column_values, sql, q.prefix_id, lastID, q.on_conflict)
                    const execute = await insert.sql.transacting(trx)
                    console.log(execute)
                    results.push({
                        table: q.table,
                        ids: insert.ids
                    })
                }
            })
            return {
                status: 201,
                message: 'Request was successfully processed and returned',
                result: results
            }
        } else {
            const table = event.table
            const column = event.column_values  
            const prefixId = event.prefix_id
            const onConflict = event.on_conflict
            if (column) {   
                await knex.transaction(async trx => { 
                    let lastID = ''
                    if (prefixId && prefixId.length > 1 && prefixId.length < 6) {
                        const getLastId = await query.getLastItemWithPrefixId(table, prefixId, knex)
                        if (getLastId.length > 0) {
                            lastID = getLastId[0].id
                        }
                    }
                    let sql = knex(table)
                    const insert = query.insert(column, sql, prefixId, lastID, onConflict)
                    const execute = await insert.sql.transacting(trx)
                    results.push({
                        table: table,
                        ids: insert.ids
                    })
                })
                return {
                    status: 201,
                    message: 'Request was successfully processed and returned',
                    result: results
                }
            } else {
                return {
                    status: 400,
                    message: 'Missing or invalid parameter column_values',
                }
            }
            
        }
    } catch (error) {
        console.error(error)
        return {
            status: 500,
            message: 'Ops... Internal server error, please contact support',
            errorMessage: error.message
        }
    }
}

exports.parseUpdate = async (event, context) => {
    try {
        if (event.type && event.type === 'multiple') {
            const queries = event.queries
            await knex.transaction(async trx => {
                for (let i = 0; i < queries.length; i++) {
                    const q = queries[i]
                    const sql = knex(q.table)
                    await query.update(q, sql).transacting(trx)
                }
            })
            return {
                status: 200,
                message: 'Request was successfully processed and returned',
            }
        } else {
            const table = event.table
            const body = event
            if (body.column_value) {
                await knex.transaction(async trx => {
                    const sql = knex(table)
                    await query.update(body, sql).transacting(trx)
                })
                return {
                    status: 200,
                    message: 'Request was successfully processed and returned',
                }
            } else {
                return {
                    status: 400,
                    message: 'Missing or invalid parameter column_value',
                }
            }
        }
        
    } catch (error) {
        console.error(error)
        return {
            status: 500,
            message: 'Ops... Internal server error, please contact support',
            errorMessage: error.message
        }
    }
}

exports.parseDelete = async (event, context) => {
    try {
        if (event.type && event.type === 'multiple') {
            const queries = event.queries
            await knex.transaction(async trx => {
                for (let i = 0; i < queries.length; i++) {
                    const q = queries[i]
                    const sql = knex(q.table)
                    await query.delete(q.filter, sql).transacting(trx)
                }
            })
            
            return {
                status: 200,
                message: 'Request was successfully processed and returned',
            }
        } else {
            const table = event.table
            const filter = event.filter
            
            await knex.transaction(async trx => {
                const sql = knex(table)
                await query.delete(filter, sql).transacting(trx)
            })
            return {
                status: 200,
                message: 'Request was successfully processed and returned',
            }
        }
    } catch (error) {
        console.error(error)

        return {
            status: 500,
            message: 'Ops... Internal server error, please contact support',
            errorMessage: error.message
        }
    }
}

exports.raw = async (event, context) => {
    try {
        const result = await knex.raw(event.query, event.values);
        const resultJson = JSON.parse(JSON.stringify(result));
        return {
            status: 200,
            message: 'Request was successfully processed and returned',
            result: resultJson[0]
        }
    } catch (error) {
        console.error(error)

        return {
            status: 500,
            message: 'Ops... Internal server error, please contact support',
            errorMessage: error.message
        }
    }
}

exports.parseProcedureCall = async (event, context) => {
    try {
        procedure_value_pool = ""
        for(let i=0;i<event.procedure_value.length;i++) {
            procedure_value_pool += `'${event.procedure_value[i]}',`
        }
        const transaction = await knex.transaction(trx => {
            return knex.raw(
                "call "+event.procedure_name+"("+procedure_value_pool+" @t)"
            )
            .then(res => knex.select(knex.raw('@t')));
            })
    
        if (transaction) {
            return {
                status: 200,
                message: 'Request was successfully processed and returned',
            }
        }
        else {
            return {
                status: 500,
                message: 'Ops... Internal server error, please contact support',
                errorMessage: error.message
            }
        }
    } catch (error) {
        console.error(error)

        return {
            status: 500,
            message: 'Ops... Internal server error, please contact support',
            errorMessage: error.message
        }
    }
}