# Uploading and publishing

The prepared repository assumes **proczdev/SunsetPaint**, branch **main**. If you choose another name, update `package.json`, `website/config.js`, and the repository links in these Markdown files.

## 1. Put the source on GitHub

Create an empty repository named `SunsetPaint` under `Procz8Fox`. Do not initialize it with another README or license if you use the commands below.

From this source folder, with Git installed:

```powershell
git init -b main
git add .
git commit -m "Initial release of Sunset Paint"
git remote add origin https://github.com/proczdev/SunsetPaint.git
git push -u origin main
```

You can instead upload the folder contents through GitHub's web interface. Include the hidden `.github` folder and `.gitignore`. Do not nest all files under another `SunsetPaint-GitHub/` directory: `package.json` and `README.md` belong at repository root. The supplied zip has that root layout.

No dependency directory, user recovery, logs, credentials, or compiled app is included. Installers belong in Releases; do not commit them as source.

## 2. Make the download link live

The website download buttons use:

```text
https://github.com/proczdev/SunsetPaint/releases/latest/download/Sunset-Paint-Setup.exe
```

Publish a non-prerelease GitHub Release and attach a file named exactly **Sunset-Paint-Setup.exe**. The stable filename lets the same website URL work across future versions.

### Build locally

Run `npm ci` and `npm run build` on Windows. Attach `release/Sunset-Paint-Setup.exe` to your release. Update the package version and website version for later releases, and include a SHA-256 checksum if desired.

### Or use the included Windows workflow

Push a version tag that matches `package.json`:

```powershell
git tag v1.0.0
git push origin v1.0.0
```

The Windows workflow builds an installer and checksum, saves a downloadable Actions artifact, and creates a **draft** release. Review and publish the draft in GitHub. A draft does not activate the public download link. A manual workflow run creates an Actions artifact without creating a release.

The workflow uses GitHub's repository-scoped token; no personal token or signing certificate is needed. It does not automatically publish the release.

## 3. Host the website on GitHub Pages

1. Open repository Settings → Pages and choose **GitHub Actions** as the source.
2. Open Actions → **Website (GitHub Pages)** → **Run workflow** on `main`.
3. Open the page URL returned by the deployment. For this repository it is normally `https://proczdev.github.io/SunsetPaintWebsite/`.

All CSS, scripts, images, and the example project use relative paths, so the site works under the `/SunsetPaint/` prefix. The workflow is manual to avoid a failing Pages deployment before you've enabled Pages. You can add a `push` trigger later if you want automatic updates.

Any static host can also serve the contents of `website/` directly, without npm install or a build. A separate Sites preview may be provided with this handoff; it does not create your GitHub repository or publish a GitHub Release.

## 4. Before a release

- Set the intended version in `package.json`, refresh the lockfile with npm, and update `website/config.js`.
- Check the installer and project roundtrip on Windows. Keep Electron's bundled dependency license notices.
- Verify the `.exe` asset is named `Sunset-Paint-Setup.exe` and attached to a published release marked as latest.
- Follow the website GitHub/download links after publication. They cannot be verified as live before the repository and release exist.

Official references: [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [GitHub CLI release creation](https://cli.github.com/manual/gh_release_create), [MIT license](https://opensource.org/license/mit).
