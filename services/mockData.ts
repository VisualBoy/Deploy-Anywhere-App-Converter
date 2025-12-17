import { AppDefinition, Repo } from '../types';

const COMMON_COMPOSE_PLEX = `version: "3"
services:
  plex:
    image: linuxserver/plex:latest
    container_name: plex
    network_mode: host
    environment:
      - PUID=1000
      - PGID=1000
      - VERSION=docker
    volumes:
      - /DATA/AppData/plex/config:/config
      - /DATA/Media/tv:/tv
      - /DATA/Media/movies:/movies
    restart: unless-stopped
    x-casaos:
      architectures:
        - amd64
        - arm64
      main: plex`;

const COMMON_COMPOSE_HA = `version: "3"
services:
  homeassistant:
    container_name: homeassistant
    image: "ghcr.io/home-assistant/home-assistant:stable"
    volumes:
      - /DATA/AppData/homeassistant:/config
      - /etc/localtime:/etc/localtime:ro
    restart: unless-stopped
    privileged: true
    network_mode: host
    x-casaos:
      main: homeassistant`;

const COMMON_COMPOSE_NEXTCLOUD = `version: '2'
services:
  db:
    image: mariadb:10.5
    restart: always
    command: --transaction-isolation=READ-COMMITTED --binlog-format=ROW
    volumes:
      - /DATA/AppData/nextcloud/db:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_PASSWORD=password
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud

  app:
    image: nextcloud
    restart: always
    ports:
      - 8080:80
    links:
      - db
    volumes:
      - /DATA/AppData/nextcloud/html:/var/www/html
    environment:
      - MYSQL_PASSWORD=password
      - MYSQL_DATABASE=nextcloud
      - MYSQL_USER=nextcloud
      - MYSQL_HOST=db
    x-casaos:
      main: app
      title:
        en_us: Nextcloud`;

export const REPOSITORIES: Repo[] = [
  {
    id: 'bigbear',
    name: 'BigBearCasaOS',
    url: 'https://github.com/bigbeartechworld/big-bear-casaos',
    apps: [
      {
        id: 'plex',
        name: 'Plex Media Server',
        description: 'Organizes video, music and photos from personal media libraries.',
        image: 'https://picsum.photos/seed/plex/200/200',
        category: 'Media',
        compose: COMMON_COMPOSE_PLEX,
        port_map: "32400:32400"
      },
      {
        id: 'homeassistant',
        name: 'Home Assistant',
        description: 'Open source home automation that puts local control and privacy first.',
        image: 'https://picsum.photos/seed/hass/200/200',
        category: 'Automation',
        compose: COMMON_COMPOSE_HA
      }
    ]
  },
  {
    id: 'casaos',
    name: 'CasaOS Official',
    url: 'https://github.com/IceWhaleTech/CasaOS-AppStore',
    apps: [
      {
        id: 'nextcloud',
        name: 'Nextcloud',
        description: 'The self-hosted productivity platform that keeps you in control.',
        image: 'https://picsum.photos/seed/nextcloud/200/200',
        category: 'Productivity',
        compose: COMMON_COMPOSE_NEXTCLOUD,
        port_map: "8080:80"
      },
      {
        id: 'jellyfin',
        name: 'Jellyfin',
        description: 'The Free Software Media System. No strings attached.',
        image: 'https://picsum.photos/seed/jellyfin/200/200',
        category: 'Media',
        compose: `version: "3.5"
services:
  jellyfin:
    image: jellyfin/jellyfin
    container_name: jellyfin
    network_mode: "host"
    volumes:
      - /DATA/AppData/jellyfin/config:/config
      - /DATA/AppData/jellyfin/cache:/cache
    restart: "unless-stopped"
    x-casaos:
      main: jellyfin`,
        port_map: "8096:8096"
      }
    ]
  },
  {
    id: 'zimoos',
    name: 'Zimoos Repository',
    url: 'https://github.com/zimoos/zimoos-repo',
    apps: [
      {
        id: 'filebrowser',
        name: 'File Browser',
        description: 'Web File Browser which can be used as a middleware for other apps.',
        image: 'https://picsum.photos/seed/filebrowser/200/200',
        category: 'Utilities',
        compose: `version: "3"
services:
  filebrowser:
    image: filebrowser/filebrowser
    container_name: filebrowser
    volumes:
      - /DATA/AppData/filebrowser/root:/srv
      - /DATA/AppData/filebrowser/db/filebrowser.db:/database.db
    ports:
      - 8081:80
    restart: unless-stopped`,
        port_map: "8081:80"
      }
    ]
  }
];