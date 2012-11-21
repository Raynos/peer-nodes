var Peers = require("..")

var p1 = Peers({
        interval: 100
    })
    , p2 = Peers({
        interval: 100
    })
    , p3 = Peers()

p1.on("join", function (peer) {
    console.log("joined 1", peer.id)
})
p2.on("join", function (peer) {
    console.log("joined 2", peer.id)
})
p3.on("join", function (peer) {
    console.log("joined 3", peer.id)
})

var stream1 = p1.createStream()
    , stream2 = p2.createStream()
    , stream3 = p3.createStream()

stream1.pipe(stream2).pipe(stream1)
stream1.pipe(stream3).pipe(stream1)

process.nextTick(function () {
    p1.join({
        id: "peer 1"
    })
    p2.join({
        id: "peer 2"
    })
    p3.join({
        id: "peer 3"
    })
})
