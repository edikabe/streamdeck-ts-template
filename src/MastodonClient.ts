import axios from 'axios';
import PluginLoggerDelegate from './PluginLoggerDelegate';

export interface MastodonClientProps {
    host: string;
    accessToken: string;
    fetchEvery: number;
}

interface GetMarkersApiResponse {
    notifications: LastReadNotification
}

interface LastReadNotification {
    "last_read_id": number;
    version: number;
    "updated_at": string;
}

export interface PollingResult {
    numberOfUnreadNotifications: number;
}

export interface PollingError {
    message: string;
    error: any;

}

export class MastodonClient {
    private props: MastodonClientProps;
    private lastReadId: string | undefined;
    private fetchInterval: number | undefined;
    private logger: PluginLoggerDelegate | undefined;
    constructor(value: MastodonClientProps, logger?: PluginLoggerDelegate) {
        this.props = value;
        axios.defaults.baseURL = `https://${this.props.host}/api/v1`
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.props.accessToken}`;
        axios.defaults.headers.common['Accept'] = 'application/json';
        if (logger) {
            this.logger = logger;
        }
    }

    private async fetchLastReadNotification(): Promise<LastReadNotification> {
        const { data, status } = await axios.get<GetMarkersApiResponse>('/markers?timeline[]=notifications');
        this.logMessage(`MastodonClient:fetchLastReadNotification`);
        this.logMessage(`MastodonClient:fetchLastReadNotification: status: ${JSON.stringify(status)}`);
        this.logMessage(`MastodonClient:fetchLastReadNotification: data: ${JSON.stringify(data)}`);
        return data.notifications;
    }

    private async fetchUnreadNotificationsCount(sinceLastReadId: number): Promise<number> {
        const { data, status } = await axios.get<Array<any>>('/notifications', { params: { "since_id": sinceLastReadId } });
        this.logMessage(`MastodonClient:fetchUnreadNotificationsCount: with since_id:${sinceLastReadId}`);
        this.logMessage(`MastodonClient:fetchUnreadNotificationsCount: status: ${JSON.stringify(status)}`);
        this.logMessage(`MastodonClient:fetchUnreadNotificationsCount: data: ${JSON.stringify(data)}`);
        return data.length;
    }

    private logMessage(message: string) {
        if (this.logger) {
            this.logger.logMessage(message);
        }
    }

    private async fetchCount(cb: (success?: PollingResult, error?: PollingError) => void) {
        try {
            const lastReadNotification = await this.fetchLastReadNotification();
            const numberOfUnread = await this.fetchUnreadNotificationsCount(lastReadNotification.last_read_id);
            this.logMessage(`MastodonClient:fetchCount: nbOfUnread: ${numberOfUnread}`);
            cb({ numberOfUnreadNotifications: numberOfUnread });
        } catch (e) {
            this.logMessage(`MastodonClient:fetchCount: Oh no..something when wrong: ${e}`);
            cb(undefined, { message: "unable to fetch notifications, check config", error: e });
        }
    }

    async startPolling(cb: (success?: PollingResult, error?: PollingError) => void) {
        // first fetch...
        this.logMessage('MastodoClient:startPolling: Immediate first notifs fetching...');
        await this.fetchCount(cb);
        // then fetch by interval
        this.logMessage(`MastodoClient:startPolling: Next fetches will happen every ${this.props.fetchEvery}ms...`);
        this.fetchInterval = window.setInterval(async () => {
            this.fetchCount(cb);
        }, this.props.fetchEvery);
    }

    stopPolling() {
        if (this.fetchInterval) {
            this.logMessage('MastodoClient:stopPolling:');
            window.clearInterval(this.fetchInterval);
        }
    }
}