import { DeploymentConfig } from '../types';

export interface NativeRecipe {
  id: string;
  name: string;
  osTemplate: string;
  installCommands: (config: DeploymentConfig) => string;
  postInstallMsg?: string | ((config: DeploymentConfig) => string);
}

/**
 * Generates a recipe that wraps an official Proxmox VE Community Script.
 * Source: https://github.com/community-scripts/ProxmoxVE
 */
export const getCommunityRecipe = (scriptName: string): NativeRecipe => {
  return {
    id: scriptName,
    name: `Community Script: ${scriptName}`,
    osTemplate: 'debian-12-standard',
    installCommands: (config) => {
      // We rely on the official 'install' script from the repo.
      // These scripts expect the 'build.func' functions to be sourced via STDIN from $FUNCTIONS_FILE_PATH
      // We mimic the environment that the host-side 'ct' script usually sets up.
      
      const installScriptUrl = `https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/install/${scriptName}-install.sh`;
      const buildFuncUrl = `https://raw.githubusercontent.com/community-scripts/ProxmoxVE/main/misc/build.func`;

      return `
# --- COMMUNITY SCRIPT WRAPPER ---
# This wrapper downloads and executes the official install script for ${scriptName}.

msg_info "Preparing Community Script environment..."
apt-get update >/dev/null
apt-get install -y curl wget >/dev/null

# 1. Download the common build functions
wget -qL "${buildFuncUrl}" -O /tmp/build.func

# 2. Read functions into variable (as expected by community scripts)
export FUNCTIONS_FILE_PATH=$(cat /tmp/build.func)

# 3. Download the specific application install script
msg_info "Downloading official install script: ${scriptName}-install.sh"
wget -qL "${installScriptUrl}" -O /tmp/install.sh

# 4. Execute the script
# We set DEBIAN_FRONTEND to noninteractive to suppress some prompts,
# though some community scripts might still try to use UI.
# The 'export FUNCTIONS_FILE_PATH' inside the bash call is critical.
chmod +x /tmp/install.sh
bash -c "export FUNCTIONS_FILE_PATH='$(cat /tmp/build.func)'; bash /tmp/install.sh"

# Cleanup
rm /tmp/build.func /tmp/install.sh
      `;
    },
    postInstallMsg: (config) => `Native installation of ${config.appName} (via Community Script) complete!`
  };
};
