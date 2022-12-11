import { FormBuilder } from '@rweich/streamdeck-formbuilder';
import { Streamdeck } from '@rweich/streamdeck-ts';

import { isSettings, Settings } from './Settings';

const pi = new Streamdeck().propertyinspector();
let builder: FormBuilder<Settings> | undefined;

pi.on('websocketOpen', ({ uuid }) => pi.getSettings(uuid)); // trigger the didReceiveSettings event

pi.on('didReceiveSettings', ({ settings }) => {
  if (builder === undefined) {
    const initialData: Settings = isSettings(settings) ? settings : { appAccessToken: '', fetchEvery: '10000', host: 'mastodon.social' };
    builder = new FormBuilder<Settings>(initialData);

    const host = builder.createInput().setLabel('Host').setPlaceholder('your instance host, ex: mastodon.social')
    const appAccessToken = builder.createInput().setLabel('App access token').setPlaceholder('your app access token')
    const fetchEvery = builder.createInput().setLabel('Fetch every (ms)').setPlaceholder('fetch notifications interval in ms')
    builder.addElement('host', host);
    builder.addElement('appAccessToken', appAccessToken);
    builder.addElement('fetchEvery', fetchEvery);

    builder.appendTo(document.querySelector('.sdpi-wrapper') ?? document.body);
    builder.on('change-settings', () => {
      if (pi.pluginUUID === undefined) {
        console.error('pi has no uuid! is it registered already?', pi.pluginUUID);
        return;
      }
      pi.setSettings(pi.pluginUUID, builder?.getFormData());
    });
  } else if (isSettings(settings)) {
    builder.setFormData(settings);
  }
});

export default pi;