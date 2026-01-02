import { DeploymentConfig } from '../types';
import { getCommunityRecipe, NativeRecipe } from './recipes';
import yaml from 'js-yaml';

/**
 * Cleans the Compose file by removing CasaOS specific metadata and applying UI overrides.
 */
export const cleanComposeContent = (rawYaml: string, config: DeploymentConfig): { yaml: string, volumes: string[] } => {
  try {
    const doc = yaml.load(rawYaml) as any;
    const extractedVolumes: string[] = [];

    if (!doc || !doc.services) return { yaml: rawYaml, volumes: [] };

    if (doc['x-casaos']) delete doc['x-casaos'];

    let mainServiceName = Object.keys(doc.services)[0];
    
    for (const serviceName in doc.services) {
      const service = doc.services[serviceName];

      if (service['x-casaos']) delete service['x-casaos'];

      if (config.envVars && Object.keys(config.envVars).length > 0) {
        if (Array.isArray(service.environment)) {
            const envObj: Record<string, string> = {};
            service.environment.forEach((e: string) => {
                const parts = e.split('=');
                if (parts.length >= 2) envObj[parts[0]] = parts.slice(1).join('=');
            });
            service.environment = { ...envObj, ...config.envVars };
        } else {
            service.environment = { ...(service.environment || {}), ...config.envVars };
        }
      }

      if (service.volumes && Array.isArray(service.volumes)) {
        service.volumes = service.volumes.map((vol: any) => {
           let finalVol = vol;
           let hostPath = '';

           if (typeof vol === 'string') {
               finalVol = vol.replace(/\/DATA\/AppData\/[^/]+/g, './data');
               hostPath = finalVol.split(':')[0];
           } else if (typeof vol === 'object' && vol !== null) {
               if (vol.source && typeof vol.source === 'string') {
                   vol.source = vol.source.replace(/\/DATA\/AppData\/[^/]+/g, './data');
                   hostPath = vol.source;
               }
               finalVol = vol;
           }

           if (hostPath && (hostPath.startsWith('/') || hostPath.startsWith('./'))) {
               extractedVolumes.push(hostPath);
           }
           
           return finalVol;
        });
      }
      
      if (serviceName === mainServiceName && config.hostPort && config.containerPort) {
          service.ports = [`${config.hostPort}:${config.containerPort}`];
      } else if (service.ports && Array.isArray(service.ports)) {
          service.ports = service.ports.map((p: any) => p.toString());
      }
    }

    return { 
        yaml: yaml.dump(doc, { lineWidth: -1, noRefs: true, quotingType: '"' }),
        volumes: [...new Set(extractedVolumes)]
    };
  } catch (e) {
    console.error("Error parsing YAML:", e);
    return { yaml: rawYaml, volumes: [] };
  }
};

export const generateExecutionCommand = (scriptContent: string): string => {
    // UTF-8 safe base64 encoding
    const encoded = btoa(unescape(encodeURIComponent(scriptContent)));
    return `echo "${encoded}" | base64 -d | bash`;
};

/**
 * GENERATOR STRATEGY:
 * 1. Check if a Community Script was matched (config.communityScript).
 * 2. If yes, generate a Native Script utilizing that official script.
 * 3. If no, fallback to Docker Script.
 */
export const generateProxmoxScript = (config: DeploymentConfig): string => {
  // Determine if we are using a Native Recipe (Community Script)
  const nativeRecipe: NativeRecipe | null = config.communityScript 
    ? getCommunityRecipe(config.communityScript) 
    : null;
  
  // -- HOST CONFIGURATION --
  const hostname = config.appId;
  const password = (config.password || 'password').replace(/'/g, "'\\''");
  
  let netConfig = `name=eth0,bridge=${config.bridge},ip=dhcp`;
  if (!config.useDhcp && config.staticIp) {
      netConfig = `name=eth0,bridge=${config.bridge},ip=${config.staticIp}`;
      if (config.gateway) {
          netConfig += `,gw=${config.gateway}`;
      }
  }

  const osTemplate = nativeRecipe ? nativeRecipe.osTemplate : 'debian-12-standard';

  const hostSetupBlock = `
APP_ID="${config.appId}"
HOSTNAME="${hostname}"
PASSWORD='${password}'
DISK_SIZE="${config.diskSize}"
CPU_CORES="${config.cpuCores}"
RAM_SIZE="${config.ramSize}"
STORAGE="${config.storagePool}"
TEMPLATE_SEARCH="${osTemplate}"
CTID="${config.ctId}"

YW='\\e[1;33m'
GN='\\e[0;32m'
RD='\\e[0;31m'
CL='\\e[0m'

function msg_info() { echo -e "\${YW}[INFO] \${1}\${CL}"; }
function msg_ok() { echo -e "\${GN}[OK] \${1}\${CL}"; }
function msg_err() { echo -e "\${RD}[ERROR] \${1}\${CL}"; }

msg_info "Starting Automated Installation for ${config.appName}..."
${nativeRecipe ? `msg_info "Using Official Community Script: ${nativeRecipe.name}"` : `msg_info "No Native Recipe found. Using Docker Fallback."`}

TEMPLATE_VOL=$(pveam available -section system | grep "\$TEMPLATE_SEARCH" | head -n 1 | awk '{print $2}')
if [ -z "$TEMPLATE_VOL" ]; then
    msg_err "Template \$TEMPLATE_SEARCH not found."
    exit 1
fi

if ! pveam list local | grep -q "\$TEMPLATE_VOL"; then
    pveam download local \$TEMPLATE_VOL
fi
TEMPLATE="local:vztmpl/\$TEMPLATE_VOL"

if pct status \$CTID &>/dev/null; then
    msg_err "Container ID \$CTID is already in use."
    exit 1
fi

pct create \$CTID \$TEMPLATE \\
    --arch amd64 \\
    --hostname \$HOSTNAME \\
    --cores \$CPU_CORES \\
    --memory \$RAM_SIZE \\
    --swap 512 \\
    --storage \$STORAGE \\
    --password "\$PASSWORD" \\
    --rootfs volume=\$STORAGE:\${DISK_SIZE} \\
    --net0 ${netConfig} \\
    --unprivileged 1 \\
    --features nesting=1,keyctl=1 \\
    --onboot 1

pct start \$CTID
msg_info "Waiting for network connectivity..."
lxc-attach -n \$CTID -- bash -c "for i in {1..50}; do ping -c1 8.8.8.8 &>/dev/null && break; sleep 1; done"
`;

  // -- INNER SCRIPT GENERATION --
  let innerScriptContent = '';
  let finalMessage = '';

  if (nativeRecipe) {
      // --- NATIVE RECIPE PATH (COMMUNITY SCRIPT) ---
      innerScriptContent = `
#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

function msg_info() { echo -e "\\e[1;33m[INFO] \\e[0m\${1}"; }

${nativeRecipe.installCommands(config)}
`;
      const msg = nativeRecipe.postInstallMsg;
      finalMessage = (typeof msg === 'function' ? msg(config) : msg) || `Native installation of ${config.appName} complete!`;

  } else {
      // --- DOCKER FALLBACK PATH ---
      const { yaml: cleanedYaml, volumes } = cleanComposeContent(config.composeContent, config);
      const safeYaml = cleanedYaml.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`');
      
      const volumeCreationCmds = volumes.map(v => {
        if (v.startsWith('./')) {
            return `mkdir -p "/opt/${config.appId}/${v.substring(2)}"`;
        }
        return `mkdir -p "${v}"`;
      }).join('\n');

      const secretKeywords = ['PASSWORD', 'SECRET', 'KEY', 'TOKEN', 'AUTH'];
      const autoGenKeys: string[] = [];
      const modifiedConfig = { ...config, envVars: { ...config.envVars } };

      Object.entries(modifiedConfig.envVars).forEach(([key, value]) => {
          if (secretKeywords.some(k => key.toUpperCase().includes(k)) && (!value || value.toLowerCase() === 'auto')) {
              autoGenKeys.push(key);
          }
      });

      let secretGenerationScript = "";
      if (autoGenKeys.length > 0) {
          secretGenerationScript += `
echo "# Auto-generated credentials" > /opt/${config.appId}/install_details.conf
`;
          autoGenKeys.forEach(key => {
              const bashVarName = `GEN_${key.replace(/[^a-zA-Z0-9]/g, '_')}`;
              secretGenerationScript += `${bashVarName}=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9')\n`;
              secretGenerationScript += `sed -i "s|__AUTO_GEN_${key}__|$\{${bashVarName}\}|g" docker-compose.yml\n`;
              secretGenerationScript += `echo "${key}=$\{${bashVarName}\}" >> /opt/${config.appId}/install_details.conf\n`;
          });
      }

      innerScriptContent = `
#!/bin/bash
set -e
export DEBIAN_FRONTEND=noninteractive

apt-get update -qq
apt-get install -y -qq curl git ca-certificates gnupg lsb-release jq iptables openssl

if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
fi

systemctl enable --now docker || true

mkdir -p /opt/\$APP_ID
cd /opt/\$APP_ID
${volumeCreationCmds}

cat <<'YML' > docker-compose.yml
${safeYaml}
YML

${secretGenerationScript}

docker compose up -d
`;
      finalMessage = `Docker deployment complete! URL: http://\${IP}:${config.hostPort}`;
  }

  // -- FINAL ASSEMBLY --
  return `#!/usr/bin/env bash
set -e
${hostSetupBlock}

lxc-attach -n \$CTID -- bash -c "cat <<'EOF' > /tmp/install_internal.sh
${innerScriptContent}
EOF
"

lxc-attach -n \$CTID -- bash /tmp/install_internal.sh

IP=\$(pct exec \$CTID -- ip a s dev eth0 | awk '/inet / {print \$2}' | cut -d/ -f1)

msg_ok "${finalMessage}"
echo -e " IP Address: \${IP}"
`;
};

export const generateStackFile = (config: DeploymentConfig): string => {
  return cleanComposeContent(config.composeContent, config).yaml;
};