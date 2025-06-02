import { useEffect, useState, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Protocol } from "pmtiles";
import _ from "lodash";
import { amfhot, haline, ocean, custom } from "./colormaps";
import counties_challenges from "./counties_challenges.json";
import counties_species from "./counties_species.json";
import "./map.css";

export default function Map(props) {
  const { COGUrl, opacity, challenges, challenge, colorBy } = props;

  const [mapp, setMapp] = useState(false);

  const mapRef = useRef();

  const colormap = encodeURIComponent(JSON.stringify(custom));

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
            satellite: {
              url: "https://api.maptiler.com/tiles/satellite-v2/tiles.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL",
              type: "raster",
            },
            /*cog: {
              type: "raster",
              tiles: [
                `https://tiler.biodiversite-quebec.ca/cog/tiles/{z}/{x}/{y}?url=${COGUrl}&rescale=0,10&colormap=${colormap}&resampling=cubic`,
              ],
              tileSize: 256,
              minzoom: 7.001,
            },*/
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
            /*{
              id: "cog",
              type: "raster",
              source: "cog",
              paint: {
                "raster-opacity": opacity / 100,
              },
              minzoom: 7.001,
              maxzoom: 24,
            },
          */
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
      map.addControl(new maplibregl.GlobeControl());
      map.addControl(
        new maplibregl.NavigationControl({
          showZoom: true,
          showCompass: false,
        })
      );
      map.on("click", "counties", (e) => {
        let html = `<div style="text-align:left"><h3>${
          e.features[0].properties.CDNAME
        }</h3>
        <strong>Number of species</strong>: ${
          e.features[0].properties.number_of_species
        }</b>
        <br><strong>Number of challenges</strong>: ${
          parseInt(e.features[0].properties.number_of_challenges) + 3
        }</b>
        <br><strong>List of challenges</strong>: <ul><li>${(
          e.features[0].properties.challenges +
          "," +
          everywhere_challenges.join(",")
        )
          .replace("Birders, don't look up!", "Birders - don't look up!")
          .split(",")
          .join("</li><li>")}</li></b></div>`;
        new maplibregl.Popup()
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .setHTML(html)
          .addTo(map);
      });
      map.on("mouseenter", "counties", () => {
        map.getCanvas().style.cursor = "crosshair";
      });
      map.on("mouseleave", "counties", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      setMapp(map);
      return () => {
        map.remove();
      };
    }
  }, []);

  useEffect(() => {
    if (mapp) {
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
