import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 300;

type ProjectConfig = {
  owner: string;
  repo: string;
  author: string;
  name: string;
  internalName: string;
  description: string;
  tags: string[];
  dalamudApiLevel: number;
  applicableVersion?: string;
  isHide?: string;
  isTestingExclusive?: string;
  loadRequiredState?: number;
  loadSync?: boolean;
  canUnloadAsync?: boolean;
  loadPriority?: number;
  punchline?: string;
  acceptsFeedback?: boolean;
  icon?: string;
};

const PROJECTS: ProjectConfig[] = [
  {
    owner: "RayaSerahill",
    repo: "SimpleStats",
    author: "Raya Serahill",
    name: "SimpleStats",
    internalName: "SimpleStats",
    description: "Automatically upload SBJ stast to the web interface",
    tags: ["sample", "gamba", "sbj"],
    dalamudApiLevel: 14,
    applicableVersion: "any",
    isHide: "False",
    isTestingExclusive: "False",
    loadRequiredState: 0,
    loadSync: false,
    canUnloadAsync: false,
    loadPriority: 0,
    punchline: "Automatically upload SBJ stast to the web interface",
    acceptsFeedback: true,
    icon: "https://serahill.net/img/bdrp.png"
  },
  {
    owner: "RayaSerahill",
    repo: "BetterDiscordRichpresence",
    author: "Raya Serahill",
    name: "BetterDiscordRichpresence",
    internalName: "BetterDiscordRichpresence",
    description: "Discord!",
    tags: ["Discord", "status", "Raya", "Serahill"],
    dalamudApiLevel: 14,
    applicableVersion: "any",
    isHide: "False",
    isTestingExclusive: "False",
    loadRequiredState: 0,
    loadSync: false,
    canUnloadAsync: false,
    loadPriority: 0,
    punchline: "Discord!",
    acceptsFeedback: true,
    icon: "https://serahill.net/img/simplestats.png"
  },
];

function normalizeVersion(tag: string) {
  return tag.replace(/^v/i, "");
}

async function buildProjectPayload(project: ProjectConfig) {
  const repoUrl = `https://github.com/${project.owner}/${project.repo}`;

  const res = await fetch(
    `https://api.github.com/repos/${project.owner}/${project.repo}/releases/latest`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    throw new Error(
      `Failed to fetch latest release for ${project.owner}/${project.repo} (${res.status})`
    );
  }

  const release = await res.json();

  const tag = typeof release.tag_name === "string" ? release.tag_name : "0.0.0";
  const version = normalizeVersion(tag);

  const zipAsset = Array.isArray(release.assets)
    ? release.assets.find(
      (asset: any) =>
        typeof asset?.name === "string" &&
        asset.name.toLowerCase().endsWith(".zip")
    )
    : null;

  const downloadUrl =
    zipAsset?.browser_download_url ||
    release.zipball_url ||
    `${repoUrl}/releases/download/${tag}/release.zip`;

  return {
    Author: project.author,
    Name: project.name,
    InternalName: project.internalName,
    AssemblyVersion: version,
    RepoUrl: repoUrl,
    Description: project.description,
    ApplicableVersion: project.applicableVersion ?? "any",
    Tags: project.tags,
    DalamudApiLevel: project.dalamudApiLevel,
    IsHide: project.isHide ?? "False",
    IsTestingExclusive: project.isTestingExclusive ?? "False",
    DownloadCount: 0,
    LastUpdate: release.published_at ? Date.parse(release.published_at) : 0,
    DownloadLinkInstall: downloadUrl,
    DownloadLinkTesting: downloadUrl,
    DownloadLinkUpdate: downloadUrl,
    LoadRequiredState: project.loadRequiredState ?? 0,
    LoadSync: project.loadSync ?? false,
    CanUnloadAsync: project.canUnloadAsync ?? false,
    LoadPriority: project.loadPriority ?? 0,
    Punchline: project.punchline ?? project.description,
    AcceptsFeedback: project.acceptsFeedback ?? true,
    IconUrl: project.icon ?? false,
  };
}

export async function GET() {
  try {
    const payload = await Promise.all(PROJECTS.map(buildProjectPayload));
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch releases from GitHub",
      },
      { status: 500 }
    );
  }
}