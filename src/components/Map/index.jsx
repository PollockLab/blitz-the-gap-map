import { useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom/client";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import _, { every } from "lodash";
import { amfhot, haline, ocean, custom } from "./colormaps";
import Popup from "./Popup";
import counties_challenges from "./counties_challenges.json";
import counties_species from "./counties_species.json";
import { MapLibreStyleSwitcherControl } from "./styleswitcher";
import { baseLayers } from "./mapStyle";
import "./map.css";

export default function Map(props) {
  const { COGUrl, opacity, challenges, challenge, colorBy } = props;

  const [mapp, setMapp] = useState(null);

  const mapRef = useRef();

  //const colormap = encodeURIComponent(JSON.stringify(amfhot));
  const colormap = "viridis";

  const everywhere_challenges = challenges
    .filter((c) => c.everywhere === true)
    .map((c) => c.name);

  useEffect(() => {
    let ignore = true;
    let protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    return () => {
      maplibregl.removeProtocol("pmtiles");
      ignore = false;
    };
  }, []);

  const color_challenges = (value) => {
    if (value < 1) return "#fff0";
    if (value < 100) return "#6ee4f9";
    if (value < 400) return "#34aac0";
    if (value < 600) return "#1a879c";
    return "#177182";
  };

  const chalpal = (chal, colorBy) => {
    const thischal = challenges.filter((c) => c.name === chal);
    if (chal === "All challenges" && colorBy === "challenges") {
      return [
        "interpolate",
        ["linear"],
        ["to-number", ["get", "number_of_challenges"]],
        2,
        "#22301a",
        3,
        "#3f5830",
        4,
        "#54793e",
        5,
        "#638b4c",
        6,
        "#98cd79",
      ];
    }
    if (thischal[0].everywhere && colorBy === "challenges") {
      return "#45732a";
    }
    if (colorBy === "challenges") {
      return ["case", ["in", chal, ["get", "challenges"]], "#45732a", "#000"];
    }

    if (thischal[0].everywhere && colorBy === "species") {
      return "#30a3b9";
    }

    if (chal === "All challenges" && colorBy === "species") {
      let pal = ["case"];
      counties_species.map((m) => {
        pal.push(["==", ["get", "DGUID"], m.DGUID]);
        pal.push(color_challenges(parseInt(m.n)));
      });
      pal.push("#fff0");
      return pal;
    }
    if (chal !== "All challenges" && colorBy === "species") {
      let pal = ["case"];
      const cc = counties_challenges.filter((m) => m.Challenge == chal);
      cc.map((m) => {
        pal.push(["==", ["get", "DGUID"], m.DGUID]);
        pal.push(color_challenges(parseInt(m.n)));
      });
      pal.push("#fff0");
      return pal;
    }

    let pal = ["case"];
    const cc = counties_challenges.filter((m) => m.Challenge == chal);
    cc.map((m) => {
      pal.push(["==", ["get", "DGUID"], m.DGUID]);
      pal.push(color_challenges(parseInt(m.n)));
    });
    pal.push("white");
    return pal;
  };

  const pal = [
    "interpolate",
    ["case"],
    ["get", "number_of_challenges"],
    2,
    "#ffffff",
    4,
    "#ffff00",
    8,
    "#ff0000",
  ];

  useEffect(() => {
    if (COGUrl && !mapp) {
      const map = new maplibregl.Map({
        container: "App",
        zoom: 3.5,
        center: [-90, 58],
        style: {
          version: 8,
          projection: {
            type: "globe",
          },
          sources: {
            richness_all: {
              type: "raster",
              tiles: [
                `https://tiler.biodiversite-quebec.ca/cog/tiles/{z}/{x}/{y}?url=https://object-arbutus.cloud.computecanada.ca/bq-io/blitz-the-gap/SR_allSDMs.tif&rescale=0,1200&colormap_name=${colormap}`,
              ],
              tileSize: 256,
            },
            richness_plants: {
              type: "raster",
              tiles: [
                `https://tiler.biodiversite-quebec.ca/cog/tiles/{z}/{x}/{y}?url=https://object-arbutus.cloud.computecanada.ca/bq-io/blitz-the-gap/SR_plants.tif&rescale=0,700&colormap_name=${colormap}`,
              ],
              tileSize: 256,
            },
            richness_vertebrates: {
              type: "raster",
              tiles: [
                `https://tiler.biodiversite-quebec.ca/cog/tiles/{z}/{x}/{y}?url=https://object-arbutus.cloud.computecanada.ca/bq-io/blitz-the-gap/SR_verts.tif&rescale=0,700&colormap_name=${colormap}`,
              ],
              tileSize: 256,
            },
            richness_butterflies: {
              type: "raster",
              tiles: [
                `https://tiler.biodiversite-quebec.ca/cog/tiles/{z}/{x}/{y}?url=https://object-arbutus.cloud.computecanada.ca/bq-io/blitz-the-gap/SR_butterflies.tif&rescale=0,100&colormap_name=${colormap}`,
              ],
              tileSize: 256,
            },
            counties: {
              type: "vector",
              url: "pmtiles://https://object-arbutus.cloud.computecanada.ca/bq-io/blitz-the-gap/counties_challenges.pmtiles",
            },
            terrain: {
              type: "raster-dem",
              tiles: [
                "https://tiler.biodiversite-quebec.ca/cog/tiles/{z}/{x}/{y}?url=https://object-arbutus.cloud.computecanada.ca/bq-io/io/earthenv/topography/elevation_1KMmn_GMTEDmn.tif&rescale=0,2013&bidx=1&expression=b1",
              ],
              tileSize: 256,
            },
            background: {
              type: "raster",
              tiles: [
                "https://01.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
              ],
              tileSize: 256,
            },
          },
          /*terrain: { source: "terrain", exaggeration: 0.025 },*/
          layers: [
            {
              id: "back",
              type: "raster",
              source: "background",
            },
            {
              id: "richness_all",
              type: "raster",
              source: "richness_all",
              layout: {
                visibility: "none",
              },
            },
            {
              id: "richness_plants",
              type: "raster",
              source: "richness_plants",
              layout: {
                visibility: "none",
              },
            },
            {
              id: "richness_vertebrates",
              type: "raster",
              source: "richness_vertebrates",
              layout: {
                visibility: "none",
              },
            },
            {
              id: "richness_butterflies",
              type: "raster",
              source: "richness_butterflies",
              layout: {
                visibility: "none",
              },
            },
            {
              id: "counties",
              type: "fill",
              "source-layer": "counties_challenges",
              source: "counties",
              paint: {
                /*"fill-extrusion-color": "lightblue",
                "fill-extrusion-height": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  3,
                  8,
                  6,
                  ["to-number", ["get", "number_of_challenges"]],
                ],
                "fill-extrusion-base": 5,*/
                "fill-color": chalpal(challenge, colorBy),
                "fill-opacity": 0.4,
                "fill-outline-color": "#ffffff",
              },
            },
          ],
          sky: {
            "atmosphere-blend": [
              "interpolate",
              ["linear"],
              ["zoom"],
              0,
              1,
              5,
              1,
              7,
              0,
            ],
          },
          light: {
            anchor: "viewport",
            position: [1.5, 90, 40],
            intensity: 0.25,
            color: "#555",
          },
        },
      });
      baseLayers.forEach((source) => {
        if (source.uri !== "") {
          fetch(source.uri)
            .then((res) => res.json())
            .then((sty) => {
              Object.entries(sty.sources).forEach(([sourceId, sourceDef]) => {
                if (!map.getSource(sourceId)) {
                  map.addSource(sourceId, sourceDef);
                }
              });
            });
        }
      });
      map.addControl(new maplibregl.GlobeControl());
      map.addControl(
        new maplibregl.NavigationControl({
          showZoom: true,
          showCompass: false,
        })
      );
      map.on("click", "counties", (e) => {
        const container = document.createElement("div");

        ReactDOM.createRoot(container).render(
          <Popup
            feature={e.features[0].properties}
            everywhere_challenges={everywhere_challenges}
          />
        );

        new maplibregl.Popup()
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .setDOMContent(container)
          .addTo(map);
      });

      map.on("mouseenter", "counties", () => {
        map.getCanvas().style.cursor = "crosshair";
      });
      map.on("mouseleave", "counties", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.addControl(new MapLibreStyleSwitcherControl());
      setMapp(map);
      return () => {
        map.remove();
      };
    }
  }, []);

  useEffect(() => {
    if (mapp) {
      mapp.setLayoutProperty("counties", "visibility", "visible");
      mapp.setLayoutProperty("richness_all", "visibility", "none");
      mapp.setLayoutProperty("richness_plants", "visibility", "none");
      mapp.setLayoutProperty("richness_vertebrates", "visibility", "none");
      mapp.setLayoutProperty("richness_butterflies", "visibility", "none");
      mapp.setPaintProperty(
        "counties",
        "fill-color",
        chalpal(challenge, colorBy)
      );
      mapp.triggerRepaint();
    }
    return () => {};
  }, [mapp, challenge, colorBy]);

  return (
    <div
      id="App"
      className="App"
      style={{
        width: "100vw",
        height: "100vh",
        zIndex: "0",
        background: "url('/blitz-the-gap-map/night-sky.png')",
      }}
    ></div>
  );
}
