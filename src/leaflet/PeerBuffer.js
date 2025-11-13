export class PeerBuffer {
  constructor(peer, map, radiusMeters = 500, options = {}) {
    this.peer = peer;   // instancia de PeerMarker
    this.map = map;
    this.circle = L.circle(
      [peer.data.lat, peer.data.lng],
      { radius: radiusMeters, ...options }
    ).addTo(map);
  }

  setRadius(newRadius) {
    this.circle.setRadius(newRadius);
  }

  setVisible(isVisible) {
    if (isVisible) {
      this.circle.addTo(this.map);
    } else {
      this.map.removeLayer(this.circle);
    }
  }
}