import { baseLayers } from "./mapStyle";
const config = { MAPTILER_TOKEN: "U4hNLWRENxTa7CfHUUnN" };

export class MapLibreStyleSwitcherControl {
  constructor(styles, defaultStyle) {
    this.styles = styles || MapLibreStyleSwitcherControl.DEFAULT_STYLES;
    this.defaultStyle =
      defaultStyle || MapLibreStyleSwitcherControl.DEFAULT_STYLE;
    this.onDocumentClick = this.onDocumentClick.bind(this);
  }
  getDefaultPosition() {
    const defaultPosition = "top-right";
    return defaultPosition;
  }
  onAdd(map) {
    this.map = map;

    this.controlContainer = document.createElement("div");
    this.controlContainer.classList.add("maplibregl-ctrl");
    this.controlContainer.classList.add("maplibregl-ctrl-group");
    this.mapStyleContainer = document.createElement("div");
    this.styleButton = document.createElement("button");
    this.styleButton.type = "button";
    this.mapStyleContainer.classList.add("maplibregl-style-list");
    for (const style of this.styles) {
      const styleElement = document.createElement("button");
      styleElement.type = "button";
      styleElement.innerText = style.title;
      styleElement.classList.add(style.title.replace(/[^a-z0-9-]/gi, "_"));
      styleElement.dataset.uri = JSON.stringify(style.uri);
      styleElement.addEventListener("click", (event) => {
        const srcElement = event.srcElement;
        if (srcElement.classList.contains("active")) {
          return;
        }
        if (style.title === "Counties") {
          this.map.setLayoutProperty("counties", "visibility", "visible");
        } else {
          this.map.setLayoutProperty("counties", "visibility", "none");
        }
        this.map.setLayoutProperty("richness_all", "visibility", "none");
        this.map.setLayoutProperty("richness_plants", "visibility", "none");
        this.map.setLayoutProperty(
          "richness_vertebrates",
          "visibility",
          "none"
        );
        this.map.setLayoutProperty(
          "richness_butterflies",
          "visibility",
          "none"
        );
        const orderedLayerIds = map.getLayersOrder();
        orderedLayerIds.forEach((layerId) => {
          if (layerId.includes("ol-")) {
            this.map.removeLayer(layerId);
          }
        });
        if (style.title === "Richness of all species") {
          this.map.setLayoutProperty("richness_all", "visibility", "visible");
        }
        if (style.title === "Plant richness") {
          this.map.setLayoutProperty(
            "richness_plants",
            "visibility",
            "visible"
          );
        }
        if (style.title === "Vertebrate richness") {
          this.map.setLayoutProperty(
            "richness_vertebrates",
            "visibility",
            "visible"
          );
        }
        if (style.title === "Butterfly richness") {
          this.map.setLayoutProperty(
            "richness_butterflies",
            "visibility",
            "visible"
          );
        }
        this.map.triggerRepaint();
        if (style.uri !== "") {
          fetch(JSON.parse(srcElement.dataset.uri))
            .then((res) => res.json())
            .then((sty) => {
              sty = sty.layers.map((layer) => {
                layer.id = "ol-" + layer.id;
                map.addLayer(layer, "counties");
              });
              this.map.triggerRepaint();
            });
        }
        this.mapStyleContainer.style.display = "none";
        this.styleButton.style.display = "block";
        const elms = this.mapStyleContainer.getElementsByClassName("active");
        while (elms[0]) {
          elms[0].classList.remove("active");
        }
        srcElement.classList.add("active");
      });
      if (style.title === this.defaultStyle) {
        styleElement.classList.add("active");
      }
      this.mapStyleContainer.appendChild(styleElement);
    }
    this.styleButton.classList.add("maplibregl-ctrl-icon");
    this.styleButton.classList.add("maplibregl-style-switcher");
    this.styleButton.addEventListener("click", () => {
      this.styleButton.style.display = "none";
      this.mapStyleContainer.style.display = "block";
    });
    document.addEventListener("click", this.onDocumentClick);
    this.controlContainer.appendChild(this.styleButton);
    this.controlContainer.appendChild(this.mapStyleContainer);
    return this.controlContainer;
  }
  onRemove() {
    if (
      !this.controlContainer ||
      !this.controlContainer.parentNode ||
      !this.map ||
      !this.styleButton
    ) {
      return;
    }
    this.styleButton.removeEventListener("click", this.onDocumentClick);
    this.controlContainer.parentNode.removeChild(this.controlContainer);
    document.removeEventListener("click", this.onDocumentClick);
    this.map = undefined;
  }
  onDocumentClick(event) {
    if (
      this.controlContainer &&
      !this.controlContainer.contains(event.target) &&
      this.mapStyleContainer &&
      this.styleButton
    ) {
      this.mapStyleContainer.style.display = "none";
      this.styleButton.style.display = "block";
    }
  }
}
MapLibreStyleSwitcherControl.DEFAULT_STYLE = "Demotiles";
MapLibreStyleSwitcherControl.DEFAULT_STYLES = baseLayers;
