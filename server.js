const queryController = require('./controllers/query-parser')

const handler = async (event) => {
    const eventOperation = event.operation
    delete event.operation
    if (eventOperation == 'SELECT') {
        return await queryController.parseSelect(event)
    }
    else if (eventOperation == 'INSERT') {
        return await queryController.parseInsert(event)
    }
    else if (eventOperation == 'UPDATE') {
        return await queryController.parseUpdate(event)
    }
    else if (eventOperation == 'DELETE') {
        return await queryController.parseDelete(event)
    }
    else if (eventOperation == 'COUNT') {
        return await queryController.parseCount(event)
    }
    else if (eventOperation == 'RAW') {
        return await queryController.raw(event)
    }
    else if (eventOperation == 'PROCEDURECALL') {
        return await queryController.parseProcedureCall(event)
    }
}

module.exports.handler = handler