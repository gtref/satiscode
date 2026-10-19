const owner = "gtref";
const repo = "satiscode";
const releasesPerPage = 100;

async function getVersionMetadata() {
  const response = await fetch("../version-metadata.json");
  if (!response.ok) throw new Error("Failed to fetch version metadata");

  const metadata = await response.json();
  if (!metadata || !Array.isArray(metadata.versions) || !metadata.versions.every(version =>
    version &&
    typeof version.version === "string" &&
    typeof version.name === "string"
  )) {
    throw new Error("Invalid version metadata");
  }

  return metadata;
}

async function getReleaseHistory() {
  const releases = [];

  for (let page = 1; ; page++) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases?per_page=${releasesPerPage}&page=${page}`
    );
    if (!response.ok) throw new Error(`Failed to fetch releases (HTTP ${response.status})`);

    const pageReleases = await response.json();
    if (!Array.isArray(pageReleases)) throw new Error("Invalid release history response");

    releases.push(...pageReleases);
    if (pageReleases.length < releasesPerPage) return releases;
  }
}

function normalizeVersion(version) {
  return version.replace(/^v/i, "");
}

function getVersionName(release, metadata) {
  const releaseVersion = release.tag_name ? normalizeVersion(release.tag_name) : "";
  const namedVersion = metadata?.versions.find(version =>
    normalizeVersion(version.version) === releaseVersion
  );

  return namedVersion ? namedVersion.name : metadata ? "No name assigned" : "Name unavailable";
}

function renderReleaseHistory(releases, metadata) {
  const releaseList = document.getElementById("release-list");
  const releaseStatus = document.getElementById("release-status");
  releaseList.replaceChildren();

  if (releases.length === 0) {
    releaseStatus.textContent = "No published releases found.";
    return;
  }

  const currentReleaseIndex = Math.max(releases.findIndex(release => !release.prerelease), 0);
  releases.forEach((release, index) => {
    const item = document.createElement("li");
    const details = document.createElement("details");
    details.className = "release-entry";

    const summary = document.createElement("summary");
    const version = release.tag_name || release.name || "Unknown version";
    const date = release.published_at
      ? new Date(release.published_at).toLocaleDateString()
      : "Date unavailable";
    const currentLabel = index === currentReleaseIndex ? " · Current" : "";
    summary.textContent = `${version} — ${getVersionName(release, metadata)} · ${date}${currentLabel}`;

    const notes = document.createElement("div");
    notes.className = "release-notes";
    const releaseNotes = release.body?.trim() || "No changelog provided for this release.";
    if (typeof marked !== "undefined" && typeof marked.parse === "function") {
      notes.innerHTML = marked.parse(releaseNotes);
    } else {
      notes.textContent = releaseNotes;
    }

    details.append(summary, notes);
    item.appendChild(details);
    releaseList.appendChild(item);
  });

  releaseStatus.textContent = `${releases.length} published release${releases.length === 1 ? "" : "s"}.`;
}

async function loadReleaseHistory() {
  const releaseStatus = document.getElementById("release-status");
  const [releasesResult, metadataResult] = await Promise.allSettled([
    getReleaseHistory(),
    getVersionMetadata()
  ]);

  if (releasesResult.status === "rejected") {
    console.error(releasesResult.reason);
    releaseStatus.textContent = "Unable to load releases. Please try again later.";
    return;
  }

  const metadata = metadataResult.status === "fulfilled" ? metadataResult.value : null;
  if (metadataResult.status === "rejected") console.error(metadataResult.reason);
  renderReleaseHistory(releasesResult.value, metadata);
}

loadReleaseHistory();
