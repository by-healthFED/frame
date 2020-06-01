/*
 * By-Health Front-end Team (https://www.by-health.com/)
 *
 * Copyright © 2016-present By-Health Co Ltd. All rights reserved.
 */
import { Channel } from './channel';
import { createRegexp } from './whitelist';

interface ClientConfig {
  allowedOrigins?: string[];
  autoHeight?: boolean;
}

class Client {
  private _channel: Channel;
  private _targetWindow: Window;
  private _allowedOrigins: RegExp;
  private _prevHeight?: number;

  constructor(config?: ClientConfig) {
    this._channel = new Channel(this._sendMessage);
    this._targetWindow = this._findParentWindow();
    this._allowedOrigins = createRegexp(config?.allowedOrigins || []);

    if (config?.autoHeight) {
      this._autoHeight();
    }
  }

  private _findParentWindow() {
    if (window.parent !== window) {
      return window.parent;
    } else if (window.opener) {
      return window.opener;
    }
  }

  private _autoHeight() {
    let timer: any;
    this._channel.on('ready', () => {
      timer = setInterval(this.resize, 100);
    });
    this._channel.on('disconnected', () => {
      clearInterval(timer);
    });
  }

  private _sendMessage = (message: string) => {
    this._targetWindow.postMessage(message, '*');
  };

  private _receiveMessage = (event: MessageEvent) => {
    if (!this._allowedOrigins.test(event.origin)) {
      return;
    }

    this._channel.receiveMessage(event.data);
  };

  public connect() {
    window.addEventListener('message', this._receiveMessage);
    this._channel.connect();
  }

  public disconnect() {
    window.removeEventListener('message', this._receiveMessage);
    this._channel.disconnect();
  }

  public on(event: string, fn: (...args: any[]) => void, context?: any) {
    this._channel.on(event, fn, context);
  }

  public off(event: string, fn: (...args: any[]) => void, context?: any) {
    this._channel.off(event, fn, context);
  }

  public emit(event: string, data?: any) {
    this._channel.emit(event, data);
  }

  public resize = () => {
    const rect = document.documentElement.getBoundingClientRect();
    if (this._prevHeight === rect.height) {
      return;
    }

    this._prevHeight = rect.height;
    this._channel.emit('resize', {
      height: rect.height,
      width: rect.width,
    });
  };
}

export { Client };
