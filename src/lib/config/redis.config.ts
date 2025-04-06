import processConfig from './config.json';

export type Config = {
  port?: number;
  host?: string;
  password?: string;
};

class ConfigService {
  private readonly config: Config;

  constructor(config: Config = {}) {
    this.config = {
        port: config?.port ?? processConfig.DEFAULT_PORT,
        host: config?.host ?? processConfig.DEFAULT_HOST,
        password: config?.password,
    };
  }

  get host(): string {
    return this.config.host!;
  }

  get port(): number {
    return this.config.port!;
  }

  get password(): string | undefined {
    return this.config.password;
  }
}

export default ConfigService;
