const config = { MAPTILER_TOKEN: "U4hNLWRENxTa7CfHUUnN" };

export const baseLayers = [
  {
    title: "Base layer",
    uri: "",
  },
  {
    title: "Light",
    uri:
      "https://api.maptiler.com/maps/outdoor-v2/style.json?key=" +
      config.MAPTILER_TOKEN,
  },
  {
    title: "Satellite",
    uri:
      "https://api.maptiler.com/maps/hybrid/style.json?key=" +
      config.MAPTILER_TOKEN,
  },
  {
    title: "Richness of all species",
    uri: "",
  },
  {
    title: "Plant richness",
    uri: "",
  },
  {
    title: "Vertebrate richness",
    uri: "",
  },
  {
    title: "Butterfly richness",
    uri: "",
  },
];
