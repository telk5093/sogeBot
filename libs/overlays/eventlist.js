'use strict'

// 3rdparty libraries
const _ = require('lodash')
const crypto = require('crypto')

function EventList () {
  global.panel.addMenu({category: 'settings', name: 'overlays', id: 'overlays'})
  global.panel.socketListening(this, 'overlay.eventlist.get', this._getOverlay)
  global.panel.socketListening(this, 'widget.eventlist.get', this._getWidget)
}

EventList.prototype._get = async function (self) {
  self._getWidget(self)
  self._getOverlay(self)
}

EventList.prototype._getWidget = async function (self) {
  let events = await global.db.engine.find('widgetsEventList')
  global.panel.io.emit('widget.eventlist', _.chunk(_.orderBy(events, 'timestamp', 'desc'), 20)[0])
}

EventList.prototype._getOverlay = async function (self) {
  let events = await global.db.engine.find('widgetsEventList')

  events = _.uniqBy(_.orderBy(events, 'timestamp', 'desc'), (o) => {
    if (o.event === 'cheer') o.event = crypto.randomBytes(64).toString('hex') // force cheer to show
    return o.username + o.event
  })
  global.panel.io.emit('overlay.eventlist', _.chunk(events, 20)[0])
}

EventList.prototype.add = async function (data) {
  if (global.parser.isBot(data.username)) return // don't save event from a bot

  const newEvent = {
    event: data.type,
    timestamp: _.now(),
    username: data.username,
    message: _.isNil(data.message) ? undefined : data.message,
    amount: _.isNil(data.amount) ? undefined : data.amount,
    currency: _.isNil(data.currency) ? undefined : data.currency,
    months: _.isNil(data.months) ? undefined : data.months,
    bits: _.isNil(data.bits) ? undefined : data.bits,
    viewers: _.isNil(data.viewers) ? undefined : data.viewers,
    from: _.isNil(data.from) ? undefined : data.from,
    tier: _.isNil(data.tier) ? undefined : data.tier,
    song_title: _.isNil(data.song_title) ? undefined : data.song_title,
    song_url: _.isNil(data.song_url) ? undefined : data.song_url
  }
  global.db.engine.insert('widgetsEventList', newEvent)
  global.overlays.eventlist._get(global.overlays.eventlist)
  global.widgets.eventlist._get(global.widgets.eventlist)
}

module.exports = new EventList()
