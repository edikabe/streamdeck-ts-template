import { Streamdeck } from '@rweich/streamdeck-ts';
import { MastodonClient } from './MastodonClient';
import PluginLoggerDelegate from './PluginLoggerDelegate';
import { isSettings, Settings } from './Settings';

const plugin = new Streamdeck().plugin();
let mastodonClient: MastodonClient | undefined;
let context: string | undefined;

const WAIT_A_SEC = '⏳ wait\na sec..';
const CHECK_YOUR_CONGIF_MSG = 'Mastodon\nUnread notifs\ncheck your\nconfig';

let settings: Settings = {
  host: '',
  appAccessToken: '',
  fetchEvery: '',
};

plugin.on('willAppear', (event) => {
  plugin.logMessage('Plugin:willAppear: getSettings');
  plugin.getSettings(event.context);
  context = event.context;
  if (isSettings(settings)) {
    plugin.logMessage('Plugin:willAppear: settings are valid!');
    plugin.setTitle(WAIT_A_SEC, context);
  } else {
    plugin.logMessage('Plugin:willAppear: settings are not valid...');
    plugin.setTitle(CHECK_YOUR_CONGIF_MSG, context);
  }
});

function loadBackgroundWithInstanceIcon(instanceHost: string, context: string, numberOfUnreadNotifications?: number): void {
  plugin.logMessage(`Plugin:loadBackgroundWithInstanceIcon: from host -> ${instanceHost}, nbOfUnread: ${numberOfUnreadNotifications ? numberOfUnreadNotifications : 'n/a'}`);
  const image = new Image();
  image.addEventListener('load', () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const canvasContext = canvas.getContext('2d')
    if (canvasContext) {
      canvasContext.clearRect(0, 0, canvas.width, canvas.height);
      canvasContext.drawImage(image, 0, 0);
      if (numberOfUnreadNotifications || numberOfUnreadNotifications === 0) {
        const circle = {
          x: canvas.width - 14,
          y: canvas.width - 14,
          radius: 10
        }
        // canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        canvasContext.beginPath();
        canvasContext.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
        canvasContext.fillStyle = "red";
        canvasContext.fill();
        canvasContext.font = "normal small-caps bold 13px arial";
        canvasContext.fillStyle = "white";
        canvasContext.fillText(numberOfUnreadNotifications.toString(), circle.x - (numberOfUnreadNotifications.toString().length > 1 ? 8 : 4), circle.y + 5);
        plugin.setImage(canvas.toDataURL('image/png'), context);
      }
    }
  });
  image.src = `https://${instanceHost}/favicon.ico`;
}

plugin.on('didReceiveSettings', (event) => {
  plugin.logMessage('Plugin:didReceiveSettings: ' + JSON.stringify({ ...event.settings as object, appAccessToken: 'xxxxxxxxxxxx' }));

  if (isSettings(event.settings)) {
    plugin.logMessage('Plugin:didReceiveSettings: Settings are ok!! will launch polling...');

    // store globally as it's need for opening browser with the configured host url...
    settings = event.settings;

    loadBackgroundWithInstanceIcon(settings.host, context!!);

    // stoping previous polling...
    if (mastodonClient) {
      mastodonClient.stopPolling();
    }

    // create a new client
    mastodonClient = new MastodonClient({
      host: settings.host,
      fetchEvery: parseInt(settings.fetchEvery),
      accessToken: settings.appAccessToken
    }, new PluginLoggerDelegate(plugin));

    // then start polling for notifications..
    mastodonClient.startPolling((success, err) => {
      if (success) {
        plugin.setTitle('', context!!);
        loadBackgroundWithInstanceIcon(settings.host, context!!, success.numberOfUnreadNotifications);
      } else {
        plugin.setTitle(CHECK_YOUR_CONGIF_MSG, context!!);
        plugin.logMessage(`Plugin:didReceiveSettings: Something went wrong: ${err?.message}`);
        plugin.logMessage(err?.error);
      }
    });

  } else {
    plugin.logMessage('Plugin:didReceiveSettings: Something is wrong with your config, maybe some fields are not filled up..');
    // draw default mastodon icon..
    plugin.logMessage('Plugin:didReceiveSettings: Loading mastodon.social background image..');
    loadBackgroundWithInstanceIcon('mastodon.social', context!!);
    plugin.setTitle(CHECK_YOUR_CONGIF_MSG, context!!);
  }

});

plugin.on("keyUp", (e) => {
  plugin.logMessage('Plugin:keyUp: Opening mastodon instance in browser');
  plugin.openUrl(`https://${settings.host}/notifications`);
})

export default plugin;
