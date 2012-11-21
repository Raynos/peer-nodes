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
    var peers = new ExpiryModel()
        , interval = options.interval || 5000
        , timeout = options.timeout || 1000 * 60
        , heartbeats = {}
        , closed
        , id

    peers.close = close
    peers.join = join

    peers.on("update", onupdate)

    setTimeout(heartbeat, interval)

    return peers

    function join(meta) {
        id = meta.id
        peers.set(id, meta)
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
            var value = peers.get(key)

            ;delete heartbeats[key]
            peers.emit("leave", value)
        })
    }

    function heartbeat() {
        if (closed) {
            return
        }

        var now = Date.now()
            , meta = peers.get(id)

        meta._heartbeat = now
        peers.set(id, meta)

        Object.keys(heartbeats).forEach(function (key) {
            // console.log("heartbeats", heartbeats, id)
            var time = heartbeats[key]

            if (time < now - timeout) {
                delete heartbeats[key]

                peers.emit("leave", peers.get(key))
            }
        })

        setTimeout(heartbeat, interval)
    }
}
