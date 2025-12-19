# Changelog

All notable changes to this project will be documented in this file.

## [1.7.0] - 2025-12-21
### Refactored
- **Architecture Overhaul**: Separated business logic from the UI.
  - Extracted repository management into `useRepoManager` hook.
  - Extracted deployment configuration and state into `useDeploymentManager` hook.
  - Created `services/storage.ts` to centralize LocalStorage operations and default configuration logic.
- **Codebase Cleanup**: Simplified `App.tsx` to serve purely as a view controller.

### Added
- **Screenshot Lightbox**: Added a full-screen image viewer (lightbox) for app screenshots in the details modal.
- **Configuration Template**: Renamed `.env.example` to `env.example` for better clarity on environment variable defaults.

### Fixed
- **Link Parsing**: Fixed an issue where external links (Source, Support, Website) were not being parsed or displayed correctly in the App Details modal.
- **Metadata Extraction**: Updated the parser to correctly extract `repo_url`, `support_url`, and other metadata fields from `config.json` and `compose` files.
- **Link Navigation**: Ensured all external links open in a new tab with proper security attributes.

## [1.6.0] - 2025-12-20
### Added
- **BigBear Script Integration**: Integrated advanced parsing logic from `convert-apps.sh` to handle complex metadata merging from `config.json`, `docker-compose.yml`, and `umbrel-app.yml`.
- **Extended Metadata Support**: Added support for architectures (amd64/arm64), YouTube previews, documentation links, and project URLs.
- **Improved Volume Translation**: Enhanced the script generator to automatically detect and translate CasaOS-specific volume paths (`/DATA/AppData/$AppID`) into clean, deployment-ready local paths.

### Changed
- **UI Density Optimization**: Moved the screenshot carousel into the main description column and adjusted its size to display ~2.5 images simultaneously for better visual context.
- **Layout Refinement**: Standardized top-alignment for the specifications sidebar and action buttons across all screen sizes.
- **Architecture Refactor**: Centralized all metadata and deployment interfaces into `types.ts` to ensure a structured and maintainable codebase.

### Improved
- **Metadata Fallback Logic**: Implemented a priority-based title and icon extraction system (CasaOS Metadata -> Config JSON -> Repository Defaults).

## [1.5.0] - 2025-12-19
### Added
- **24-Hour Repository Caching**: Implemented a local storage cache for app lists with automatic 24-hour expiration.
- **Auto-Sync on Startup**: The app now automatically refreshes repository data if the cache is stale or missing.
- **Security Validation**: Added a strict validation for Proxmox root passwords (minimum 5 characters) to prevent script generation errors.

### Fixed
- **LXC Script Reliability**: Overhauled the Docker installation logic in the Proxmox script to prevent hangs and handle unprivileged container constraints better.
- **Enhanced Port Mapping**: Improved detection for simple port strings (e.g., "3000") to ensure correct host-to-container mapping during conversion.
- **Password Quoting**: Fixed shell escaping for passwords containing special characters in generated scripts.

## [1.4.3] - 2025-12-18
### Added
- Created `CHANGELOG.md` to track project history.
- Updated versioning throughout the UI and metadata.

## [1.4.2] - 2025-12-17
### Fixed
- Resolved GitHub API rate-limiting issues by implementing the Recursive Tree API.
- Drastically reduced the number of API calls required to sync large repositories.
- Fixed volume path parsing error (`vol.replace is not a function`).

## [1.4.1] - 2025-12-16
### Added
- Global Deployment Defaults: Resources (CPU, RAM, Disk) and Network settings are now persisted in LocalStorage.
- New apps now inherit the last used configuration automatically.

## [1.4.0] - 2025-12-14
### Added
- Multi-source support: Added CasaOS Official, BigBearCasaOS, and Zimoos/UmbrelOS as primary sources.
- On-demand synchronization: Fetch app lists from remote GitHub repositories.
- Local persistence for repository lists and fetched app data.

## [1.3.0] - 2025-12-12
### Added
- Proxmox LXC Automated Installer: Generates a Bash script that creates an LXC, installs Docker, and deploys the stack.
- Support for unprivileged containers with nesting and keyctl features enabled.

## [1.2.0] - 2025-12-10
### Changed
- Refactored UI into a modular step-by-step wizard.
- Improved App Library with global search and repository filtering.
- Enhanced App Details modal with metadata (version, author, developer).

## [1.1.0] - 2025-12-09
### Added
- Support for custom YAML imports.
- Automatic detection of ports, volumes, and environment variables from pasted Docker Compose content.

## [1.0.0] - 2025-12-08
### Added
- Initial release.
- Basic CasaOS app conversion to clean Docker Compose.
- Support for environment variable overrides.