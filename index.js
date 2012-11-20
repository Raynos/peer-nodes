var ExpiryModel = require("expiry-model")
    , uuid = require("node-uuid")
    , EventEmitter = require("events").EventEmitter
    , extend = require("xtend")

module.exports = Peers

/*
    var peer = Peers({
        interval: 5000
        , timeout: 1000 * 60 * 60
    })
*/
function Peers(options) {
    options = options || {}

    if (typeof options === "string") {
        options = { id: options }
    }

    var model = new ExpiryModel()
        , peers = new EventEmitter()
        , interval = options.interval || 5000
        , timeout = options.timeout || 1000 * 60
        , id = options.id || uuid()
        , meta = options.meta || {}
        , heartbeats = {}
        , closed

    meta.id = id

    peers.toJSON = toJSON
    peers.createStream = createStream
    peers.close = close
    peers.join = join

    model.on("synced", onsynched)
    model.on("update", onupdate)

    setTimeout(heartbeat, interval)

    return peers

    function join(_meta) {
        if (_meta) {
            extend(meta, _meta)
            id = meta.id
        }

        model.set(id, meta)
    }

    function toJSON() {
        return model.toJSON()
    }

    function createStream() {
        return model.createStream()
    }

    function onsynched() {
        peers.emit("synced")
    }

    function onupdate(key, value, ts) {
        // console.log("update", arguments)
        var now = Date.now()
        if (ts < now - timeout || closed) {
            return
        }

        if (!heartbeats[key]) {
            // console.log("emitting join")
            peers.emit("join", value)
        }

        // console.log("updating heartbeats", id)
        heartbeats[key] = ts
    }

    function close() {
        closed = true

        Object.keys(heartbeats).forEach(function (key) {
            var value = model.get(key)

            ;delete heartbeats[key]
            peers.emit("leave", value)
        })
    }

    function heartbeat() {
        if (closed) {
            return
        }

        var now = Date.now()

        meta._heartbeat = now
        model.set(id, meta)

        Object.keys(heartbeats).forEach(function (key) {
            // console.log("heartbeats", heartbeats, id)
            var time = heartbeats[key]

            if (time < now - timeout) {
                delete heartbeats[key]

                peers.emit("leave", model.get(key))
            }
        })

        setTimeout(heartbeat, interval)
    }
}
