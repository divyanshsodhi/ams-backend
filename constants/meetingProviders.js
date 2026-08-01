const MEETING_PROVIDERS = Object.freeze({
  NONE: "none",
  ZOOM: "zoom",
  GOOGLE_MEET: "google_meet",
});

const ALL_MEETING_PROVIDERS = Object.values(MEETING_PROVIDERS);

module.exports = { MEETING_PROVIDERS, ALL_MEETING_PROVIDERS };
