export class PeerRelation {
  constructor(peerA, peerB, map, options = {}) {
    this.peerA = peerA;      // instancia de PeerMarker
    this.peerB = peerB;      // instancia de PeerMarker
    this.map = map;
    this.options = options;
    this.polyline = this.createPolyline();
  }

  createPolyline() {
    return L.polyline(
      [
        [this.peerA.data.lat, this.peerA.data.lng],
        [this.peerB.data.lat, this.peerB.data.lng]
      ],
      this.options
    ).addTo(this.map);
  }

  setVisible(isVisible) {
    if (isVisible) {
      this.polyline.addTo(this.map);
    } else {
      this.map.removeLayer(this.polyline);
    }
  }

  setStyle(styleOptions) {
    this.polyline.setStyle(styleOptions);
  }
}