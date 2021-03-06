/* global describe it before */

require('../../general.js')

const db = require('../../general.js').db
const message = require('../../general.js').message
const tmi = require('../../general.js').tmi

const moment = require('moment')

const testuser = { username: 'testuser' }
const testuser2 = { username: 'testuser2' }
const testuser3 = { username: 'testuser3' }

describe('lib/twitch - followers()', () => {
  before(async () => {
    await tmi.waitForConnection()
    global.commons.sendMessage.reset()
    await db.cleanup()
  })

  it('add testuser to event', async () => {
    await global.overlays.eventlist.add({
      type: 'follow',
      username: 'testuser'
    })
  })

  it('add testuser2 to event', async () => {
    await global.overlays.eventlist.add({
      type: 'follow',
      username: 'testuser2'
    })
  })

  it('!followers should return testuser2', async () => {
    let fromDb = await global.db.engine.findOne('widgetsEventList', {'username': 'testuser2', type: 'follow'})
    global.parser.parse(testuser, '!followers')
    await message.isSent('followers', testuser, {
      lastFollowAgo: moment(fromDb.timestamp).fromNow(),
      lastFollowUsername: testuser2.username,
      onlineFollowersCount: 0
    })
  })

  it('add testuser3 to events', async () => {
    await global.overlays.eventlist.add({
      type: 'follow',
      username: 'testuser3'
    })
  })

  it('!followers should return testuser3', async () => {
    let fromDb = await global.db.engine.findOne('widgetsEventList', {'username': 'testuser3', type: 'follow'})
    global.parser.parse(testuser, '!followers')
    await message.isSent('followers', testuser, {
      lastFollowAgo: moment(fromDb.timestamp).fromNow(),
      lastFollowUsername: testuser3.username,
      onlineFollowersCount: 0
    })
  })
})
