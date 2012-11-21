var Peers = require("..")

var p1 = Peers({
        interval: 100
        , timeout: 600
    })
    , p2 = Peers({
        interval: 100
        , timeout: 600
    })

p1.on("join", function (peer) {
    console.log("joined 1", peer.id)
})

p2.on("join", function (peer) {
    console.log("joined 2", peer.id)
})

p1.on("leave", function (peer) {
    console.log("leave 1", peer.id)

    if (peer.id === "peer2 id") {
        setTimeout(function () {
            console.log("closing p1")
            p1.close()
        }, 1000)
    }
})

p2.on("leave", function (peer) {
    console.log("leave 2", peer.id)
})

var stream1 = p1.createStream()
    , stream2 = p2.createStream()

stream1.pipe(stream2).pipe(stream1)

p1.join({
    id: "peer1 id"
    , "arbitary meta data": "here"
})
p2.join({
    id: "peer2 id"
})

setTimeout(function () {
    console.log("closing p2")
    p2.close()
}, 1000)
