const _ = require('lodash')
const flatten = require('flat')
const fs = require('fs')

const Interface = require('./interface')
const Datastore = require('nedb')

// debug
const debug = require('debug')('db:nedb')

class INeDB extends Interface {
  constructor () {
    super('nedb')

    this.connected = true

    if (!fs.existsSync('./db')) fs.mkdirSync('./db')
    if (!fs.existsSync('./db/nedb')) fs.mkdirSync('./db/nedb')

    this.table = {}

    if (debug.enabled) debug('NeDB initialized')
  }

  on (table) {
    if (_.isNil(this.table[table])) {
      this.table[table] = new Datastore({ filename: './db/nedb/' + table + '.db', autoload: true })
      this.table[table].persistence.setAutocompactionInterval(60000)
    }
    return this.table[table]
  }

  async find (table, where) {
    this.on(table) // init table

    where = where || {}

    var self = this
    return new Promise(function (resolve, reject) {
      try {
        self.on(table).find(flatten(where), function (err, items) {
          if (err) reject(err)
          if (debug.enabled) debug('find() \n\ttable: %s \n\twhere: %j \n\titems: %j', table, where, items)
          resolve(items)
        })
      } catch (e) {
        global.log.error(e.message)
        throw e
      }
    })
  }

  async findOne (table, where) {
    this.on(table) // init table

    where = where || {}

    var self = this
    return new Promise(function (resolve, reject) {
      try {
        self.on(table).findOne(flatten(where), function (err, item) {
          if (err) reject(err)
          if (debug.enabled) debug('findOne() \n\ttable: %s \n\twhere: %j \n\titem: %j', table, where, _.isNil(item) ? {} : item)
          resolve(_.isNil(item) ? {} : item)
        })
      } catch (e) {
        global.log.error(e.message)
        throw e
      }
    })
  }

  async insert (table, object) {
    this.on(table) // init table

    if (_.isEmpty(object)) throw Error('Object cannot be empty')

    var self = this
    return new Promise(function (resolve, reject) {
      try {
        self.on(table).insert(flatten.unflatten(object), function (err, item) {
          if (err) reject(err)
          if (debug.enabled) debug('insert() \n\ttable: %s \n\tobject: %j', table, object)

          resolve(item)
        })
      } catch (e) {
        global.log.error(e.message)
        throw e
      }
    })
  }

  async remove (table, where) {
    this.on(table) // init table

    var self = this
    const threadHash = await this.waitForThread(table, where)
    return new Promise(function (resolve, reject) {
      try {
        self.on(table).remove(flatten(where), { multi: true }, function (err, numRemoved) {
          if (err) reject(err)
          if (debug.enabled) debug('remove() \n\ttable: %s \n\twhere: %j \n\tremoved: %j', table, where, numRemoved)
          global.db.engine.freeThread(table, where, threadHash)
          resolve(numRemoved)
        })
      } catch (e) {
        global.log.error(e.message)
        throw e
      }
    })
  }

  async update (table, where, object) {
    this.on(table) // init table

    if (_.isEmpty(object)) throw Error('Object to update cannot be empty')

    var self = this
    const threadHash = await this.waitForThread(table, where)
    return new Promise(function (resolve, reject) {
      // DON'T EVER DELETE flatten ON OBJECT - with flatten object get updated and not replaced
      try {
        self.on(table).update(flatten(where), { $set: flatten(object, { safe: true }) }, { upsert: (_.isNil(where._id) && !_.isEmpty(where)), multi: (_.isEmpty(where)), returnUpdatedDocs: true }, function (err, numReplaced, affectedDocs) {
          if (err) reject(err)
          if (debug.enabled) debug('update() \n\ttable: %s \n\twhere: %j \n\tupdated: %j', table, where, numReplaced)
          global.db.engine.freeThread(table, where, threadHash)
          resolve(affectedDocs)
        })
      } catch (e) {
        global.log.error(e.message)
        throw e
      }
    })
  }

  async incrementOne (table, where, object) {
    this.on(table) // init table

    if (_.isEmpty(object)) throw Error('Object to update cannot be empty')

    var self = this
    const threadHash = await this.waitForThread(table, where)
    return new Promise(function (resolve, reject) {
      // DON'T EVER DELETE flatten ON OBJECT - with flatten object get updated and not replaced
      try {
        self.on(table).update(flatten(where), { $inc: flatten(object) }, { upsert: true, multi: false, returnUpdatedDocs: true }, function (err, numReplaced, affectedDocs) {
          if (err) reject(err)
          if (debug.enabled) debug('increment() \n\ttable: %s \n\twhere: %j \n\tupdated: %j', table, where, numReplaced)
          global.db.engine.freeThread(table, where, threadHash)
          resolve(affectedDocs)
        })
      } catch (e) {
        global.log.error(e.message)
        throw e
      }
    })
  }

  async increment (table, where, object) {
    this.on(table) // init table

    if (_.isEmpty(object)) throw Error('Object to update cannot be empty')

    var self = this
    const threadHash = await this.waitForThread(table, where)
    return new Promise(function (resolve, reject) {
      // DON'T EVER DELETE flatten ON OBJECT - with flatten object get updated and not replaced
      try {
        self.on(table).update(flatten(where), { $inc: flatten(object) }, { upsert: true, multi: true, returnUpdatedDocs: true }, function (err, numReplaced, affectedDocs) {
          if (err) reject(err)
          if (debug.enabled) debug('increment() \n\ttable: %s \n\twhere: %j \n\tupdated: %j', table, where, numReplaced)
          global.db.engine.freeThread(table, where, threadHash)
          resolve(affectedDocs)
        })
      } catch (e) {
        global.log.error(e.message)
        throw e
      }
    })
  }
}

module.exports = INeDB
