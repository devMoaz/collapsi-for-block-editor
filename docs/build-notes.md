# Build notes — dist zip for wp.org and Playground

## Why this exists

PowerShell's `Compress-Archive` and .NET's `ZipFile.CreateFromDirectory` write **backslash (`\`)** path separators in zip entry names when run on Windows. The ZIP spec (PKZip APPNOTE 4.4.17.1) requires **forward slashes (`/`)**. Windows extractors auto-tolerate the wrong separator; Linux PHP (`ZipArchive::extractTo`) does not — it treats `\` as a legal character in filenames and creates files literally named `"build\editor.js"` instead of `build/editor.js` in a `build/` folder.

Symptom if you miss this: the zip installs and runs fine on local Windows WordPress, but **fails to activate on wp.org's Linux servers and on WordPress Playground** with a silent PHP fatal (Playground reports `exit code 255` with empty stdout/stderr).

The script below builds the zip with a manual `ZipArchive` loop that explicitly replaces backslashes with forward slashes in every entry name.

It also publishes **two** zip filenames because WordPress Playground's `installPlugin` step (with `resource: "url"`) derives the plugin slug from the zip filename — so the Playground zip must be named exactly `<slug>.zip` (no version suffix), while wp.org wants `<slug>-<version>.zip` for the human-facing artifact.

## Prerequisites

Before running this script:

1. All six gates pass clean:
   ```powershell
   composer run phpcs
   composer run phpstan
   npm run lint:js
   npm run lint:css
   npm test
   npm run build
   ```
2. The POT file at `languages/collapsi-for-block-editor.pot` is up to date (`npm run makepot`).
3. Working tree is clean (`git status`).

## The build script

Run from the plugin folder root (`wp-content/plugins/collapsi-for-block-editor/`):

```powershell
Set-Location 'E:\projects\block-collapser\wp-content\plugins\collapsi-for-block-editor'

# 1. Clean dist/ — explicit paths only, never use Remove-Item with wildcards in scripts
if (Test-Path 'dist\collapsi-for-block-editor-1.0.0.zip') {
    Remove-Item 'dist\collapsi-for-block-editor-1.0.0.zip' -Force
}
if (Test-Path 'dist\collapsi-for-block-editor.zip') {
    Remove-Item 'dist\collapsi-for-block-editor.zip' -Force
}
if (-not (Test-Path 'dist')) {
    New-Item -ItemType Directory dist | Out-Null
}

# 2. Stage runtime files in a temp folder (FLAT — no top-level plugin folder).
#    Playground extracts the zip's contents directly into a folder named after
#    the zip filename, so the zip MUST be flat at root.
$stage = "$env:TEMP\cfb-flat"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory $stage | Out-Null

Copy-Item 'collapsi-for-block-editor.php' $stage
Copy-Item 'readme.txt' $stage
Copy-Item 'uninstall.php' $stage
Copy-Item 'LICENSE' $stage
# NOTE: do NOT copy package.json into the dist zip for v1.0.1+. It is a
# dev-only Node manifest with zero runtime function in a shipped plugin.
# v1.0.0 shipped it by accident — wp.org docs explicitly say "production-
# ready: without development tools." Future releases drop it.
Copy-Item 'build' "$stage\build" -Recurse
Copy-Item 'includes' "$stage\includes" -Recurse
Copy-Item 'languages' "$stage\languages" -Recurse

# 3. Build the zip MANUALLY with forward-slash entry names.
#    DO NOT use Compress-Archive or [ZipFile]::CreateFromDirectory — both
#    write backslash separators on Windows.
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$versioned   = "$pwd\dist\collapsi-for-block-editor-1.0.0.zip"
$unversioned = "$pwd\dist\collapsi-for-block-editor.zip"

$bs = [char]0x5C  # backslash
$fs = [char]0x2F  # forward slash

$file = [System.IO.File]::Open($versioned, [System.IO.FileMode]::Create)
$archive = New-Object System.IO.Compression.ZipArchive(
    $file, [System.IO.Compression.ZipArchiveMode]::Create
)
try {
    $stageLen = $stage.Length
    Get-ChildItem $stage -Recurse -File | ForEach-Object {
        $relative = $_.FullName.Substring($stageLen + 1).Replace($bs, $fs)
        $entry = $archive.CreateEntry(
            $relative,
            [System.IO.Compression.CompressionLevel]::Optimal
        )
        $entryStream = $entry.Open()
        $fileStream = [System.IO.File]::OpenRead($_.FullName)
        $fileStream.CopyTo($entryStream)
        $fileStream.Close()
        $entryStream.Close()
    }
} finally {
    $archive.Dispose()
    $file.Close()
}

# 4. Duplicate the versioned zip as the unversioned Playground copy.
Copy-Item $versioned $unversioned -Force

# 5. Verify forward-slash separators (sanity check).
$check = [System.IO.Compression.ZipFile]::OpenRead($versioned)
$badEntries = $check.Entries | Where-Object { $_.FullName.Contains($bs) }
$check.Dispose()
if ($badEntries) {
    Write-Error "ZIP HAS BACKSLASH ENTRIES — build is broken. Investigate."
    $badEntries | ForEach-Object { Write-Host $_.FullName }
} else {
    Write-Host "OK: all entries use forward slashes." -ForegroundColor Green
}

# 6. Report.
Get-Item $versioned, $unversioned | Format-Table Name, Length
Get-FileHash $versioned -Algorithm SHA256 | Select-Object Hash
```

## After building

```powershell
# Upload both zips to the GitHub Release as assets
gh release upload v1.0.0 dist/collapsi-for-block-editor-1.0.0.zip dist/collapsi-for-block-editor.zip --clobber
```

The unversioned zip is consumed by `_playground/blueprint.json` for the Playground demo. The versioned zip is what you upload at https://wordpress.org/plugins/developers/add/.

## How to recognize the backslash bug if it happens again

- **Playground:** Blueprint step #3 (`installPlugin`) fails with `PHP.run() failed with exit code 255` and empty stdout/stderr. No useful error message.
- **wp.org:** The reviewer reports "Plugin does not activate" or returns a `Plugin file does not exist` error from `Plugin_Upgrader::install`.
- **Local Windows WP:** Plugin works fine. This is a false positive — Windows tolerates the wrong separator. ALWAYS test on Linux or Playground before declaring victory.

## Sanity test before uploading to wp.org

The Playground link is the cheapest end-to-end test:

```
https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/devMoaz/collapsi-for-block-editor/main/_playground/blueprint.json
```

If Playground loads the plugin and shows the demo post, the zip is structurally sound for any Linux WordPress install. If Playground fails, the wp.org reviewer will also fail. Do not upload until Playground succeeds.
