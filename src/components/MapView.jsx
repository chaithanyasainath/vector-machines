import {
  MapContainer,
  TileLayer,
  GeoJSON,
  LayersControl,
  useMap
} from "react-leaflet";
import { useEffect, useState, useCallback } from "react";
import L from "leaflet";

const { Overlay } = LayersControl;

// Auto-fit map to park boundary
function FitBounds({ data }) {
  const map = useMap();

  useEffect(() => {
    if (data) {
      const layer = L.geoJSON(data);
      map.fitBounds(layer.getBounds());
    }
  }, [data, map]);

  return null;
}

function MapView() {
  const [layers, setLayers] = useState({
    park: null,
    poles: null,
    missionLines: null,
    missionPoints: null,
  });

  const removeEmptyGeometries = (data) => ({
    ...data,
    features: data.features.filter(
      (f) =>
        f.geometry &&
        f.geometry.coordinates &&
        f.geometry.coordinates.length > 0
    ),
  });

  const loadLayer = useCallback((url, key) => {
    fetch(url)
      .then((res) => res.json())
      .then((data) =>
        setLayers((prev) => ({
          ...prev,
          [key]: removeEmptyGeometries(data),
        }))
      );
  }, []);

  useEffect(() => {
    loadLayer("/data/parkBoundary.geojson", "park");
    loadLayer("/data/poles.geojson", "poles");
    loadLayer("/data/mission_lines.geojson", "missionLines");
    loadLayer("/data/mission_points.geojson", "missionPoints");
  }, [loadLayer]);

  const buildPopup = (title, properties) => {
    let content = `<strong>${title}</strong><br/>`;
    for (let key in properties) {
      content += `<strong>${key}:</strong> ${properties[key]}<br/>`;
    }
    return content;
  };

  const LayerComponent = ({
    name,
    data,
    style,
    pointStyle,
    popupTitle,
    fit = false,
  }) =>
    data ? (
      <Overlay checked name={name}>
        <>
          <GeoJSON
            data={data}
            style={style}
            pointToLayer={
              pointStyle
                ? (feature, latlng) =>
                    L.circleMarker(latlng, pointStyle)
                : undefined
            }
            onEachFeature={(feature, layer) =>
              layer.bindPopup(buildPopup(popupTitle, feature.properties))
            }
          />
          {fit && <FitBounds data={data} />}
        </>
      </Overlay>
    ) : null;

  return (
    <>
      <h2 style={{ textAlign: "center", margin: "10px" }}>
        Mission Visualizer – Biddinghuizen
      </h2>

      <MapContainer
        center={[52.425, 5.685]}
        zoom={14}
        style={{ height: "90vh", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LayersControl position="topright">

          <LayerComponent
            name="Park Boundary"
            data={layers.park}
            style={{ color: "green", weight: 2, fillOpacity: 0.1 }}
            popupTitle="Park Boundary"
            fit
          />

          <LayerComponent
            name="Mission Graph (Edges)"
            data={layers.missionLines}
            style={{ color: "orange", weight: 3 }}
            popupTitle="Mission Edge"
          />

          <LayerComponent
            name="Mission Nodes / Docks"
            data={layers.missionPoints}
            pointStyle={{
              radius: 6,
              fillColor: "red",
              color: "white",
              weight: 1,
              fillOpacity: 1,
            }}
            popupTitle="Mission Node"
          />

          <LayerComponent
            name="Poles"
            data={layers.poles}
            pointStyle={{
              radius: 4,
              fillColor: "purple",
              color: "white",
              weight: 1,
              fillOpacity: 1,
            }}
            popupTitle="Pole"
          />

        </LayersControl>

        {/* Legend */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            background: "white",
            padding: "10px",
            borderRadius: "8px",
            boxShadow: "0 0 6px rgba(0,0,0,0.2)",
            fontSize: "14px",
            lineHeight: "1.6"
          }}
        >
          <div><span style={{ color: "green" }}>■</span> Park Boundary</div>
          <div><span style={{ color: "orange" }}>■</span> Mission Edges</div>
          <div><span style={{ color: "red" }}>●</span> Mission Nodes</div>
          <div><span style={{ color: "purple" }}>●</span> Poles</div>
        </div>

      </MapContainer>
    </>
  );
}

export default MapView;