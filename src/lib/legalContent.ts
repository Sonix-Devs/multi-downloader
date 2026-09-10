export interface LegalSection {
  heading: string;
  body: string[];
}

export interface LegalDocument {
  id: "privacy" | "terms" | "cookies";
  title: string;
  updated: string;
  sections: LegalSection[];
}

export const LEGAL_DOCUMENTS: LegalDocument[] = [
  {
    id: "privacy",
    title: "Privacy Policy",
    updated: "Last updated: 2026",
    sections: [
      {
        heading: "What we process",
        body: [
          "Multi Downloader processes the URLs you paste in order to fetch public metadata (title, thumbnail, duration, formats) via yt-dlp and to download the corresponding media file to your chosen folder.",
          "We store a local history of your downloads (URL, title, thumbnail, status, file path) so you can find files again. This history stays on the machine running the app and is never transmitted to a third-party analytics service.",
        ],
      },
      {
        heading: "What we don't do",
        body: [
          "We do not sell, rent, or share your download history or clipboard contents with anyone.",
          "We do not require an account, email address, or payment information to use the app.",
          "Clipboard access is read-only, opt-in via Settings, and only used to suggest pasting a link you already copied — nothing is uploaded.",
        ],
      },
      {
        heading: "Third-party requests",
        body: [
          "To fetch metadata and media, the app's backend (yt-dlp) contacts the platform the link belongs to (e.g. YouTube, TikTok). Those platforms may log the request per their own privacy policies — we don't control that.",
        ],
      },
    ],
  },
  {
    id: "terms",
    title: "Terms of Use",
    updated: "Last updated: 2026",
    sections: [
      {
        heading: "Your responsibility",
        body: [
          "Multi Downloader is a general-purpose tool for saving media you have the right to download — for example your own uploads, content licensed for reuse, or content whose creator has given permission.",
          "You are solely responsible for ensuring your use of downloaded content complies with the source platform's Terms of Service and applicable copyright law in your jurisdiction.",
        ],
      },
      {
        heading: "No warranty",
        body: [
          "The app is provided \"as is\". Extraction depends on third-party sites and libraries (yt-dlp, ffmpeg) that can change without notice; we can't guarantee every link will always work.",
        ],
      },
      {
        heading: "Acceptable use",
        body: [
          "Do not use this app to circumvent DRM, infringe intellectual property rights, or violate a platform's Terms of Service. We reserve the right to disable features that are being used for clearly abusive purposes.",
        ],
      },
    ],
  },
  {
    id: "cookies",
    title: "Cookies & Local Storage",
    updated: "Last updated: 2026",
    sections: [
      {
        heading: "No tracking cookies",
        body: [
          "Multi Downloader does not use advertising or analytics cookies. There are no third-party trackers embedded in the app.",
        ],
      },
      {
        heading: "Functional storage only",
        body: [
          "The app persists your preferences (theme, default save folder, default quality) and download history in a local database so the app remembers your setup between sessions. This data never leaves your machine.",
        ],
      },
    ],
  },
];
